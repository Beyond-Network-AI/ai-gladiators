# AI Gladiators: Onchain Arena - Architecture

This document outlines the architecture of the AI Gladiators: Onchain Arena game, explaining what each file and component does.

## Core Architecture

The game follows a modular architecture with clear separation of concerns:

- **Scenes** - Manage game states and orchestrate game objects
- **Objects** - Self-contained game entities with their own behavior
- **Types** - TypeScript interfaces defining data structures
- **Utils** - Shared utilities and helper functions
- **Assets** - Game resources like images and audio

## File Structure & Purpose

### Entry Points

- `main.ts` - Main entry point that initializes the Phaser game with configuration
- `index.html` - HTML container with game-container div for Phaser canvas

### Scenes

- `scenes/BootScene.ts` - Initial scene that displays the game title and can be used for preloading assets
- `scenes/ArenaScene.ts` (planned) - Main gameplay scene where gladiators will fight
- `scenes/UIScene.ts` (planned) - Overlay scene for UI elements, avoiding mixing UI with gameplay

### Game Objects

- `objects/Gladiator.ts` (planned) - Gladiator class with FSM-driven AI behavior
- `objects/PowerUp.ts` (planned) - Power-up items that affect gladiator stats or behavior
- `objects/ArenaHazard.ts` (planned) - Environmental hazards that add challenge to the arena

### Types & Interfaces

- `types/IGladiatorStats.ts` - Interface defining gladiator statistics
- `types/GameConfig.ts` - Game configuration settings and defaults

### Utils

- `utils/constants.ts` - Global game constants like dimensions, colors, timing values
- `utils/zoraClient.ts` (planned) - Wrapper for Zora Coins SDK to handle token operations

## Data Flow

1. Game initialization in `main.ts`
2. Scene loading (Boot → Arena + UI)
3. Gladiator instances created in ArenaScene with stats from IGladiatorStats
4. Gladiators use FSM to determine behavior each update cycle
5. UI Scene communicates with zoraClient for token operations

## State Management

- **Game State** - Managed by Phaser's scene system
- **Gladiator State** - Managed internally by FSM within each Gladiator instance
- **Token State** - Will be managed by zoraClient utility

## Event System

The game will use Phaser's built-in event system for communication between:
- Scene-to-Scene communication
- Game Object events
- UI interaction events

## Dependencies

- **Phaser 3** - Core game engine
- **TypeScript** - Type safety and enhanced developer experience
- **Vite** - Fast development server and build tool
- **Zora Coins SDK** (planned) - For onchain token integration 