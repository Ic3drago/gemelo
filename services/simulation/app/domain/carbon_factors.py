"""
Domain constants: CarbonFactors
================================
Centraliza todos los factores de conversión a CO₂ y los precios unitarios
usados en el cálculo de impacto ambiental y económico.

Antes estos números mágicos estaban dispersos en tres lugares de simulation.py:
  - calculate_impact(): 0.5, 2.5, 0.01, 0.89, 15.0
  - run() → calc_co2 lambda: 0.01, 0.5, 2.5

Al estar aquí como constantes nombradas con docstring, cualquier cambio
de factor (p.ej. actualización del mix eléctrico) se hace en un único lugar.
"""


class CarbonFactors:
    # ── Energía ───────────────────────────────────────────────────────────────

    #: kg CO₂ emitidos por cada kWh consumido (mix eléctrico venezolano estimado)
    KG_CO2_PER_KWH: float = 0.5

    #: Bs ahorrados por cada kWh reducido (tarifa residencial base)
    BS_SAVINGS_PER_KWH: float = 0.89

    # ── Alimentos desperdiciados ──────────────────────────────────────────────

    #: kg CO₂ emitidos por cada kg de alimento desperdiciado (ciclo de vida)
    KG_CO2_PER_KG_WASTE: float = 2.5

    #: Bs ahorrados por cada kg de desperdicio evitado (costo promedio alimento)
    BS_SAVINGS_PER_KG_WASTE: float = 15.0

    # ── Compras ───────────────────────────────────────────────────────────────

    #: kg CO₂ emitidos por cada Bs de compra (factor de emisión de consumo)
    KG_CO2_PER_BS_PURCHASE: float = 0.01

    # ── Métodos de cálculo ────────────────────────────────────────────────────

    @classmethod
    def co2_from_energy(cls, kwh: float) -> float:
        """kg CO₂ generados por `kwh` kWh consumidos."""
        return kwh * cls.KG_CO2_PER_KWH

    @classmethod
    def co2_from_waste(cls, kg_waste: float) -> float:
        """kg CO₂ generados por `kg_waste` kg de alimento desperdiciado."""
        return kg_waste * cls.KG_CO2_PER_KG_WASTE

    @classmethod
    def co2_from_purchases(cls, amount_bs: float) -> float:
        """kg CO₂ generados por `amount_bs` Bs de compras."""
        return amount_bs * cls.KG_CO2_PER_BS_PURCHASE

    @classmethod
    def total_co2(cls, purchases_bs: float, energy_kwh: float, waste_kg: float) -> float:
        """kg CO₂ totales combinando los tres vectores de consumo."""
        return (
            cls.co2_from_purchases(purchases_bs)
            + cls.co2_from_energy(energy_kwh)
            + cls.co2_from_waste(waste_kg)
        )
