import Phaser from 'phaser'

// Hide landing page when game is fully loaded
window.addEventListener('load', () => {
  // Show loading progress
  const loadingBar = document.querySelector('.loading-progress') as HTMLElement;
  if (loadingBar) {
    loadingBar.style.width = '100%';
    loadingBar.style.transition = 'width 2s ease-in-out';
  }
  
  // Hide landing page after animation completes
  setTimeout(() => {
    const landingPage = document.getElementById('landing-page');
    if (landingPage) {
      landingPage.style.display = 'none';
    }
  }, 2500);
});;
import './style.css';
import { BootScene } from './scenes/BootScene';
import { ArenaScene } from './scenes/ArenaScene';
import { UIScene } from './scenes/UIScene';
import { testZoraClient } from './utils/zoraClient.test';
import { zoraClient } from './utils/zoraClient';
import { matchManager } from './utils/MatchManager';

// Game configuration
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 840,
  backgroundColor: '#1e1e1e',
  parent: 'game-container',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false
    }
  },
  scene: [BootScene, ArenaScene, UIScene]
};

// Initialize the game
const game = new Phaser.Game(config);

// Expose test functions and utilities to global scope for console testing
(window as any).testZoraClient = testZoraClient;
(window as any).zoraClient = zoraClient;
(window as any).matchManager = matchManager;

// Function to test match history
(window as any).testMatchHistory = () => {
  const history = matchManager.getMatchHistory();
  console.log('Match History:', history);
  return history;
};

// Function to reset match history (useful for testing)
(window as any).resetMatchHistory = () => {
  matchManager.clearAllData();
  console.log('Match history cleared');
};
