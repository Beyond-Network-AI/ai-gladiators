// Game Constants

// Canvas dimensions
export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 600;

// Colors
export const COLORS = {
  background: '#2d2d2d',
  primaryText: '#ffffff',
  secondaryText: '#cccccc',
  highlight: '#4488AA'
};

// Game settings
export const MATCH_DURATION = 60; // seconds
export const RESET_TIME = 5; // seconds between matches

// Gladiator stats ranges
export const GLADIATOR_STAT_RANGES = {
  strength: { min: 5, max: 15 },
  speed: { min: 100, max: 200 },
  defense: { min: 1, max: 5 },
  intelligence: { min: 1, max: 3 },
  aggression: { min: 0.3, max: 0.9 },
  luck: { min: 0, max: 0.2 }
};

// Collection of Phaser example sprite URLs for gladiators
export const GLADIATOR_SPRITES = [
  // Character sprites
  'https://labs.phaser.io/assets/sprites/phaser-dude.png',
  'https://labs.phaser.io/assets/sprites/phaser-ship.png',
  'https://labs.phaser.io/assets/sprites/spinObj_01.png',
  'https://labs.phaser.io/assets/sprites/mushroom2.png',
  'https://labs.phaser.io/assets/sprites/ship.png',
  'https://labs.phaser.io/assets/sprites/thrust_ship.png',
  'https://labs.phaser.io/assets/sprites/ufo.png',
  'https://labs.phaser.io/assets/sprites/sonic_havok_sanity.png',
  'https://labs.phaser.io/assets/sprites/clown.png',
  'https://labs.phaser.io/assets/sprites/wizball.png',
  'https://labs.phaser.io/assets/sprites/beball1.png',
  'https://labs.phaser.io/assets/sprites/xenon2_ship.png',
  'https://labs.phaser.io/assets/sprites/bsquadron1.png'
];

// Reserve one sprite as fallback
export const FALLBACK_SPRITE = 'https://labs.phaser.io/assets/sprites/mushroom2.png'; 