/**
 * Value Object: CarbonFactor
 *
 * Encapsula el factor de conversión kWh → kg CO₂ y la tarifa eléctrica.
 * Al ser un value object es inmutable: una vez construido no puede cambiar.
 * Cualquier modificación produce una nueva instancia.
 */
export class CarbonFactor {
  /** kg CO₂ emitidos por cada kWh consumido (mix eléctrico venezolano estimado) */
  static readonly KG_CO2_PER_KWH = 0.5;

  /** Costo en Bs por kWh según tarifa residencial base */
  static readonly BS_PER_KWH = 0.89;

  private constructor(
    readonly kgCo2PerKwh: number,
    readonly bsPerKwh: number,
  ) {}

  static default(): CarbonFactor {
    return new CarbonFactor(CarbonFactor.KG_CO2_PER_KWH, CarbonFactor.BS_PER_KWH);
  }

  static custom(kgCo2PerKwh: number, bsPerKwh: number): CarbonFactor {
    if (kgCo2PerKwh < 0) throw new Error('El factor de CO₂ no puede ser negativo');
    if (bsPerKwh < 0) throw new Error('La tarifa Bs/kWh no puede ser negativa');
    return new CarbonFactor(kgCo2PerKwh, bsPerKwh);
  }

  computeCo2(kWh: number): number {
    return kWh * this.kgCo2PerKwh;
  }

  computeCost(kWh: number): number {
    return kWh * this.bsPerKwh;
  }

  equals(other: CarbonFactor): boolean {
    return this.kgCo2PerKwh === other.kgCo2PerKwh && this.bsPerKwh === other.bsPerKwh;
  }
}
