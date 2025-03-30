import Phaser from 'phaser';
import { COLORS, GAME_WIDTH, GAME_HEIGHT } from '../utils/constants';
import { DEFAULT_GAME_SETTINGS } from '../types/GameConfig';
import { Gladiator } from '../objects/Gladiator';
import { IGladiatorStats } from '../types/IGladiatorStats';
import { zoraClient } from '../utils/zoraClient';
import { matchManager } from '../utils/MatchManager';

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

    // Add stats button next to wallet button
    const statsButton = this.add.rectangle(
      GAME_WIDTH / 2 - 350, 
      GAME_HEIGHT + 120,
      60, 
      30, 
      0x444444, 
      0.8
    ).setInteractive({ useHandCursor: true })
     .setOrigin(0.5);
    
    const statsButtonText = this.add.text(
      GAME_WIDTH / 2 - 350,
      GAME_HEIGHT + 120,
      'Stats',
      {
        fontFamily: 'Arial',
        fontSize: '12px',
        color: COLORS.primaryText
      }
    ).setOrigin(0.5);
    
    // Add click handler for stats button
    statsButton.on('pointerdown', () => {
      this.showPlayerStats();
    });
    
    // Add to wallet container
    this.walletButton.add([statsButton, statsButtonText]);
    this.walletButton.setData('statsButton', statsButton);
    this.walletButton.setData('statsButtonText', statsButtonText);
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
    // In dev mode, simulate wallet connection using zoraClient
    zoraClient.connectWallet().then(result => {
      if (result.isConnected) {
        this.isWalletConnected = true;
        this.walletAddress = result.address;
        
        // Give free tokens to new players in dev mode
        zoraClient.giveFreeTokens(this.walletAddress).then(mintResult => {
          if (mintResult.success && mintResult.data) {
            this.tokenBalance = mintResult.data.newBalance;
            console.log(`Wallet connected with ${this.tokenBalance} $GLAD`);
          }
          this.updateWalletUI();
          
          // Show a welcome back message if player has stats
          const playerStats = matchManager.getPlayerStats(this.walletAddress);
          if (playerStats && playerStats.matchesWatched > 0) {
            this.showWelcomeBack(playerStats);
          }
        });
      } else {
        console.error('Failed to connect wallet');
      }
    });
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
    
    // Store the gladiator ID locally in case the selection changes during the async operation
    const gladiatorId = this.selectedGladiator?.id;
    
    // Spend tokens using zoraClient
    zoraClient.spend(this.walletAddress, this.predictionAmount).then(result => {
      if (result.success && result.data) {
        // Update token balance
        this.tokenBalance = result.data.newBalance;
        this.gladTokenBalance.setText(`${this.tokenBalance} $GLAD`);
        
        // Update prediction state
        this.predictionMade = true;
        
        // Update UI
        this.updatePredictionUI();
        
        // Notify arena scene
        this.arenaScene.events.emit('predictionMade', {
          gladiatorId,
          amount: this.predictionAmount,
          walletAddress: this.walletAddress
        });
        
        // Show prediction confirmation
        this.showPredictionConfirmation();
      } else {
        // Show error message
        this.showErrorMessage('Failed to make prediction: ' + result.message);
      }
    });
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

  private handleMatchEnd(winner: (Gladiator & GladiatorUI) | null, matchStats?: any): void {
    // Check if player's prediction was correct
    if (this.predictionMade && this.selectedGladiator && winner) {
      const isWinner = this.selectedGladiator.id === winner.id;
      
      if (isWinner) {
        // Award tokens for correct prediction (double the prediction)
        const winnings = this.predictionAmount * 2;
        
        // Distribute winnings using zoraClient
        zoraClient.distributeRewards([this.walletAddress], winnings).then(results => {
          if (results.length > 0 && results[0].success) {
            // Update token balance
            this.tokenBalance = results[0].data.newBalance;
            this.gladTokenBalance.setText(`${this.tokenBalance} $GLAD`);
            
            // Show winning message
            this.showPredictionResult(true, winnings);
          } else {
            console.error('Failed to distribute winnings:', results);
            this.showErrorMessage('Failed to receive winnings');
          }
        });
      } else {
        // Show losing message
        this.showPredictionResult(false, 0);
      }
    }
    
    // Show match statistics if available
    if (matchStats) {
      this.showMatchStatistics(matchStats);
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

  // Add a method to show error messages
  private showErrorMessage(message: string): void {
    const errorText = this.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      message,
      {
        fontFamily: 'Arial',
        fontSize: '16px',
        color: '#ff4444',
        backgroundColor: '#000000',
        padding: { x: 10, y: 5 }
      }
    ).setOrigin(0.5).setDepth(100).setAlpha(0);
    
    // Fade in and out animation
    this.tweens.add({
      targets: errorText,
      alpha: { from: 0, to: 1 },
      y: GAME_HEIGHT / 2 - 20,
      duration: 500,
      ease: 'Power2',
      yoyo: true,
      hold: 2000,
      onComplete: () => {
        errorText.destroy();
      }
    });
  }

  // Add a method to show match statistics
  private showMatchStatistics(stats: {
    matchNumber: number;
    duration: number;
    powerUpsCollected: number;
    hazardsTriggered: number;
  }): void {
    // Create a floating notification with match stats
    const statsBg = this.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT + 200,
      500,
      120,
      0x000000,
      0.8
    ).setOrigin(0.5);
    
    // Add title
    const statsTitle = this.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT + 150,
      `Match #${stats.matchNumber} Summary`,
      {
        fontFamily: 'Arial',
        fontSize: '18px',
        color: COLORS.highlight,
        fontStyle: 'bold'
      }
    ).setOrigin(0.5);
    
    // Add duration
    const durationText = this.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT + 180,
      `Duration: ${stats.duration.toFixed(1)}s`,
      {
        fontFamily: 'Arial',
        fontSize: '14px',
        color: COLORS.primaryText
      }
    ).setOrigin(0.5);
    
    // Add power-ups
    const powerUpsText = this.add.text(
      GAME_WIDTH / 2 - 100,
      GAME_HEIGHT + 210,
      `Power-ups: ${stats.powerUpsCollected}`,
      {
        fontFamily: 'Arial',
        fontSize: '14px',
        color: COLORS.primaryText
      }
    ).setOrigin(0.5);
    
    // Add hazards
    const hazardsText = this.add.text(
      GAME_WIDTH / 2 + 100,
      GAME_HEIGHT + 210,
      `Hazards: ${stats.hazardsTriggered}`,
      {
        fontFamily: 'Arial',
        fontSize: '14px',
        color: COLORS.primaryText
      }
    ).setOrigin(0.5);
    
    // Group all elements
    const statsGroup = this.add.container();
    statsGroup.add([statsBg, statsTitle, durationText, powerUpsText, hazardsText]);
    
    // Show and then fade out
    this.tweens.add({
      targets: statsGroup,
      y: -100, // Move up to be visible
      duration: 1000,
      ease: 'Power2',
      delay: 2000, // Wait for prediction results to show first
      hold: 3000, // Keep visible for 3 seconds
      yoyo: true,
      onComplete: () => {
        statsGroup.destroy();
      }
    });
  }

  private showWelcomeBack(playerStats: any): void {
    // Create a welcome back message with player stats
    const winRate = playerStats.predictionsTotal > 0 
      ? ((playerStats.predictionsCorrect / playerStats.predictionsTotal) * 100).toFixed(1)
      : 0;
    
    const welcomeText = this.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT + 60,
      `Welcome back! Your prediction win rate: ${winRate}%`,
      {
        fontFamily: 'Arial',
        fontSize: '14px',
        color: COLORS.highlight,
        backgroundColor: '#00000088',
        padding: { x: 10, y: 5 }
      }
    ).setOrigin(0.5);
    
    // Fade out after a few seconds
    this.tweens.add({
      targets: welcomeText,
      alpha: { from: 1, to: 0 },
      y: welcomeText.y - 20,
      duration: 3000,
      delay: 2000,
      ease: 'Power2',
      onComplete: () => {
        welcomeText.destroy();
      }
    });
  }

  private showPlayerStats(): void {
    // Only show stats if wallet is connected
    if (!this.isWalletConnected) {
      this.showErrorMessage('Connect wallet to view stats');
      return;
    }
    
    // Get player stats from match manager
    const playerStats = matchManager.getPlayerStats(this.walletAddress);
    
    if (!playerStats || playerStats.matchesWatched === 0) {
      this.showErrorMessage('No stats available yet');
      return;
    }
    
    // Create a stats panel
    const statsPanelBg = this.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      400,
      300,
      0x000000,
      0.9
    ).setOrigin(0.5);
    
    // Add title
    const title = this.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2 - 120,
      'YOUR STATISTICS',
      {
        fontFamily: 'Arial',
        fontSize: '20px',
        color: COLORS.highlight,
        fontStyle: 'bold'
      }
    ).setOrigin(0.5);
    
    // Calculate stats
    const winRate = playerStats.predictionsTotal > 0
      ? ((playerStats.predictionsCorrect / playerStats.predictionsTotal) * 100).toFixed(1) 
      : '0.0';
    
    const netProfit = playerStats.tokensWon - playerStats.tokensSpent;
    
    // Add stats text
    const statsText = [
      `Matches Watched: ${playerStats.matchesWatched}`,
      `Predictions Made: ${playerStats.predictionsTotal}`,
      `Correct Predictions: ${playerStats.predictionsCorrect}`,
      `Win Rate: ${winRate}%`,
      `Tokens Spent: ${playerStats.tokensSpent} $GLAD`,
      `Tokens Won: ${playerStats.tokensWon} $GLAD`,
      `Net Profit: ${netProfit} $GLAD`
    ];
    
    const statsContainer = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40);
    
    statsText.forEach((text, index) => {
      const textColor = index === 6 
        ? (netProfit >= 0 ? '#44ff44' : '#ff4444') 
        : COLORS.primaryText;
        
      statsContainer.add(
        this.add.text(0, index * 30, text, {
          fontFamily: 'Arial',
          fontSize: '16px',
          color: textColor
        }).setOrigin(0.5)
      );
    });
    
    // Add leaderboard section
    const leaderboardTitle = this.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2 + 110,
      'TOP PREDICTORS',
      {
        fontFamily: 'Arial',
        fontSize: '16px',
        color: COLORS.highlight,
        fontStyle: 'bold'
      }
    ).setOrigin(0.5);
    
    // Get top 3 players from leaderboard
    const topPlayers = matchManager.getLeaderboard().slice(0, 3);
    
    const leaderboardContainer = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 140);
    
    if (topPlayers.length > 0) {
      topPlayers.forEach((player, index) => {
        const playerWinRate = ((player.predictionsCorrect / player.predictionsTotal) * 100).toFixed(1);
        const playerAddress = player.address.substr(0, 6) + '...' + player.address.substr(-4);
        
        // Highlight current player
        const isCurrentPlayer = player.address === this.walletAddress;
        
        leaderboardContainer.add(
          this.add.text(0, index * 20, `${index + 1}. ${playerAddress} - ${playerWinRate}%`, {
            fontFamily: 'Arial',
            fontSize: '14px',
            color: isCurrentPlayer ? '#ffff00' : COLORS.primaryText
          }).setOrigin(0.5)
        );
      });
    } else {
      leaderboardContainer.add(
        this.add.text(0, 0, 'No leaderboard data yet', {
          fontFamily: 'Arial',
          fontSize: '14px',
          color: COLORS.secondaryText
        }).setOrigin(0.5)
      );
    }
    
    // Add close button
    const closeButton = this.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2 + 180,
      120,
      30,
      0x444444
    ).setInteractive({ useHandCursor: true })
     .setOrigin(0.5);
    
    const closeText = this.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2 + 180,
      'CLOSE',
      {
        fontFamily: 'Arial',
        fontSize: '14px',
        color: COLORS.primaryText
      }
    ).setOrigin(0.5);
    
    // Group all elements
    const statsPanel = this.add.container(0, 0);
    statsPanel.add([
      statsPanelBg,
      title,
      statsContainer,
      leaderboardTitle,
      leaderboardContainer,
      closeButton,
      closeText
    ]);
    
    // Add click handler for close button
    closeButton.on('pointerdown', () => {
      // Fade out and destroy
      this.tweens.add({
        targets: statsPanel,
        alpha: { from: 1, to: 0 },
        duration: 300,
        onComplete: () => {
          statsPanel.destroy();
        }
      });
    });
    
    // Fade in effect
    statsPanel.setAlpha(0);
    this.tweens.add({
      targets: statsPanel,
      alpha: { from: 0, to: 1 },
      duration: 300
    });
  }
} 