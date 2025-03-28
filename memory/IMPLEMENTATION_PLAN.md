# 📋 Implementation Plan: AI Gladiators – Onchain Arena

### Context
- Tech Stack: Phaser 3 + TypeScript + Zora Coins SDK + Cursor
- Game Type: AI-vs-AI auto-battler with player predictions, power-ups, and token-based interactions
- Structure: Modular folders `/scenes`, `/objects`, `/types`, `/utils`
- Time: 2-day hackathon
- Goal: Fast-paced, replayable, memeable gameplay with onchain hooks

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
- Assign random stats within predefined ranges.

✅ **Test**: Gladiators spawn at correct positions with visibly different stat values (shown as labels or debug UI).

### Step 2.2 – Implement FSM (Finite State Machine)
- Use states: `idle`, `seek`, `attack`, `evade`, `collectPowerUp`.
- Transition between states based on distance, HP, or presence of power-ups.

✅ **Test**: Gladiators actively seek opponents, attack, and transition based on conditions.

### Step 2.3 – Add Health and Knockout Logic
- Gladiators should lose health on attack and be removed when KO'd.

✅ **Test**: At least one gladiator is KO’d per match; the last standing ends the round.

---

## ⚡ 3. Power-Ups & Hazards

### Step 3.1 – Create `PowerUp.ts`
- Define multiple types: `speed`, `shield`, `trap`, `chaos`.
- Spawn randomly during the match.

✅ **Test**: Power-ups appear during the match and are picked up by Gladiators.

### Step 3.2 – Add `ArenaHazard.ts` (Optional)
- Add a simple hazard (e.g., fireball or spike) that triggers every X seconds.

✅ **Test**: Gladiators can be damaged by environmental hazards.

---

## 👁️ 4. UI Scene

### Step 4.1 – Create `UIScene.ts`
- Display: Match timer, gladiator stats, prediction panel, power-up buttons.
- Add “Connect Wallet” and show $GLAD balance using `zoraClient`.

✅ **Test**: Player can open UI, connect wallet, and view balance (mock if needed).

---

## 💸 5. Zora Coins SDK Integration

### Step 5.1 – Set Up `zoraClient.ts`
- Wrap minting, balance checking, and token spending functions.

✅ **Test**: Mock a mint of 10 $GLAD and confirm balance increases.

### Step 5.2 – Hook Predictions to Token Spend
- Let players spend $GLAD to predict match winner.
- Store predictions until match ends.

✅ **Test**: Player prediction is recorded and 5 $GLAD deducted on prediction.

### Step 5.3 – Distribute Winnings
- After match, pay out to correct predictors via Zora SDK (or simulate in dev).

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
- Let players vote for the most entertaining AI post-match.

✅ **Test**: MVP can be selected and receives a “+1 fan” badge or flair.

---

## 📈 9. Leaderboard & Token History

### Step 9.1 – Track Player Prediction Stats
- Show leaderboard of players with most correct predictions.

✅ **Test**: UI reflects updated leaderboard after every match.

---

## 🧱 10. Folder Structure Enforcement

Ensure files follow:
```
/scenes/ArenaScene.ts
/objects/Gladiator.ts
/utils/zoraClient.ts
/types/IGladiatorStats.ts
```

✅ **Test**: No logic exists in `index.ts` except game boot/init.

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

