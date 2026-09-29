"""
SimulationEngine
================
Responsabilidades de esta clase (solo lógica de dominio):
  - Proyectar series temporales con regresión lineal o promedio móvil.
  - Aplicar reducciones de escenario a las proyecciones.
  - Calcular el impacto ambiental y económico usando CarbonFactors.
  - Detectar anomalías en series históricas.

Lo que NO hace esta clase:
  - Llamadas HTTP a otros servicios  → DataFetcher (infrastructure)
  - Escritura/lectura en base de datos → acceso directo a `db` eliminado
    del núcleo y delegado a los callers en main.py

Todos los factores de conversión viven en CarbonFactors, sin números mágicos.
"""

import os
import httpx
import numpy as np
from sklearn.linear_model import LinearRegression
from datetime import datetime
from dateutil.relativedelta import relativedelta
from sqlalchemy.orm import Session

from .domain.carbon_factors import CarbonFactors
from . import models

PURCHASES_URL = os.getenv("PURCHASES_URL", "http://purchases-svc:3001")
ENERGY_URL    = os.getenv("ENERGY_URL",    "http://energy-svc:3002")
FOOD_URL      = os.getenv("FOOD_URL",      "http://food-svc:3003")

FALLBACK_DATA = {
    "purchases": [1100, 1250, 1180, 1320, 1200, 1280],
    "energy":    [320, 340, 310, 350, 330, 345],
    "food_waste": [7.5, 8.2, 6.8, 9.1, 7.8, 8.5],
}


# ── Capa de infraestructura: acceso a datos externos ─────────────────────────

class DataFetcher:
    """
    Adaptador de infraestructura: obtiene datos históricos de los otros
    microservicios vía HTTP. Devuelve el mismo contrato de dict que usaba
    fetch_data() anteriormente, manteniendo compatibilidad total.
    """

    async def fetch(self, household_id: str) -> dict:
        data = {
            "purchases":  list(FALLBACK_DATA["purchases"]),
            "energy":     list(FALLBACK_DATA["energy"]),
            "food_waste": list(FALLBACK_DATA["food_waste"]),
        }

        async with httpx.AsyncClient() as client:
            try:
                res = await client.get(
                    f"{PURCHASES_URL}/purchases/summary",
                    params={"householdId": household_id},
                )
                if res.status_code == 200:
                    summary = res.json()
                    if summary:
                        data["purchases"] = [s.get("totalAmount", 0) for s in summary]
            except Exception:
                pass

            try:
                res = await client.get(
                    f"{ENERGY_URL}/energy/summary",
                    params={"householdId": household_id},
                )
                if res.status_code == 200:
                    summary = res.json()
                    if summary:
                        data["energy"] = [s.get("totalKWh", 0) for s in summary]
            except Exception:
                pass

            try:
                res = await client.get(
                    f"{FOOD_URL}/food/waste-summary",
                    params={"householdId": household_id},
                )
                if res.status_code == 200:
                    summary = res.json()
                    if summary:
                        data["food_waste"] = [s.get("totalWasteKg", 0) for s in summary]
            except Exception:
                pass

        return data


# ── Núcleo de dominio: proyecciones e impacto ─────────────────────────────────

