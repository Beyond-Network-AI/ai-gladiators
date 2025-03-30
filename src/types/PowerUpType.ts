// Power-Up Types Enum

export enum PowerUpType {
  SHIELD = 'shield',   // Provides temporary damage reduction
  TRAP = 'trap',       // Damages and slows gladiators in a small radius
  CHAOS = 'chaos'      // Random effect (could be positive or negative)
}

// Power-Up Effect Interface
export interface IPowerUpEffect {
  duration: number;    // Effect duration in milliseconds
  multiplier: number;  // Effect strength multiplier
  type: PowerUpType;   // Type of power-up
} 