// Gladiator Stats Interface

export interface IGladiatorStats {
  strength: number;     // affects damage (5-15)
  speed: number;        // movement speed (100-200 pixels/sec)
  defense: number;      // damage resistance (1-5)
  intelligence: number; // better reaction to power-ups (1-3)
  aggression: number;   // % chance to engage (0.3-0.9)
  luck: number;         // dodge/crit factor (0-0.2)
  health?: number;      // current health points
  maxHealth?: number;   // maximum health points
} 