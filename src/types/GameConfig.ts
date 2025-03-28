// Game configuration types and interfaces

// Game settings interface
export interface IGameSettings {
  debugMode: boolean;
  isDevMode: boolean;
}

// Default game settings
export const DEFAULT_GAME_SETTINGS: IGameSettings = {
  debugMode: false,
  isDevMode: true
}; 