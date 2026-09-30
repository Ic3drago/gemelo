/** Tarifa residencial referencial, editable y no oficial. */
export class ElectricityTariff {
  static readonly FIXED_CHARGE_BS = 5;
  static readonly PUBLIC_LIGHTING_RATE = 0.06;
  static readonly CO2_KG_PER_KWH = 0.5;
  static readonly TIERS = [
    { limit: 30, rate: 0.75 },
    { limit: 70, rate: 0.89 },
    { limit: 100, rate: 1.0 },
    { limit: Number.POSITIVE_INFINITY, rate: 1.15 },
  ] as const;

  static calculate(kWh: number) {
    if (!Number.isFinite(kWh) || kWh <= 0) {
      throw new Error('El consumo debe ser un número mayor que cero.');
    }

    let remaining = kWh;
    let tieredChargeBs = 0;
    const tiers = ElectricityTariff.TIERS.map(({ limit, rate }) => {
      const consumed = Math.min(remaining, limit);
      const chargeBs = consumed * rate;
      remaining -= consumed;
      tieredChargeBs += chargeBs;
      return { limit: Number.isFinite(limit) ? limit : null, rate, kWh: consumed, chargeBs };
    }).filter((tier) => tier.kWh > 0);

    const publicLightingBs = tieredChargeBs * ElectricityTariff.PUBLIC_LIGHTING_RATE;
    return {
      tiers,
      tieredChargeBs: Number(tieredChargeBs.toFixed(2)),
      fixedChargeBs: ElectricityTariff.FIXED_CHARGE_BS,
      publicLightingBs: Number(publicLightingBs.toFixed(2)),
      totalBs: Number((tieredChargeBs + ElectricityTariff.FIXED_CHARGE_BS + publicLightingBs).toFixed(2)),
      co2Kg: Number((kWh * ElectricityTariff.CO2_KG_PER_KWH).toFixed(2)),
      referential: true,
    };
  }
}