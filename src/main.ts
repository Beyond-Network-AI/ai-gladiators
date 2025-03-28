import Phaser from 'phaser';
import './style.css';
import { BootScene } from './scenes/BootScene';
import { ArenaScene } from './scenes/ArenaScene';

// Game configuration
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: '#2d2d2d',
  parent: 'game-container',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false
    }
  },
  scene: [BootScene, ArenaScene]
};

// Initialize the game
new Phaser.Game(config);
