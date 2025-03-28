# AI Gladiators: Onchain Arena

A web-based, real-time auto-battler where AI-controlled gladiators fight in fast-paced, chaotic arena matches. Players can watch, predict outcomes, and influence fights using onchain tokens.

## 🎮 Game Overview

**AI Gladiators: Onchain Arena** is a web-based auto-battler built with Phaser 3 where AI agents fight in short, chaotic matches. Key features include:

- AI agents with randomized stats fighting in a top-down arena
- Power-ups and hazards that increase unpredictability
- Player predictions using $GLAD tokens
- Fast-paced 30s-2min matches
- Visual, memeable actions for entertainment value

## 🛠️ Tech Stack

- **Game Engine**: Phaser 3 with TypeScript
- **AI Logic**: Finite State Machines (FSM)
- **Onchain Tokens**: Zora Coins SDK, ethers.js
- **Dev Assistant**: Cursor
- **Asset Style**: Pixel art for readability and charm
- **Deployment**: Vercel, Netlify, or GitHub Pages

## 🧠 Gladiator AI Design

Each gladiator uses a simple FSM with 5-6 states:
- Idle
- Seek
- Attack
- Evade
- Collect PowerUp

Gladiators have randomized stats including:
- Strength (5-15): affects damage
- Speed (100-200): movement speed
- Defense (1-5): damage resistance
- Intelligence (1-3): reaction to power-ups
- Aggression (0.3-0.9): chance to engage
- Luck (0-0.2): dodge/crit factor

## 🌍 Arena Features

- **Hazards**: Spike walls, fireball rain
- **Power-Ups**: Speed boost, shield, trap, chaos effect
- **Match Timer**: Rounds last 30s-2min

## 💸 Token Economy

| Action                  | $GLAD Token Amount |
|------------------------|--------------------|
| Predict winner         | Spend 5            |
| Win prediction         | Earn 10            |
| Use small power-up     | Spend 3-6          |
| MVP voting             | Free or 1 token    |

## 🗺️ High-Level Implementation Plan

1. **Project Setup**: Phaser 3 + TypeScript project with modular folder structure
2. **Arena Setup**: Create the game scene with spawn points
3. **AI Gladiators**: Implement gladiator class with FSM-driven behavior
4. **Power-Ups & Hazards**: Add interactive elements to increase unpredictability
5. **UI Scene**: Create interface for player interaction
6. **Zora Integration**: Implement token functionality
7. **Game Loop**: Add match timer and round management
8. **Debug Mode**: Add tools to visualize AI states and hitboxes
9. **Reward Mechanics**: Implement MVP voting system
10. **Leaderboard**: Track player predictions and stats

## 📁 Folder Structure

```
/scenes      - Game scenes (Arena, UI)
/objects     - Game entities (Gladiators, PowerUps)
/types       - TypeScript interfaces
/utils       - Shared logic, Zora integration
/assets      - Game sprites and audio
```

## 🚀 Getting Started

(Setup instructions will be added once the project is initialized)

## 🎥 Demo

(Demo link will be added once the project is deployed)

## 👥 Contributors

(Contributors will be added as the project progresses)
