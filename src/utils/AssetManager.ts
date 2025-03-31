/**
 * AssetManager.ts
 * 
 * Centralized asset management utility for the AI Gladiators game.
 * Provides standardized access to assets and asset keys across the codebase.
 */

// Gladiator sprites
export const GLADIATOR_SPRITES = {
  RED: 'gladiator_red',
  BLUE: 'gladiator_blue',
  GREEN: 'gladiator_green',
  YELLOW: 'gladiator_yellow'
};

// Power-up sprites
export const POWERUP_SPRITES = {
  SHIELD: 'powerup_shield',
  TRAP: 'powerup_trap',
  CHAOS: 'powerup_chaos'
};

// Hazard sprites
export const HAZARD_SPRITES = {
  SPIKE: 'hazard_spike',
  FIREBALL: 'hazard_fireball'
};

// Arena sprites
export const ARENA_SPRITES = {
  TILESET: 'tileset',
  BACKGROUND: 'background'
};

// UI elements
export const UI_SPRITES = {
  BUTTON: 'button',
  PANEL: 'panel',
  COIN: 'coin'
};

// Return a random gladiator sprite key
export function getRandomGladiatorSprite(): string {
  const sprites = Object.values(GLADIATOR_SPRITES);
  return sprites[Math.floor(Math.random() * sprites.length)];
}

// Map gladiator sprites to colors for visual consistency
export const GLADIATOR_COLORS = {
  [GLADIATOR_SPRITES.RED]: 0xff0000,
  [GLADIATOR_SPRITES.BLUE]: 0x0000ff,
  [GLADIATOR_SPRITES.GREEN]: 0x00ff00,
  [GLADIATOR_SPRITES.YELLOW]: 0xffff00
};

// Get a color for particle effects based on sprite key
export function getParticleColorFromSprite(spriteKey: string): number {
  return GLADIATOR_COLORS[spriteKey] || 0xffffff;
} 