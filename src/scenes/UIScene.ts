import Phaser from 'phaser';
import { COLORS, GAME_WIDTH, GAME_HEIGHT } from '../utils/constants';
import { DEFAULT_GAME_SETTINGS } from '../types/GameConfig';
import { Gladiator } from '../objects/Gladiator';
import { IGladiatorStats } from '../types/IGladiatorStats';

// Interface for Gladiator properties and methods used in UIScene
interface GladiatorUI {
  id: number;
  health: number;
  getStats(): IGladiatorStats;
}

export class UIScene extends Phaser.Scene {
  // UI elements
  private matchTimerText!: Phaser.GameObjects.Text;
  private predictionPanel!: Phaser.GameObjects.Container;
  private statsPanel!: Phaser.GameObjects.Container;
  private walletButton!: Phaser.GameObjects.Container;
  private gladTokenBalance!: Phaser.GameObjects.Text;

  // Reference to arena scene
  private arenaScene!: Phaser.Scene;

  // Wallet state
  private isWalletConnected: boolean = false;
  private walletAddress: string = '';
  private tokenBalance: number = 0;

  // Prediction state
  private selectedGladiator: (Gladiator & GladiatorUI) | null = null;
  private predictionMade: boolean = false;
  private predictionAmount: number = 5; // Default prediction amount

  // Dev mode flag from game settings
  private isDevMode: boolean;

  constructor() {
    super({ key: 'UIScene' });
    this.isDevMode = DEFAULT_GAME_SETTINGS.isDevMode;
  }

  preload(): void {
    // Preload UI assets
    this.load.image('ui_panel', 'https://labs.phaser.io/assets/sprites/panel.png');
    this.load.image('ui_button', 'https://labs.phaser.io/assets/sprites/button.png');
  }

  create(): void {
    // Get reference to the arena scene
    this.arenaScene = this.scene.get('ArenaScene');

    // Adjust camera to make room for UI at bottom
    this.cameras.main.setViewport(0, 0, GAME_WIDTH, GAME_HEIGHT + 240);
    
    // Set up UI elements
    this.createStatsPanel();
    this.createPredictionPanel();
    this.createWalletButton();

    // Listen for events from arena scene
    this.setupEventListeners();

    console.log('UIScene created successfully!');
  }

  update(): void {
    // Update UI elements based on arena state
    this.updateStatsPanel();
  }

