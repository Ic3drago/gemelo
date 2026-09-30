/**
 * Domain Service: PointsPolicy
 *
 * Centraliza las reglas de asignación de puntos por tipo de evento.
 * Antes estas reglas vivían dentro de EventConsumerService.processEvent(),
 * mezclando lógica de dominio con infraestructura de mensajería (amqplib).
 *
 * Al extraerlas aquí, el consumer de RabbitMQ se convierte en un simple
 * adaptador que traduce mensajes a llamadas de dominio.
 */
export interface PointsAward {
  points: number;
  reason: string;
}

export class PointsPolicy {
  // ─── Constantes de dominio (sin magic numbers dispersos) ─────────────────

  /** Puntos por registrar una compra */
  static readonly POINTS_PURCHASE = 5;
  static readonly POINTS_BILL_SAVED = 3;

  /** Puntos por lectura energética eficiente (< ENERGY_EFFICIENT_THRESHOLD kWh) */
  static readonly POINTS_ENERGY_EFFICIENT = 15;

  /** Puntos por lectura energética normal */
  static readonly POINTS_ENERGY_NORMAL = 3;

  /** Umbral de kWh por debajo del cual una lectura es "eficiente" */
  static readonly ENERGY_EFFICIENT_THRESHOLD_KWH = 5;

  /** Puntos por consumir un alimento sin desperdiciarlo */
  static readonly POINTS_FOOD_CONSUMED = 10;

  /** Penalización por desperdiciar un alimento */
  static readonly POINTS_FOOD_WASTED = -5;

  // ─── Métodos de política ──────────────────────────────────────────────────

  static forPurchase(item: string): PointsAward {
    return {
      points: PointsPolicy.POINTS_PURCHASE,
      reason: `Compra registrada: ${item}`,
    };
  }

  static forBillSaved(): PointsAward {
    return { points: PointsPolicy.POINTS_BILL_SAVED, reason: 'Factura de luz registrada' };
  }

  static forEnergyReading(kWh: number): PointsAward {
    const isEfficient = kWh < PointsPolicy.ENERGY_EFFICIENT_THRESHOLD_KWH;
    return isEfficient
      ? { points: PointsPolicy.POINTS_ENERGY_EFFICIENT, reason: 'Lectura energética eficiente' }
      : { points: PointsPolicy.POINTS_ENERGY_NORMAL,    reason: 'Lectura registrada' };
  }

  static forFoodConsumed(name: string): PointsAward {
    return {
      points: PointsPolicy.POINTS_FOOD_CONSUMED,
      reason: `Alimento consumido sin desperdiciar: ${name}`,
    };
  }

  static forFoodWasted(name: string): PointsAward {
    return {
      points: PointsPolicy.POINTS_FOOD_WASTED,
      reason: `Desperdicio de alimento: ${name}`,
    };
  }
}
