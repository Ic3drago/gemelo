/**
 * Value Object: FoodStatus
 *
 * Encapsula los estados posibles de un alimento y las transiciones
 * válidas entre ellos. Elimina los strings libres dispersos por el código.
 */
export class FoodStatus {
  static readonly STORED   = new FoodStatus('stored');
  static readonly CONSUMED = new FoodStatus('consumed');
  static readonly WASTED   = new FoodStatus('wasted');

  private static readonly ALL = [
    FoodStatus.STORED,
    FoodStatus.CONSUMED,
    FoodStatus.WASTED,
  ];

  /**
   * Transiciones permitidas: desde qué estado se puede llegar a cuál.
   * Un alimento solo puede pasar de 'stored' a otro estado, nunca volver atrás.
   */
  private static readonly TRANSITIONS: Record<string, string[]> = {
    stored:   ['consumed', 'wasted'],
    consumed: [],
    wasted:   [],
  };

  private constructor(readonly value: string) {}

  static of(value: string): FoodStatus {
    const found = FoodStatus.ALL.find(s => s.value === value?.toLowerCase().trim());
    if (!found) {
      throw new Error(
        `Estado de alimento inválido: "${value}". ` +
        `Valores permitidos: ${FoodStatus.ALL.map(s => s.value).join(', ')}`,
      );
    }
    return found;
  }

  /** Valida que la transición desde el estado actual al nuevo sea legal */
  canTransitionTo(next: FoodStatus): boolean {
    return FoodStatus.TRANSITIONS[this.value]?.includes(next.value) ?? false;
  }

  isWasted(): boolean   { return this.value === 'wasted'; }
  isConsumed(): boolean { return this.value === 'consumed'; }
  isStored(): boolean   { return this.value === 'stored'; }

  equals(other: FoodStatus): boolean { return this.value === other.value; }
  toString(): string { return this.value; }
}