  private createStatsPanel(): void {
    // Create container for stats panel
    this.statsPanel = this.add.container(GAME_WIDTH / 2 + 250, GAME_HEIGHT + 120);
    
    // Panel background
    const statsPanelBg = this.add.rectangle(0, 0, 280, 200, 0x000000, 0.7)
      .setOrigin(0.5);
    
    // Title
    const statsTitle = this.add.text(0, -85, 'GLADIATOR STATS', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: COLORS.primaryText,
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Create a placeholder message for when no gladiator is selected
    const placeholderText = this.add.text(0, 0, 'Select a gladiator\nto view stats', {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: COLORS.secondaryText,
      align: 'center'
    }).setOrigin(0.5);

    // Empty container for dynamic stats content
    const statsContent = this.add.container(0, 0);
    
    // Add elements to container
    this.statsPanel.add([statsPanelBg, statsTitle, placeholderText, statsContent]);
    
    // Position the panel off screen initially
    this.statsPanel.setPosition(GAME_WIDTH / 2 + 350, GAME_HEIGHT + 120);
    
    // Slide in animation
    this.tweens.add({
      targets: this.statsPanel,
      x: GAME_WIDTH / 2 + 250,
      duration: 500,
      ease: 'Power2'
    });

    // Store references for later updates
    this.statsPanel.setData('placeholderText', placeholderText);
    this.statsPanel.setData('statsContent', statsContent);
  }

  private createPredictionPanel(): void {
    // Create container for prediction panel
    this.predictionPanel = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT + 120);
    
    // Panel background
    const predictionPanelBg = this.add.rectangle(0, 0, 280, 120, 0x000000, 0.7)
      .setOrigin(0.5);
    
    // Title
    const predictionTitle = this.add.text(0, -45, 'PREDICTION', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: COLORS.primaryText,
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Prediction information text
    const predictionText = this.add.text(0, -15, 'Select a gladiator to predict', {
      fontFamily: 'Arial',
      fontSize: '12px',
      color: COLORS.secondaryText
    }).setOrigin(0.5);

    // Cost text
    const costText = this.add.text(0, 10, `Cost: 5 $GLAD`, {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: COLORS.highlight
    }).setOrigin(0.5);

    // Predict button (disabled initially)
    const predictButton = this.add.rectangle(0, 35, 120, 30, 0x555555)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    
    const predictButtonText = this.add.text(0, 35, 'PREDICT', {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#cccccc'
    }).setOrigin(0.5);

    // Disable button initially
    predictButton.disableInteractive();
    
    // Add prediction handler
    predictButton.on('pointerdown', () => {
      if (this.selectedGladiator && !this.predictionMade) {
        this.makePrediction();
      }
    });
    
    // Add elements to container
    this.predictionPanel.add([
      predictionPanelBg, 
      predictionTitle,
      predictionText,
      costText,
      predictButton,
      predictButtonText
    ]);
    
    // Position the panel off screen initially
    this.predictionPanel.setPosition(GAME_WIDTH / 2, GAME_HEIGHT + 200);
    
    // Slide in animation
    this.tweens.add({
      targets: this.predictionPanel,
      y: GAME_HEIGHT + 120,
      duration: 500,
      ease: 'Power2'
    });

    // Store references for later updates
    this.predictionPanel.setData('predictionText', predictionText);
    this.predictionPanel.setData('predictButton', predictButton);
    this.predictionPanel.setData('predictButtonText', predictButtonText);
  }

  private createWalletButton(): void {
    // Create container for wallet button
    this.walletButton = this.add.container(GAME_WIDTH / 2 - 250, GAME_HEIGHT + 120);
    
    // Button background
    const walletBg = this.add.rectangle(0, 0, 200, 50, 0x444444, 0.8)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    
    // Button text
    const walletText = this.add.text(0, 0, 'Connect Wallet', {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: COLORS.primaryText
    }).setOrigin(0.5);

    // Token balance (hidden initially)
    this.gladTokenBalance = this.add.text(0, 20, '0 $GLAD', {
      fontFamily: 'Arial',
      fontSize: '12px',
      color: COLORS.highlight
    }).setOrigin(0.5);
    this.gladTokenBalance.setVisible(false);
    
    // Add click handler
    walletBg.on('pointerdown', () => {
      this.connectWallet();
    });
    
    // Add elements to container
    this.walletButton.add([walletBg, walletText, this.gladTokenBalance]);
    
    // Store references for later updates
    this.walletButton.setData('walletText', walletText);
    this.walletButton.setData('walletBg', walletBg);

    // Position off screen initially
    this.walletButton.setPosition(GAME_WIDTH / 2 - 350, GAME_HEIGHT + 120);
    
    // Slide in animation
    this.tweens.add({
      targets: this.walletButton,
      x: GAME_WIDTH / 2 - 250,
      duration: 500,
      ease: 'Power2'
    });
  }

  private setupEventListeners(): void {
    // Listen for gladiator selection events from arena scene
    this.arenaScene.events.on('gladiatorSelected', (gladiator: any) => {
      console.log('UIScene received gladiatorSelected event with:', gladiator);
      if (gladiator && typeof gladiator === 'object') {
        this.handleGladiatorSelection(gladiator);
      } else {
        console.error('Invalid gladiator received in event:', gladiator);
      }
    });

    // Listen for match end events
    this.arenaScene.events.on('matchEnd', (winner: any) => {
      this.handleMatchEnd(winner);
    });
  }

  private connectWallet(): void {
    // In dev mode, simulate wallet connection
    if (this.isDevMode) {
      this.isWalletConnected = true;
      this.walletAddress = '0x' + Math.random().toString(16).substr(2, 38);
      this.tokenBalance = 100; // Give mock balance
      this.updateWalletUI();
      return;
    }

    // In production mode, integrate with Zora Coins SDK
    // This would be implemented with zoraClient in the future
    console.log('Wallet connection would be implemented with Zora SDK');
  }

  private updateWalletUI(): void {
    const walletText = this.walletButton.getData('walletText');
    const walletBg = this.walletButton.getData('walletBg');
    
    if (this.isWalletConnected) {
      // Update wallet button to show address
      const shortAddress = this.walletAddress.substr(0, 6) + '...' + this.walletAddress.substr(-4);
      walletText.setText(shortAddress);
      walletBg.setFillStyle(0x226622, 0.8);
      
      // Show token balance
      this.gladTokenBalance.setText(`${this.tokenBalance} $GLAD`);
      this.gladTokenBalance.setVisible(true);

      // Enable prediction if applicable
      this.updatePredictionUI();
    }
  }

  private handleGladiatorSelection(gladiator: any): void {
    console.log('Gladiator selected:', gladiator);
    if (gladiator) {
      const stats = gladiator.getStats();
      console.log('Gladiator stats:', stats);
      
      // Set the selected gladiator
      this.selectedGladiator = gladiator as (Gladiator & GladiatorUI);
      
      // Update UI immediately
      this.updatePredictionUI();
      this.updateStatsPanel();
    } else {
      console.error('Selected gladiator is null or undefined');
    }
  }

  private updatePredictionUI(): void {
    // Get references to prediction UI elements
    const predictionText = this.predictionPanel.getData('predictionText');
    const predictButton = this.predictionPanel.getData('predictButton');
    const predictButtonText = this.predictionPanel.getData('predictButtonText');
    
    if (this.predictionMade) {
      // Prediction already made
      predictionText.setText(`Prediction placed on Gladiator ${this.selectedGladiator?.id}`);
      predictButton.setFillStyle(0x555555);
      predictButtonText.setText('PREDICTED');
      predictButton.disableInteractive();
      return;
    }
    
    if (this.selectedGladiator && this.isWalletConnected) {
      // Gladiator selected and wallet connected - enable prediction
      predictionText.setText(`Predict Gladiator ${this.selectedGladiator.id} will win?`);
      predictButton.setFillStyle(0x44aa44);
      predictButtonText.setText('PREDICT');
      predictButtonText.setColor('#ffffff');
      
      // Only enable if enough balance
      if (this.tokenBalance >= this.predictionAmount) {
        predictButton.setInteractive();
      } else {
        predictionText.setText(`Not enough $GLAD (need ${this.predictionAmount})`);
        predictButton.disableInteractive();
      }
    } else if (!this.isWalletConnected) {
      // Wallet not connected
      predictionText.setText('Connect wallet to predict');
      predictButton.setFillStyle(0x555555);
      predictButton.disableInteractive();
    } else {
      // No gladiator selected
      predictionText.setText('Select a gladiator to predict');
      predictButton.setFillStyle(0x555555);
      predictButton.disableInteractive();
    }
  }

  private makePrediction(): void {
    if (!this.selectedGladiator || !this.isWalletConnected || this.tokenBalance < this.predictionAmount) {
      return;
    }
    
    // Deduct tokens
    this.tokenBalance -= this.predictionAmount;
    this.gladTokenBalance.setText(`${this.tokenBalance} $GLAD`);
    
    // Update prediction state
    this.predictionMade = true;
    
    // Update UI
    this.updatePredictionUI();
    
    // Notify arena scene
    this.arenaScene.events.emit('predictionMade', {
      gladiatorId: this.selectedGladiator.id,
      amount: this.predictionAmount
    });
    
    // Show prediction confirmation
    this.showPredictionConfirmation();
  }

  private showPredictionConfirmation(): void {
    // Create a temporary text that fades out
    const confirmText = this.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2 - 50,
      `Prediction placed on Gladiator ${this.selectedGladiator?.id}!`,
      {
        fontFamily: 'Arial',
        fontSize: '20px',
        color: '#44ff44',
        fontStyle: 'bold'
      }
    ).setOrigin(0.5).setAlpha(0);
    
    // Fade in and out animation
    this.tweens.add({
      targets: confirmText,
      alpha: { from: 0, to: 1 },
      y: GAME_HEIGHT / 2 - 80,
      duration: 1000,
      ease: 'Power2',
      yoyo: true,
      hold: 1000,
      onComplete: () => {
        confirmText.destroy();
      }
    });
  }

