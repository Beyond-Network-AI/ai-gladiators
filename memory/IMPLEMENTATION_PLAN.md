# 📋 Implementation Plan: AI Gladiators – Onchain Arena

### Context
- Tech Stack: Phaser 3 + TypeScript + Zora Coins SDK + Cursor
- Game Type: AI-vs-AI auto-battler with player predictions, power-ups, and token-based interactions
- Structure: Modular folders `/scenes`, `/objects`, `/types`, `/utils`
- Time: 2-day hackathon
- Goal: Fast-paced, replayable, memeable gameplay with onchain hooks

> ⚠️ **Priority Note**: Follow steps sequentially unless blocked. Steps 1-2 (Arena + Gladiators) are foundational, Steps 3-6 build the game loop, Steps 7-10 are support layers.

---

## 📁 0. Project Setup

### Step 0.1 – Initialize Phaser Project with TypeScript
- Set up a Phaser 3 + TypeScript project using Vite or Webpack.
- Include folder structure: `/scenes`, `/objects`, `/types`, `/utils`, `/assets`.

✅ **Test**: Run an empty Phaser scene with a colored background.

---

## 🎮 1. Arena Setup

### Step 1.1 – Create `ArenaScene.ts`
- Define a Phaser Scene where matches will occur.
- Set canvas size, background, and base tilemap (if any).

✅ **Test**: Launch game and confirm the arena scene loads with a background color or tilemap.

### Step 1.2 – Add Spawn Zones for AI
- Create 4 distinct spawn points around the arena edge.

✅ **Test**: Visual debug mode shows spawn zones.

---

## 🧠 2. AI Gladiators

### Step 2.1 – Create `Gladiator.ts` Class
- Define a Gladiator class with position, sprite, and stats (imported from `/types/IGladiatorStats.ts`).
- Assign random stats within these predefined ranges:
  ```ts
  IGladiatorStats = {
    strength: 5-15,     // affects damage
    speed: 100-200,     // movement speed (pixels/sec)
    defense: 1-5,       // damage resistance
    intelligence: 1-3,  // better reaction to power-ups
    aggression: 0.3-0.9, // % chance to engage
    luck: 0-0.2         // dodge/crit factor
  }
  ```

✅ **Test**: Gladiators spawn at correct positions with visibly different stat values (shown as labels or debug UI).

### Step 2.2 – Implement FSM (Finite State Machine)
- Use simple, readable FSM with 5-6 states: `idle`, `seek`, `attack`, `evade`, `collectPowerUp`.
- Prioritize visual appeal and chaotic fun over strategic depth.
- Focus on visible, memeable actions (dodging into spikes, chasing power-ups, accidental suicides).
- Transition between states based on distance, HP, or presence of power-ups.

✅ **Test**: Gladiators actively seek opponents, attack, and transition based on conditions.

### Step 2.3 – Add Health and Knockout Logic
- Gladiators should lose health on attack and be removed when KO'd.

✅ **Test**: At least one gladiator is KO'd per match; the last standing ends the round.

---

## ⚡ 3. Power-Ups & Hazards

### Step 3.1 – Create `PowerUp.ts`
- Define multiple types: `speed`, `shield`, `trap`, `chaos`.
- Spawn randomly during the match.

✅ **Test**: Power-ups appear during the match and are picked up by Gladiators.

### Step 3.2 – Add `ArenaHazard.ts` (Implement on Day 1 afternoon or Day 2 morning)
- Start with two hazards:
  - **Spike Wall:** moves left/right or up/down — KO on contact
  - **Fireball Rain:** random fireballs fall every 5-10s
- Only implement after Gladiator FSM and match loop are stable.
- Start with simple spawn-timer logic (e.g., spike triggers every 7s).

✅ **Test**: Gladiators can be damaged by environmental hazards.

---

## 👁️ 4. UI Scene

### Step 4.1 – Create `UIScene.ts`
- Display: Match timer, gladiator stats, prediction panel, power-up buttons.
- Add "Connect Wallet" and show $GLAD balance using `zoraClient`.

✅ **Test**: Player can open UI, connect wallet, and view balance (mock if needed).

---

## 💸 5. Zora Coins SDK Integration

