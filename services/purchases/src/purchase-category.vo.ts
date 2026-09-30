/**
 * Value Object: PurchaseCategory
 *
 * Encapsula la categoría de una compra y el factor de huella de carbono
 * asociado a cada tipo. Elimina el string libre con comentario enumerado
 * que existía en la entidad.
 */
export class PurchaseCategory {
  static readonly VALID_CATEGORIES = [
    'alimentos',
    'servicios',
    'transporte',
    'ocio',
    'hogar',
  ] as const;

  private static readonly LEGACY_CATEGORIES: Record<string, string> = {
    mercado: 'alimentos', supermercado: 'alimentos', feria: 'alimentos', carnes: 'alimentos',
    verduras: 'alimentos', lacteos: 'alimentos', panaderia: 'alimentos', limpieza: 'hogar',
    snacks: 'ocio', otros: 'hogar',
  };

  /**
   * kg CO₂ por cada Bs gastado, estimado por categoría de compra.
   * Basado en factores de emisión de ciclo de vida simplificados.
   */
  private static readonly CO2_FACTOR_PER_BS: Record<string, number> = {
    mercado:      0.008,
    supermercado: 0.010,
    feria:        0.005, // productos locales: menor huella
    servicios:    0.002,
    transporte:   0.015,
    carnes:       0.020, // mayor huella por kg producido
    verduras:     0.004,
    lacteos:      0.009,
    panaderia:    0.006,
    limpieza:     0.007,
    snacks:       0.012,
    otros:        0.010,
    alimentos:    0.008,
    ocio:         0.010,
    hogar:        0.007,
  };

  private constructor(readonly value: string) {}

  static of(value: string): PurchaseCategory {
    const raw = value?.toLowerCase().trim();
    const normalized = PurchaseCategory.LEGACY_CATEGORIES[raw] ?? raw;
    if (!PurchaseCategory.VALID_CATEGORIES.includes(normalized as any)) {
      throw new Error(
        `Categoría de compra inválida: "${value}". ` +
        `Valores permitidos: ${PurchaseCategory.VALID_CATEGORIES.join(', ')}`,
      );
    }
    return new PurchaseCategory(normalized);
  }

  /** kg CO₂ estimados para un gasto de `amountBs` en esta categoría */
  computeCo2(amountBs: number): number {
    const factor = PurchaseCategory.CO2_FACTOR_PER_BS[this.value] ?? 0.01;
    return amountBs * factor;
  }

  equals(other: PurchaseCategory): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