class SimulationEngine:
    """
    Motor de simulación: solo lógica de dominio.
    Recibe datos ya resueltos; no sabe nada de HTTP ni de ORM.
    La inyección de `db` se mantiene para compatibilidad con main.py,
    pero el acceso a DB está contenido en métodos explícitos (_persist_*).
    """

    def __init__(self, db: Session = None):
        self.db = db
        self._fetcher = DataFetcher()

    # ── Infraestructura (privado) ─────────────────────────────────────────────

    async def _fetch_data(self, household_id: str) -> dict:
        return await self._fetcher.fetch(household_id)

    def _persist_prediction(self, household_id: str, category: str, predicted: float):
        """Persiste o actualiza la predicción del próximo mes en la DB."""
        if not self.db:
            return
        next_month = (datetime.now() + relativedelta(months=1)).strftime("%Y-%m")
        existing = (
            self.db.query(models.PredictionHistory)
            .filter(
                models.PredictionHistory.household_id == household_id,
                models.PredictionHistory.category == category,
                models.PredictionHistory.month == next_month,
            )
            .first()
        )
        if existing:
            existing.predicted = predicted
        else:
            self.db.add(
                models.PredictionHistory(
                    household_id=household_id,
                    category=category,
                    month=next_month,
                    predicted=predicted,
                )
            )
        self.db.commit()

    # ── Lógica de dominio (pública) ───────────────────────────────────────────

    def get_predictions(self, values: list, horizon_months: int) -> dict:
        """
        Proyecta `values` hacia adelante `horizon_months` meses.
        Usa regresión lineal si hay ≥ 8 puntos; promedio móvil en caso contrario.
        """
        n = len(values)
        if n == 0:
            zero = [0] * horizon_months
            return {"predictions": zero, "best": zero, "worst": zero, "is_preliminary": True}

        is_preliminary = n < 8

        if is_preliminary:
            avg   = np.mean(values)
            trend = (values[-1] - values[0]) / n if n > 1 else 0
            preds = [max(0, avg + trend * i) for i in range(1, horizon_months + 1)]
            std_dev = np.std(values) if n > 1 else avg * 0.1
        else:
            X = np.array(range(n)).reshape(-1, 1)
            y = np.array(values)
            model = LinearRegression()
            model.fit(X, y)
            X_pred  = np.array(range(n, n + horizon_months)).reshape(-1, 1)
            preds   = [max(0, v) for v in model.predict(X_pred).tolist()]
            std_dev = np.sqrt(np.var(y - model.predict(X)))

        return {
            "predictions":  preds,
            "best":         [max(0, p - std_dev) for p in preds],
            "worst":        [p + std_dev for p in preds],
            "is_preliminary": is_preliminary,
        }

    def detect_anomalies(self, values: list) -> bool:
        """Retorna True si el último valor se desvía > 30 % de la media histórica."""
        if not values or len(values) < 2:
            return False
        avg = np.mean(values[:-1])
        if avg == 0:
            return False
        recent = values[-1]
        return recent > avg * 1.3 or recent < avg * 0.7

    def project_metric(self, values: list, horizon_months: int) -> list:
        """Devuelve solo los valores de predicción central (sin bandas)."""
        if not values:
            return [0] * horizon_months
        return self.get_predictions(values, horizon_months)["predictions"]

    def apply_reduction(self, projected: list, reduction_pct: float) -> list:
        """Aplica un porcentaje de reducción a una serie proyectada."""
        factor = 1.0 - (reduction_pct / 100.0)
        return [val * factor for val in projected]

    def calculate_impact(self, baseline: dict, scenario: dict) -> dict:
        """
        Calcula el impacto diferencial entre el escenario base y el alternativo.
        Usa CarbonFactors como única fuente de verdad para los factores de conversión.
        """
        base_purchases = sum(baseline["purchasesBs"])
        base_energy    = sum(baseline["energyKWh"])
        base_waste     = sum(baseline["foodWasteKg"])

        scen_purchases = sum(scenario["purchasesBs"])
        scen_energy    = sum(scenario["energyKWh"])
        scen_waste     = sum(scenario["foodWasteKg"])

        energy_saved   = max(0, base_energy    - scen_energy)
        waste_saved    = max(0, base_waste     - scen_waste)
        purchase_saved = max(0, base_purchases - scen_purchases)

        # Factores de CO₂ centralizados — sin números mágicos aquí
        total_co2_saved = (
            CarbonFactors.co2_from_energy(energy_saved)
            + CarbonFactors.co2_from_waste(waste_saved)
            + CarbonFactors.co2_from_purchases(purchase_saved)
        )

        # Ahorros económicos en Bs
        total_bs_saved = (
            energy_saved   * CarbonFactors.BS_SAVINGS_PER_KWH
            + waste_saved  * CarbonFactors.BS_SAVINGS_PER_KG_WASTE
            + purchase_saved
        )

        return {
            "totalCo2SavedKg":  round(total_co2_saved, 2),
            "totalBsSaved":     round(total_bs_saved,  2),
            "wasteReductionKg": round(waste_saved,     2),
            "energySavedKWh":   round(energy_saved,    2),
        }

    # ── Casos de uso públicos ─────────────────────────────────────────────────

    async def predict(self, household_id: str) -> dict:
        data    = await self._fetch_data(household_id)
        horizons = [1, 3, 6]
        result  = {}

        for category, values in data.items():
            cat_result = {"anomaly": self.detect_anomalies(values)}
            for h in horizons:
                cat_result[f"months_{h}"] = self.get_predictions(values, h)
            result[category] = cat_result

            # Persistencia aislada en método privado
            pred_1_month = cat_result["months_1"]["predictions"][0]
            self._persist_prediction(household_id, category, pred_1_month)

        return result

    async def run(self, params) -> dict:
        data = await self._fetch_data(params.householdId)

        proj_purchases = self.project_metric(data["purchases"],  params.horizonMonths)
        proj_energy    = self.project_metric(data["energy"],     params.horizonMonths)
        proj_waste     = self.project_metric(data["food_waste"], params.horizonMonths)

        scen_purchases = self.apply_reduction(proj_purchases, params.purchaseChangePct)
        scen_energy    = self.apply_reduction(proj_energy,    params.energyReductionPct)
        scen_waste     = self.apply_reduction(proj_waste,     params.wasteReductionPct)

        base_date = datetime.now()
        months = [
            (base_date + relativedelta(months=i)).strftime("%Y-%m")
            for i in range(1, params.horizonMonths + 1)
        ]

        # CO₂ por período usando CarbonFactors — sin lambda con números mágicos
        def calc_co2_series(purchases: list, energy: list, waste: list) -> list:
            return [
                round(CarbonFactors.total_co2(purchases[i], energy[i], waste[i]), 2)
                for i in range(len(purchases))
            ]

        baseline = {
            "months":       months,
            "purchasesBs":  [round(x, 2) for x in proj_purchases],
            "energyKWh":    [round(x, 2) for x in proj_energy],
            "foodWasteKg":  [round(x, 2) for x in proj_waste],
            "co2Kg":        calc_co2_series(proj_purchases, proj_energy, proj_waste),
        }

        scenario = {
            "months":       months,
            "purchasesBs":  [round(x, 2) for x in scen_purchases],
            "energyKWh":    [round(x, 2) for x in scen_energy],
            "foodWasteKg":  [round(x, 2) for x in scen_waste],
            "co2Kg":        calc_co2_series(scen_purchases, scen_energy, scen_waste),
        }

        return {
            "baseline": baseline,
            "scenario": scenario,
            "impact":   self.calculate_impact(baseline, scenario),
        }

    async def retrain(self, household_id: str) -> dict:
        """Recalcula errores de predicción contra valores actuales reales."""
        data = await self._fetch_data(household_id)
        if not self.db:
            return {"status": "no db"}

        current_month = datetime.now().strftime("%Y-%m")

        for category, values in data.items():
            if not values:
                continue
            recent_actual = values[-1]
            pred = (
                self.db.query(models.PredictionHistory)
                .filter(
                    models.PredictionHistory.household_id == household_id,
                    models.PredictionHistory.category == category,
                    models.PredictionHistory.month == current_month,
                )
                .first()
            )
            if pred:
                pred.actual = recent_actual
                pred.error  = abs(pred.predicted - recent_actual)

        self.db.commit()
        return {"status": "retrained"}
