# 🎮 Game Design Document: AI Gladiators – Onchain Arena (Phaser Edition)

## 🔥 Game Overview
**AI Gladiators: Onchain Arena** is a web-based, real-time auto-battler built with **Phaser 3** where AI agents fight in short, chaotic matches. Spectators watch, predict outcomes, and use onchain $GLAD tokens (powered by Zora Coins SDK) to influence the fight — all within an engaging, meme-worthy 2-minute loop.

---

## 🛠️ Tech Stack

| Feature              | Tool / Library                    |
|----------------------|----------------------------------|
| Game Engine          | Phaser 3 (TypeScript)             |
| AI Logic             | Finite State Machines, Rule-based |
| Onchain Tokens       | `@zoralabs/coins-sdk`, `ethers.js`|
| Dev Assistant        | Cursor                            |
| Frontend UI (Optional)| React / HTML Overlay             |
| Deployment           | Vercel, Netlify, or GitHub Pages  |
| Assets               | Kenney, AI-generated, Itch.io     |

---

## 🎮 Core Gameplay Loop

1. **Auto-Battle Rounds**  
   - 4 AI agents fight in a top-down arena for 30s–2min.
   - Agents have randomized stats and personalities.
   - Arena hazards and power-ups increase unpredictability.

2. **Player Interaction**  
   - Predict winner using $GLAD tokens.
   - Spend $GLAD on:
     - Small power-ups
     - Voting on arena hazards
     - Cheering (buffing underdog AI slightly)

3. **Post-Round Rewards**  
   - Correct predictors earn $GLAD.
   - MVP AI voted on by community.
   - Next round starts with new agents.

---

## 🧠 AI Agent Design

**Stats (Displayed to Players):**
- Strength
- Speed
- Defense
- Aggression
- Intelligence
- Luck (small RNG factor)

**Behaviors:**
- Seek nearest enemy
- Avoid hazards
- Collect power-ups
- Dodge when low health

Each AI uses a **basic FSM or behavior tree** with randomized parameters.

---

## 🌍 Arena Design

**Arena Types:**
- Lava Pit (falling tiles)
- Slippery Ice Rink
- Moving Platforms
- Jungle Maze

**Hazards:**
- Fireballs
- Spike traps
- Sudden floor drops

**Power-Ups:**
- Shield
- Random Chaos Effect

All arenas are **tile-based** and procedurally varied.

---

## 💸 Onchain Mechanics with Zora Coins SDK

**Token Name:** `$GLAD`

### Earning:
- Watching a full round
- Predicting correctly
- Voting for MVP

### Spending:
- 5 $GLAD → Speed Boost
- 6 $GLAD → Drop Trap
- 3 $GLAD → Cheer for underdog (team vote)
- 10 $GLAD → Arena vote override

### Code Snippet Example:
```ts
import { CoinsClient } from "@zoralabs/coins-sdk";

const coinsClient = new CoinsClient({ chain: "zora", coinAddress: "<your_token>" });

await coinsClient.mintToAddress({
  quantity: "10",
  mintToAddress: userAddress,
});
