// Arena Hazard Types Enum

export enum HazardType {
  SPIKE_WALL = 'spikeWall',    // Moving spike wall that causes instant KO
  FIREBALL = 'fireball'        // Falling fireball that damages gladiators on contact
}

// Hazard Direction Type for movement
export enum HazardDirection {
  HORIZONTAL = 'horizontal',
  VERTICAL = 'vertical',
  NONE = 'none'
}

// Hazard Configuration Interface
export interface IHazardConfig {
  type: HazardType;                // Type of hazard
  damage: number;                  // Damage dealt on contact
  direction?: HazardDirection;     // Direction of movement (if applicable)
  speed?: number;                  // Speed of movement (if applicable)
  lifetime?: number;               // How long the hazard lasts (in ms)
} 