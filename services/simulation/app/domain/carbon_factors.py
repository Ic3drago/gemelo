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

    #: Estimación referencial de kg CO₂ por kWh consumido; no es un factor oficial.
    KG_CO2_PER_KWH: float = 0.5

    #: Estimación referencial de ahorro por kg de alimento no desperdiciado.
    BS_SAVINGS_PER_KG_WASTE: float = 20.0

    # ── Alimentos desperdiciados ──────────────────────────────────────────────

    #: kg CO₂ emitidos por cada kg de alimento desperdiciado (ciclo de vida)
    KG_CO2_PER_KG_WASTE: float = 2.5

    # ── Compras ───────────────────────────────────────────────────────────────

    #: kg CO₂ emitidos por cada Bs de compra (factor de emisión de consumo)
    KG_CO2_PER_BS_PURCHASE: float = 0.01

    # Tarifa residencial referencial editable. No representa una tarifa oficial.
    ELECTRICITY_TIERS: tuple[tuple[float | None, float], ...] = (
        (30.0, 0.75),
        (100.0, 0.89),
        (200.0, 1.00),
        (None, 1.15),
    )
    ELECTRICITY_FIXED_CHARGE_BS: float = 5.0
    PUBLIC_LIGHTING_RATE: float = 0.06

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

    @classmethod
    def electricity_bill(cls, kwh: float) -> float:
        """Calcula una factura referencial aplicando los tramos progresivos."""
        if kwh < 0:
            raise ValueError("El consumo de energía no puede ser negativo.")
        remaining = kwh
        tiered_charge = 0.0
        previous_limit = 0.0
        for limit, rate in cls.ELECTRICITY_TIERS:
            tier_size = remaining if limit is None else min(remaining, limit - previous_limit)
            tiered_charge += max(0.0, tier_size) * rate
            remaining -= max(0.0, tier_size)
            if limit is not None:
                previous_limit = limit
            if remaining <= 0:
                break
        return round(
            tiered_charge
            + cls.ELECTRICITY_FIXED_CHARGE_BS
            + tiered_charge * cls.PUBLIC_LIGHTING_RATE,
            2,
        )