  private handleMatchEnd(winner: (Gladiator & GladiatorUI) | null): void {
    // Check if player's prediction was correct
    if (this.predictionMade && this.selectedGladiator && winner) {
      const isWinner = this.selectedGladiator.id === winner.id;
      
      if (isWinner) {
        // Award tokens for correct prediction (double the prediction)
        const winnings = this.predictionAmount * 2;
        this.tokenBalance += winnings;
        this.gladTokenBalance.setText(`${this.tokenBalance} $GLAD`);
        
        // Show winning message
        this.showPredictionResult(true, winnings);
      } else {
        // Show losing message
        this.showPredictionResult(false, 0);
      }
    }
    
    // Reset prediction state for next match
    this.predictionMade = false;
    this.selectedGladiator = null;
    
    // Reset prediction UI for next match
    const predictionText = this.predictionPanel.getData('predictionText');
    if (predictionText) {
      predictionText.setText('Select a gladiator to predict');
    }
  }

  private showPredictionResult(isWin: boolean, amount: number): void {
    // Create result text
    const resultText = this.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      isWin 
        ? `Prediction Correct! +${amount} $GLAD` 
        : 'Prediction Failed!',
      {
        fontFamily: 'Arial',
        fontSize: '24px',
        color: isWin ? '#44ff44' : '#ff4444',
        fontStyle: 'bold'
      }
    ).setOrigin(0.5).setAlpha(0);
    
