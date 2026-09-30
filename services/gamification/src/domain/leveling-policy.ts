/**
 * Domain Service: LevelingPolicy
 *
 * Centraliza las reglas de negocio de nivelación. Antes estos if/else
 * estaban hardcodeados dentro de GamificationService.awardPoints(),
 * mezclando política de dominio con lógica de aplicación.
 *
 * Al ser un objeto de dominio puro (sin dependencias de infraestructura),
 * es fácil de testear y de modificar sin tocar el service.
 */
export interface Level {
  level: number;
  levelName: string;
}

export class LevelingPolicy {
  /**
   * Umbrales de puntos para cada nivel (orden descendente para que el
   * primer match gane, tal como funcionaban los if-else originales).
   */
  private static readonly THRESHOLDS: Level[] = [
    { level: 4, levelName: 'Campeón Sostenible' },
    { level: 3, levelName: 'Eco-Guerrero' },
    { level: 2, levelName: 'Consciente' },
    { level: 1, levelName: 'Principiante' },
  ];

  private static readonly POINTS_PER_THRESHOLD: number[] = [1501, 501, 101, 0];

  /**
   * Calcula el nivel correspondiente a una cantidad de puntos.
   * @returns Level con el número de nivel y el nombre descriptivo.
   */
  static computeLevel(points: number): Level {
    for (let i = 0; i < LevelingPolicy.THRESHOLDS.length; i++) {
      if (points >= LevelingPolicy.POINTS_PER_THRESHOLD[i]) {
        return LevelingPolicy.THRESHOLDS[i];
      }
    }
    // Fallback defensivo: siempre hay al menos nivel 1
    return LevelingPolicy.THRESHOLDS[LevelingPolicy.THRESHOLDS.length - 1];
  }

  /**
   * Indica cuántos puntos faltan para alcanzar el siguiente nivel.
   * Retorna 0 si ya está en el nivel máximo.
   */
  static pointsToNextLevel(points: number): number {
    const nextThresholdByLevel = [101, 501, 1501];
    const level = LevelingPolicy.computeLevel(points).level;
    const nextThreshold = nextThresholdByLevel[level - 1];
    return nextThreshold === undefined ? 0 : Math.max(0, nextThreshold - points);
  }
}
