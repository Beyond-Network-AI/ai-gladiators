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