    // Fade in and out animation
    this.tweens.add({
      targets: resultText,
      alpha: { from: 0, to: 1 },
      y: GAME_HEIGHT / 2 - 20,
      duration: 1500,
      ease: 'Power2',
      yoyo: true,
      hold: 2000,
      onComplete: () => {
        resultText.destroy();
      }
    });
  }

  private updateStatsPanel(): void {
    // Get references to the UI elements
    const placeholderText = this.statsPanel.getData('placeholderText') as Phaser.GameObjects.Text;
    const statsContent = this.statsPanel.getData('statsContent') as Phaser.GameObjects.Container;
    
    // Check if we have both references
    if (!placeholderText || !statsContent) {
      console.error('Missing statsPanel elements:', { placeholderText, statsContent });
      return;
    }
    
    // Clear existing stats
    statsContent.removeAll(true);
    
    // Only update if we have a selected gladiator
    if (!this.selectedGladiator) {
      placeholderText.setVisible(true);
      return;
    }

    // Hide the placeholder text
    placeholderText.setVisible(false);
    
    // Get stats from the selected gladiator
    const stats = this.selectedGladiator.getStats();
    console.log('Stats to display:', stats);
    
    if (!stats) {
      console.error('Failed to get stats from gladiator', this.selectedGladiator);
      return;
    }
    
    // Display gladiator ID and type
    statsContent.add(this.add.text(0, -50, `Gladiator ${this.selectedGladiator.id}`, {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: COLORS.highlight,
      fontStyle: 'bold'
    }).setOrigin(0.5));
    
    // Add each stat as a text line
    const statPositions = [
      { name: 'Strength', key: 'strength' as keyof IGladiatorStats, y: -20 },
      { name: 'Speed', key: 'speed' as keyof IGladiatorStats, y: 0 },
      { name: 'Defense', key: 'defense' as keyof IGladiatorStats, y: 20 },
      { name: 'Intelligence', key: 'intelligence' as keyof IGladiatorStats, y: 40 },
      { name: 'Aggression', key: 'aggression' as keyof IGladiatorStats, y: 60 }
    ];
    
    statPositions.forEach(stat => {
      if (typeof stats[stat.key] === 'undefined') {
        console.error(`Stat ${stat.key} not found in`, stats);
        return;
      }
      
      const value = stats[stat.key];
      let valueText = typeof value === 'number' 
        ? (stat.key === 'speed' ? Math.round(value) : value.toFixed(1)) 
        : value;
      
      const statText = this.add.text(0, stat.y, `${stat.name}: ${valueText}`, {
        fontFamily: 'Arial',
        fontSize: '14px',
        color: COLORS.secondaryText
      }).setOrigin(0.5);
      
      statsContent.add(statText);
    });
    
    // Add health bar
    const healthWidth = 150;
    const healthBarBg = this.add.rectangle(0, 80, healthWidth, 15, 0x333333).setOrigin(0.5);
    const healthBar = this.add.rectangle(
      0 - (healthWidth / 2) + ((this.selectedGladiator.health / 100) * healthWidth / 2), 
      80, 
      (this.selectedGladiator.health / 100) * healthWidth, 
      15, 
      0xff4444
    ).setOrigin(0, 0.5);
    
    const healthText = this.add.text(0, 80, `${Math.ceil(this.selectedGladiator.health)}%`, {
      fontFamily: 'Arial',
      fontSize: '10px',
      color: COLORS.primaryText
    }).setOrigin(0.5);
    
    statsContent.add([healthBarBg, healthBar, healthText]);
  }
} 