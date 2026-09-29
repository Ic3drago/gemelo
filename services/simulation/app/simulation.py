import os
import httpx
import numpy as np
from sklearn.linear_model import LinearRegression
from datetime import datetime
from dateutil.relativedelta import relativedelta
from sqlalchemy.orm import Session
from . import models

PURCHASES_URL = os.getenv("PURCHASES_URL", "http://purchases-svc:3001")
ENERGY_URL = os.getenv("ENERGY_URL", "http://energy-svc:3002")
FOOD_URL = os.getenv("FOOD_URL", "http://food-svc:3003")

FALLBACK_DATA = {
    "purchases": [1100, 1250, 1180, 1320, 1200, 1280],
    "energy": [320, 340, 310, 350, 330, 345],
    "food_waste": [7.5, 8.2, 6.8, 9.1, 7.8, 8.5]
}

class SimulationEngine:
    def __init__(self, db: Session = None):
        self.db = db

    async def fetch_data(self, household_id: str):
        data = {
            "purchases": list(FALLBACK_DATA["purchases"]),
            "energy": list(FALLBACK_DATA["energy"]),
            "food_waste": list(FALLBACK_DATA["food_waste"])
        }
        
        async with httpx.AsyncClient() as client:
            try:
                res = await client.get(f"{PURCHASES_URL}/purchases/summary", params={"householdId": household_id})
                if res.status_code == 200:
                    summary = res.json()
                    if summary:
                        data["purchases"] = [s.get("totalAmount", 0) for s in summary]
            except Exception:
                pass
            
            try:
                res = await client.get(f"{ENERGY_URL}/energy/summary", params={"householdId": household_id})
                if res.status_code == 200:
                    summary = res.json()
                    if summary:
                        data["energy"] = [s.get("totalKWh", 0) for s in summary]
            except Exception:
                pass

            try:
                res = await client.get(f"{FOOD_URL}/food/waste-summary", params={"householdId": household_id})
                if res.status_code == 200:
                    summary = res.json()
                    if summary:
                        data["food_waste"] = [s.get("totalWasteKg", 0) for s in summary]
            except Exception:
                pass

        return data

    def get_predictions(self, values, horizon_months):
        n = len(values)
        if n == 0:
            return {
                "predictions": [0] * horizon_months,
                "best": [0] * horizon_months,
                "worst": [0] * horizon_months,
                "is_preliminary": True
            }
        
        is_preliminary = n < 8
        if is_preliminary:
            avg = np.mean(values)
            trend = (values[-1] - values[0]) / n if n > 1 else 0
            
            preds = []
            for i in range(1, horizon_months + 1):
                val = avg + trend * i
                preds.append(max(0, val))
            
            std_dev = np.std(values) if n > 1 else avg * 0.1
            
            return {
                "predictions": preds,
                "best": [max(0, p - std_dev) for p in preds],
                "worst": [p + std_dev for p in preds],
                "is_preliminary": True
            }
            
        else:
            X = np.array(range(n)).reshape(-1, 1)
            y = np.array(values)
            model = LinearRegression()
            model.fit(X, y)
            
            X_pred = np.array(range(n, n + horizon_months)).reshape(-1, 1)
            y_pred = model.predict(X_pred)
            preds = [max(0, val) for val in y_pred.tolist()]
            
            residuals = y - model.predict(X)
            variance = np.var(residuals)
            std_dev = np.sqrt(variance)
            
            return {
                "predictions": preds,
                "best": [max(0, p - std_dev) for p in preds],
                "worst": [p + std_dev for p in preds],
                "is_preliminary": False
            }

    def detect_anomalies(self, values):
        if not values or len(values) < 2:
            return False
            
        avg = np.mean(values[:-1])
        if avg == 0:
            return False
            
        recent = values[-1]
        
        if recent > avg * 1.3 or recent < avg * 0.7:
            return True
            
        return False
        
    async def predict(self, household_id: str):
        data = await self.fetch_data(household_id)
        
        horizons = [1, 3, 6]
        result = {}
        
        for category, values in data.items():
            cat_result = {
                "anomaly": self.detect_anomalies(values)
            }
            
            for h in horizons:
                preds = self.get_predictions(values, h)
                cat_result[f"months_{h}"] = preds
            
            result[category] = cat_result
            
            if self.db:
                pred_1_month = cat_result["months_1"]["predictions"][0]
                next_month = (datetime.now() + relativedelta(months=1)).strftime("%Y-%m")
                
                existing = self.db.query(models.PredictionHistory).filter(
                    models.PredictionHistory.household_id == household_id,
                    models.PredictionHistory.category == category,
                    models.PredictionHistory.month == next_month
                ).first()
                
                if existing:
                    existing.predicted = pred_1_month
                else:
                    new_pred = models.PredictionHistory(
                        household_id=household_id,
                        category=category,
                        month=next_month,
                        predicted=pred_1_month
                    )
                    self.db.add(new_pred)
                self.db.commit()
                
        return result

    def project_metric(self, values, horizon_months):
        n = len(values)
        if n == 0:
            return [0] * horizon_months
        preds = self.get_predictions(values, horizon_months)
        return preds["predictions"]

    def apply_reduction(self, projected, reduction_pct):
        factor = 1.0 - (reduction_pct / 100.0)
        return [val * factor for val in projected]

    def calculate_impact(self, baseline, scenario):
        base_purchases = sum(baseline["purchasesBs"])
        base_energy = sum(baseline["energyKWh"])
        base_waste = sum(baseline["foodWasteKg"])
        
        scen_purchases = sum(scenario["purchasesBs"])
        scen_energy = sum(scenario["energyKWh"])
        scen_waste = sum(scenario["foodWasteKg"])
        
        energy_saved = max(0, base_energy - scen_energy)
        waste_saved = max(0, base_waste - scen_waste)
        
        energy_co2_saved = energy_saved * 0.5
        waste_co2_saved = waste_saved * 2.5
        purchases_co2_saved = max(0, base_purchases - scen_purchases) * 0.01
        
        total_co2_saved = energy_co2_saved + waste_co2_saved + purchases_co2_saved
        
        energy_bs_saved = energy_saved * 0.89
        waste_bs_saved = waste_saved * 15.0
        purchases_bs_saved = max(0, base_purchases - scen_purchases)
        
        total_bs_saved = energy_bs_saved + waste_bs_saved + purchases_bs_saved
        
        return {
            "totalCo2SavedKg": round(total_co2_saved, 2),
            "totalBsSaved": round(total_bs_saved, 2),
            "wasteReductionKg": round(waste_saved, 2),
            "energySavedKWh": round(energy_saved, 2)
        }

    async def run(self, params):
        data = await self.fetch_data(params.householdId)
        
        proj_purchases = self.project_metric(data["purchases"], params.horizonMonths)
        proj_energy = self.project_metric(data["energy"], params.horizonMonths)
        proj_waste = self.project_metric(data["food_waste"], params.horizonMonths)
        
        scen_purchases = self.apply_reduction(proj_purchases, params.purchaseChangePct)
        scen_energy = self.apply_reduction(proj_energy, params.energyReductionPct)
        scen_waste = self.apply_reduction(proj_waste, params.wasteReductionPct)
        
        base_date = datetime.now()
        months = []
        for i in range(1, params.horizonMonths + 1):
            next_month = base_date + relativedelta(months=i)
            months.append(next_month.strftime("%Y-%m"))
            
        def calc_co2(p, e, w):
            return [p[i]*0.01 + e[i]*0.5 + w[i]*2.5 for i in range(len(p))]
            
        base_co2 = calc_co2(proj_purchases, proj_energy, proj_waste)
        scen_co2 = calc_co2(scen_purchases, scen_energy, scen_waste)
        
        baseline = {
            "months": months,
            "purchasesBs": [round(x, 2) for x in proj_purchases],
            "energyKWh": [round(x, 2) for x in proj_energy],
            "foodWasteKg": [round(x, 2) for x in proj_waste],
            "co2Kg": [round(x, 2) for x in base_co2]
        }
        
        scenario = {
            "months": months,
            "purchasesBs": [round(x, 2) for x in scen_purchases],
            "energyKWh": [round(x, 2) for x in scen_energy],
            "foodWasteKg": [round(x, 2) for x in scen_waste],
            "co2Kg": [round(x, 2) for x in scen_co2]
        }
        
        impact = self.calculate_impact(baseline, scenario)
        
        return {
            "baseline": baseline,
            "scenario": scenario,
            "impact": impact
        }

    async def retrain(self, household_id: str):
        # Recalculate errors for past predictions
        data = await self.fetch_data(household_id)
        if not self.db:
            return {"status": "no db"}
            
        current_month = datetime.now().strftime("%Y-%m")
        
        for category, values in data.items():
            if not values:
                continue
            recent_actual = values[-1]
            
            # Find the prediction for the current month
            pred = self.db.query(models.PredictionHistory).filter(
                models.PredictionHistory.household_id == household_id,
                models.PredictionHistory.category == category,
                models.PredictionHistory.month == current_month
            ).first()
            
            if pred:
                pred.actual = recent_actual
                pred.error = abs(pred.predicted - recent_actual)
        
        self.db.commit()
        return {"status": "retrained"}
