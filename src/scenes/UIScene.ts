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
    this.load.addFile('font', 'Press Start 2P.ttf')
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
    // Create stats panel with improved styling
    const statsPanel = this.add.rectangle(
      GAME_WIDTH - 150,
      GAME_HEIGHT - 120,
      300,
      150,
      0x000000,
      0.8
    ).setStrokeStyle(3, 0xff5555);

    // Add title with improved styling
    const statsTitle = this.add.text(
      GAME_WIDTH - 150,
      GAME_HEIGHT - 180,
      'GLADIATOR STATS',
      {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '16px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 2
      }
    ).setOrigin(0.5);

    // Add placeholder text with improved styling
    const placeholderText = this.add.text(
      GAME_WIDTH - 150,
      GAME_HEIGHT - 120,
      'Select a gladiator\nto view stats',
      {
        fontFamily: 'Arial',
        fontSize: '14px',
        color: '#bbbbbb',
        align: 'center',
        stroke: '#000000',
        strokeThickness: 1
      }
    ).setOrigin(0.5);

    // Add subtle animation to the placeholder text
    this.tweens.add({
      targets: placeholderText,
      alpha: { from: 0.7, to: 1 },
      duration: 1500,
      yoyo: true,
      repeat: -1
    });

    // Create decorative elements for the stats panel
    const decorLine = this.add.graphics();
    decorLine.lineStyle(2, 0xffaa00, 0.6);
    decorLine.lineBetween(GAME_WIDTH - 265, GAME_HEIGHT - 155, GAME_WIDTH - 35, GAME_HEIGHT - 155);

    // Create container for stats (initially empty)
    const statsContent = this.add.container(GAME_WIDTH - 150, GAME_HEIGHT - 120);

    // Create background for the stat bars
    const statBarsBg = this.add.graphics();
    statBarsBg.fillStyle(0x222222, 0.6);
    statBarsBg.fillRect(-125, -45, 250, 80);
    statBarsBg.setVisible(false);
    statsContent.add(statBarsBg);

    // Store references
    statsPanel.setData('placeholderText', placeholderText);
    statsPanel.setData('statsContent', statsContent);
    statsPanel.setData('statBarsBg', statBarsBg);
    statsPanel.setData('decorLine', decorLine);
    this.statsPanel = statsPanel;
  }

  private createPredictionPanel(): void {
    // Create prediction panel with improved styling
    const predictionPanel = this.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT - 120,
      300,
      150,
      0x000000,
      0.8
    ).setStrokeStyle(3, 0xff5555);

    // Add title with improved styling
    const predictionTitle = this.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT - 180,
      'PREDICTION',
      {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '16px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 2
      }
    ).setOrigin(0.5);

    // Add animated glow effect to prediction title
    this.tweens.add({
      targets: predictionTitle,
      alpha: { from: 0.8, to: 1 },
      duration: 1500,
      yoyo: true,
      repeat: -1
    });

    // Add prediction text placeholder with improved styling
    const predictionText = this.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT - 140,
      'Select a gladiator to predict',
      {
        fontFamily: 'Arial',
        fontSize: '14px',
        color: '#bbbbbb',
        stroke: '#000000',
        strokeThickness: 1
      }
    ).setOrigin(0.5);

    // Add prediction cost with improved styling
    const predictionCost = this.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT - 115,
      `Cost: ${this.predictionAmount} $GLAD`,
      {
        fontFamily: 'Arial',
        fontSize: '14px',
        color: '#ffaa00',
        stroke: '#000000',
        strokeThickness: 1,
        fontStyle: 'bold'
      }
    ).setOrigin(0.5);

    // Add animated pulse to cost text
    this.tweens.add({
      targets: predictionCost,
      scale: { from: 1, to: 1.05 },
      duration: 800,
      yoyo: true,
      repeat: -1
    });

    // Add prediction button with improved styling
    const predictButton = this.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT - 80,
      130,
      40,
      0x2d7a2d
    ).setStrokeStyle(2, 0x55ff55);

    const predictButtonText = this.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT - 80,
      'PREDICT',
      {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '14px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 1
      }
    ).setOrigin(0.5);

    // Store references
    predictionPanel.setData('predictionText', predictionText);
    predictionPanel.setData('predictButton', predictButton);
    predictionPanel.setData('predictButtonText', predictButtonText);
    predictionPanel.setData('predictionCost', predictionCost);
    this.predictionPanel = predictionPanel;

    // Disable button initially
    predictButton.disableInteractive();
  }

  private createWalletButton(): void {
    // Create wallet panel background
    const walletPanel = this.add.rectangle(GAME_WIDTH / 2 - 250, GAME_HEIGHT + 120, 190, 70, 0x000000, 0.8)
      .setStrokeStyle(3, 0xff5555);

    // Create wallet button with enhanced styling
    const walletButton = this.add.rectangle(GAME_WIDTH / 2 - 250, GAME_HEIGHT + 120, 180, 60, 0x2c5e2e)
      .setInteractive()
      .on('pointerdown', () => this.connectWallet())
      .on('pointerover', () => {
        walletButton.setFillStyle(0x3a7a3c);
        this.tweens.add({
          targets: walletButton,
          y: GAME_HEIGHT + 118,
          duration: 100
        });
      })
      .on('pointerout', () => {
        walletButton.setFillStyle(0x2c5e2e);
        this.tweens.add({
          targets: walletButton,
          y: GAME_HEIGHT + 120,
          duration: 100
        });
      });

    // Add border to wallet button
    const walletBorder = this.add.rectangle(GAME_WIDTH / 2 - 250, GAME_HEIGHT + 120, 180, 60)
      .setStrokeStyle(2, 0x55ff55);

    // Add text to wallet button with improved styling
    const walletText = this.add.text(
      GAME_WIDTH / 2 - 250,
      GAME_HEIGHT + 120,
      'Connect Wallet',
      {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '14px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 2
      }
    ).setOrigin(0.5);

    // Create title for wallet panel
    const walletTitle = this.add.text(
      GAME_WIDTH / 2 - 250,
      GAME_HEIGHT + 95,
      'WALLET',
      {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '12px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 2
      }
    ).setOrigin(0.5).setAlpha(0.9);

    // Store references
    walletButton.setData('walletText', walletText);
    walletButton.setData('walletBg', walletButton);
    walletButton.setData('walletBorder', walletBorder);
    walletButton.setData('walletTitle', walletTitle);
    walletButton.setData('walletPanel', walletPanel);
    this.walletButton = walletButton;

    // Create token balance text with improved styling
    this.gladTokenBalance = this.add.text(
      GAME_WIDTH / 2 - 250,
      GAME_HEIGHT + 155,
      '', // Initially empty
      {
        fontFamily: 'Arial',
        fontSize: '14px',
        color: '#ffaa00',
        stroke: '#000000',
        strokeThickness: 1
      }
    ).setOrigin(0.5).setVisible(false);

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
    const statBarsBg = this.statsPanel.getData('statBarsBg') as Phaser.GameObjects.Graphics;

    // Check if we have both references
    if (!placeholderText || !statsContent) {
      console.error('Missing statsPanel elements:', { placeholderText, statsContent });
      return;
    }

    // Clear existing stats
    statsContent.removeAll(true);
    statsContent.add(statBarsBg);

    // Only update if we have a selected gladiator
    if (!this.selectedGladiator) {
      placeholderText.setVisible(true);
      statBarsBg.setVisible(false);
      return;
    }

    // Hide the placeholder text and show stat bars background
    placeholderText.setVisible(false);
    statBarsBg.setVisible(true);

    // Get stats from the selected gladiator
    const stats = this.selectedGladiator.getStats();
    console.log('Stats to display:', stats);

    if (!stats) {
      console.error('Failed to get stats from gladiator', this.selectedGladiator);
      return;
    }

    // Display gladiator ID with enhanced styling
    const gladiatorTitle = this.add.text(0, -50, `Gladiator ${this.selectedGladiator.id}`, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '14px',
      color: COLORS.highlight,
      stroke: '#000000',
      strokeThickness: 1
    }).setOrigin(0.5);

    statsContent.add(gladiatorTitle);

    // Add animated highlight to the title
    this.tweens.add({
      targets: gladiatorTitle,
      scale: { from: 1, to: 1.05 },
      duration: 800,
      yoyo: true,
      repeat: -1
    });

    // Add each stat as a text line with bar visualization
    const statPositions = [
      { name: 'Strength', key: 'strength' as keyof IGladiatorStats, y: -20, color: 0xff5555, maxVal: 10 },
      { name: 'Speed', key: 'speed' as keyof IGladiatorStats, y: 0, color: 0x55ff55, maxVal: 150 },
      { name: 'Defense', key: 'defense' as keyof IGladiatorStats, y: 20, color: 0x5555ff, maxVal: 10 },
      { name: 'Intelligence', key: 'intelligence' as keyof IGladiatorStats, y: 40, color: 0xffaa00, maxVal: 10 },
      { name: 'Aggression', key: 'aggression' as keyof IGladiatorStats, y: 60, color: 0xff55ff, maxVal: 1 }
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

      // Create label for stat name
      const statLabel = this.add.text(-110, stat.y, `${stat.name}:`, {
        fontFamily: 'Arial',
        fontSize: '12px',
        color: '#aaaaaa',
        stroke: '#000000',
        strokeThickness: 1
      }).setOrigin(0, 0.5);

      // Create value display
      const statValue = this.add.text(110, stat.y, `${valueText}`, {
        fontFamily: 'Arial',
        fontSize: '12px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 1,
        fontStyle: 'bold'
      }).setOrigin(1, 0.5);

      // Create stat bar background
      const barBg = this.add.rectangle(-70, stat.y + 15, 140, 6, 0x333333)
        .setOrigin(0, 0.5);

      // Calculate percentage for the bar (normalized to the expected max value)
      const percentage = Math.min(1, Number(value) / stat.maxVal);

      // Create stat bar fill
      const barFill = this.add.rectangle(-70, stat.y + 15, 140 * percentage, 6, stat.color)
        .setOrigin(0, 0.5);

      // Add everything to the container
      statsContent.add([statLabel, statValue, barBg, barFill]);

      // Animate the bar filling
      this.tweens.add({
        targets: barFill,
        width: { from: 0, to: 140 * percentage },
        duration: 500,
        ease: 'Power2'
      });
    });
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