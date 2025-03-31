import Phaser from 'phaser'

// Handle loading and game start flow
window.addEventListener('load', () => {
  // Show loading progress
  const loadingBar = document.querySelector('.loading-progress') as HTMLElement;
  if (loadingBar) {
    loadingBar.style.width = '100%';
    loadingBar.style.transition = 'width 2s ease-in-out';
  }
  
  // Create Play button after loading completes
  setTimeout(() => {
    const loadingText = document.querySelector('.loading-text') as HTMLElement;
    if (loadingText) {
      loadingText.textContent = 'Ready to battle!';
    }
    
    const loadingElement = document.querySelector('.loading') as HTMLElement;
    if (loadingElement) {
      // Create Play button
      const playButton = document.createElement('button');
      playButton.className = 'play-button';
      playButton.textContent = 'ENTER ARENA';
      
      // Add click handler to start the game
      playButton.addEventListener('click', () => {
        const landingPage = document.getElementById('landing-page');
        if (landingPage) {
          // Fade out animation
          landingPage.style.transition = 'opacity 0.5s ease-out';
          landingPage.style.opacity = '0';
          landingPage.style.pointerEvents = 'none'; // Prevent any clicks during fade-out
          
          // Hide landing page after fade completes
          setTimeout(() => {
            landingPage.style.display = 'none';
            landingPage.remove(); // Completely remove from DOM
          }, 500);
        }
      });
      
      // Add button to loading area
      loadingElement.appendChild(playButton);
    }
  }, 2500);
});
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