### Step 5.1 – Set Up `zoraClient.ts`
- Wrap minting, balance checking, and token spending functions.
- During early dev: create stub functions that simulate mint/spend logic and log to console.
- Once UI is up, plug in Zora's SDK and use the testnet coin with a fake wallet.
- Add a flag like `isDevMode` to easily switch between real and mock token functions.

✅ **Test**: Mock a mint of 10 $GLAD and confirm balance increases.

### Step 5.2 – Hook Predictions to Token Spend
- Let players spend $GLAD (5 tokens) to predict match winner.
- Store predictions until match ends.

✅ **Test**: Player prediction is recorded and 5 $GLAD deducted on prediction.

### Step 5.3 – Distribute Winnings
- After match, pay out to correct predictors via Zora SDK (or simulate in dev).
- Win prediction = Earn 10 $GLAD.

✅ **Test**: Correct predictor wallet receives 2x reward.

---

## 🔧 6. Game Loop & Round Management

### Step 6.1 – Add Match Timer
- Each match runs for 30s–2 mins or until one gladiator remains.

✅ **Test**: Timer counts down and match ends automatically.

### Step 6.2 – Reset Between Matches
- Clean up previous entities and power-ups, reset state.

✅ **Test**: New match begins within 5 seconds of last one ending.

---

## 🧪 7. Debug Mode

### Step 7.1 – Implement Debug Toggle
- Show hitboxes, FSM state, stat overlays, power-up pickup range.

✅ **Test**: `debugMode=true` shows overlays and logs transitions in console.

---

## 🎉 8. Reward Mechanics & MVP Voting

### Step 8.1 – Add Post-Match MVP Voting
- Show simple UI overlay at end of match with portraits or names of each gladiator.
- Players click a button to vote (localStorage or Zora token interaction).
- For now, use local state — optional: onchain MVP voting for post-hackathon.
- MVP voting cost: Free or 1 token.

✅ **Test**: MVP can be selected and receives a "+1 fan" badge or flair.

---

## 📈 9. Leaderboard & Token History

### Step 9.1 – Track Player Prediction Stats
- Use localStorage to persist leaderboard data between sessions if time allows.
- Track predictions won, power-ups used, etc.
- Reset per session if not persistent.
- Optional: store onchain stats or back-end service (post-hackathon).

✅ **Test**: UI reflects updated leaderboard after every match.

---

## 🎨 10. Assets & Styling

### Step 10.1 – Game Assets
- Use Kenney assets (free, stylized, Phaser-ready)
- Pixel art for readability and charm
- Optional: AI-generated Gladiator icons (for fun)
- Keep visuals clean, funny, and memeable.

✅ **Test**: Game looks appealing with consistent art style.

---

## 🧱 11. Folder Structure Enforcement

Ensure files follow:
```
/scenes/ArenaScene.ts
/objects/Gladiator.ts
/utils/zoraClient.ts
/types/IGladiatorStats.ts
```

✅ **Test**: No logic exists in `index.ts` except game boot/init.

---

## 💸 12. Token Economy

Start simple and test based on match pacing:

| Action                  | $GLAD Token Amount |
|------------------------|--------------------|
| Predict winner         | Spend 5            |
| Win prediction         | Earn 10            |
| Use small power-up     | Spend 3-6          |
| MVP voting             | Free or 1 token    |

If too many tokens are earned, add cooldowns or tax (burn %).

---

## ✅ Final Checklist

| Feature                         | Implemented | Tested |
|--------------------------------|-------------|--------|
| Arena + Spawning               | [ ]         | [ ]    |
| Gladiator FSM + Combat         | [ ]         | [ ]    |
| Power-Ups + Hazards            | [ ]         | [ ]    |
| Zora SDK Integration           | [ ]         | [ ]    |
| Prediction & Token Spend       | [ ]         | [ ]    |
| Match Loop & Cleanup           | [ ]         | [ ]    |
| UI Scene + Token Balance       | [ ]         | [ ]    |
| Debug Mode                     | [ ]         | [ ]    |
| MVP Voting                     | [ ]         | [ ]    |
| Leaderboard                    | [ ]         | [ ]    | 