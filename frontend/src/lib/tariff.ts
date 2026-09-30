export const ELECTRICITY_TARIFF = {
  fixedChargeBs: 5,
  publicLightingRate: 0.06,
  co2KgPerKwh: 0.5,
  referential: true,
  tiers: [
    { limit: 30, rate: 0.75 },
    { limit: 100, rate: 0.89 },
    { limit: 200, rate: 1 },
    { limit: Number.POSITIVE_INFINITY, rate: 1.15 },
  ],
} as const;

export function calculateElectricityBill(kWh: number) {
  if (!Number.isFinite(kWh) || kWh <= 0) throw new Error('El consumo debe ser mayor que cero.');
  let remaining = kWh;
  let previousLimit = 0;
  let tieredChargeBs = 0;
  const tiers = ELECTRICITY_TARIFF.tiers.flatMap(({ limit, rate }) => {
    const available = limit === Number.POSITIVE_INFINITY ? remaining : limit - previousLimit;
    const consumed = Math.min(remaining, available);
    if (limit !== Number.POSITIVE_INFINITY) previousLimit = limit;
    remaining -= consumed;
    if (consumed <= 0) return [];
    const chargeBs = consumed * rate;
    tieredChargeBs += chargeBs;
    return [{ limit: Number.isFinite(limit) ? limit : null, rate, kWh: consumed, chargeBs: Number(chargeBs.toFixed(2)) }];
  });
  const publicLightingBs = tieredChargeBs * ELECTRICITY_TARIFF.publicLightingRate;
  return {
    tiers,
    tieredChargeBs: Number(tieredChargeBs.toFixed(2)),
    fixedChargeBs: ELECTRICITY_TARIFF.fixedChargeBs,
    publicLightingBs: Number(publicLightingBs.toFixed(2)),
    totalBs: Number((tieredChargeBs + ELECTRICITY_TARIFF.fixedChargeBs + publicLightingBs).toFixed(2)),
    co2Kg: Number((kWh * ELECTRICITY_TARIFF.co2KgPerKwh).toFixed(2)),
    referential: true,
  };
}