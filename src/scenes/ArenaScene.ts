import Phaser from 'phaser';
import { COLORS, GAME_WIDTH, GAME_HEIGHT, GLADIATOR_SPRITES, FALLBACK_SPRITE, MATCH_DURATION, RESET_TIME } from '../utils/constants';
import { Gladiator } from '../objects/Gladiator';
import { PowerUp } from '../objects/PowerUp';
import { ArenaHazard } from '../objects/ArenaHazard';
import { PowerUpType } from '../types/PowerUpType';
import { HazardDirection } from '../types/HazardType';
import { DEFAULT_GAME_SETTINGS } from '../types/GameConfig';
import { matchManager, MatchResult } from '../utils/MatchManager';

export class ArenaScene extends Phaser.Scene {
  // Spawn zones for gladiators
  private spawnZones: Phaser.Geom.Rectangle[];
  
  // Gladiator management
  private gladiators: Gladiator[];
  private gladiatorCount: number = 4; // Number of gladiators to spawn
  
  // Power-up management
  private powerUps: PowerUp[] = [];
  private powerUpSpawnTimer: Phaser.Time.TimerEvent | null = null;
  
  // Hazard management
  private hazards: ArenaHazard[] = [];
  private hazardSpawnTimer: Phaser.Time.TimerEvent | null = null;
  
  // Debug settings
  private debugMode: boolean;
  
  // Match timer
  private matchTimer: number = MATCH_DURATION; // Use constant for match duration
  private matchTimerText: Phaser.GameObjects.Text | null = null;
  
  // Match statistics
  private matchCount: number = 0;
  private matchStatistics: {
    matchNumber: number;
    winnerId?: number;
    winnerName?: string;
    duration: number;
    powerUpsCollected: number;
    hazardsTriggered: number;
  }[] = [];
  
  // Current match tracking
  private currentMatchPowerUpsCollected: number = 0;
  private currentMatchHazardsTriggered: number = 0;
  private matchStartTime: number = 0;
  
  // Sprite selection for this round
  private currentRoundSprites: string[] = [];
  
  // Add a new property to track predictions
  private predictions: { 
    walletAddress: string;
    gladiatorId: number;
    amount: number;
  }[] = [];
  
  constructor() {
    super({ key: 'ArenaScene' });
    this.spawnZones = [];
    this.gladiators = [];
    this.debugMode = DEFAULT_GAME_SETTINGS.debugMode;
  }

  preload(): void {
    // Load all gladiator sprites
    GLADIATOR_SPRITES.forEach((sprite, index) => {
      this.load.image(`gladiator_sprite_${index}`, sprite);
    });
    
    // Load fallback sprite
    this.load.image('gladiator_fallback', FALLBACK_SPRITE);
    
    // Load particle for effects
    this.load.image('particle', 'https://labs.phaser.io/assets/particles/white.png');
  }

  create(): void {
    // Reset match state
    this.data.set('matchEnding', false);
    
    // Clear any existing objects in case of incomplete cleanup
    this.cleanupScene();
    
    // Reset arrays
    this.spawnZones = [];
    this.gladiators = [];
    this.powerUps = [];
    this.hazards = [];
    
    // Reset match statistics for this round
    this.currentMatchPowerUpsCollected = 0;
    this.currentMatchHazardsTriggered = 0;
    
    // Record match start time
    this.matchStartTime = this.time.now;
    
    // Get next match ID from MatchManager
    this.matchCount = matchManager.getNextMatchId();
    
    // Set camera to view the main arena area only
    this.cameras.main.setViewport(0, 0, GAME_WIDTH, GAME_HEIGHT);
    
    // Set specific bounds for the arena to keep it contained to the top portion
    this.physics.world.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT);
    
    // Select random sprites for this round
    this.selectRandomSpritesForRound();
    
    // Set arena background
    // this.cameras.main.setBackgroundColor(COLORS.background);
    
    // Create a more interesting arena background with grid and pattern
    const background = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'background')
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
      .setAlpha(0.7);
    
    // Add a secondary pulsing backdrop for depth
    const backdropGlow = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'background')
      .setDisplaySize(GAME_WIDTH + 50, GAME_HEIGHT + 50)
      .setTint(0x2233aa)
      .setAlpha(0.3);
    
    // Pulse the backdrop glow
    this.tweens.add({
      targets: backdropGlow,
      alpha: { from: 0.3, to: 0.5 },
      scale: { from: 1.05, to: 1.1 },
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    
    // Create a repeating pattern effect with the background texture
    const bgPattern = this.add.tileSprite(
      GAME_WIDTH / 2, 
      GAME_HEIGHT / 2, 
      GAME_WIDTH, 
      GAME_HEIGHT, 
      'background'
    ).setAlpha(0.4);
    
    // Add subtle animation to the background pattern
    this.tweens.add({
      targets: bgPattern,
      tilePositionX: { from: 0, to: 256 },
      tilePositionY: { from: 0, to: 256 },
      ease: 'Linear',
      duration: 60000, // 1 minute for a full cycle
      repeat: -1
    });
    
    // Add corner decorations
    this.createCornerDecorations();
    
    // Add a grid overlay for the arena floor with more detailed design
    const gridSize = 64;
    const graphics = this.add.graphics();
    graphics.lineStyle(1, 0x3333cc, 0.3);
    
    // Draw horizontal grid lines
    for (let y = 0; y <= GAME_HEIGHT; y += gridSize) {
      graphics.moveTo(0, y);
      graphics.lineTo(GAME_WIDTH, y);
    }
    
    // Draw vertical grid lines
    for (let x = 0; x <= GAME_WIDTH; x += gridSize) {
      graphics.moveTo(x, 0);
      graphics.lineTo(x, GAME_HEIGHT);
    }
    
    // Add circular markers at grid intersections
    graphics.fillStyle(0x4444ff, 0.2);
    for (let x = gridSize; x < GAME_WIDTH; x += gridSize) {
      for (let y = gridSize; y < GAME_HEIGHT; y += gridSize) {
        // Add small dots at grid intersections
        graphics.fillCircle(x, y, 2);
      }
    }
    
    // Create special center arena marker
    this.createCenterArenaMarker();
    
    // Draw arena border with a glowing effect
    const borderGraphics = this.add.graphics();
    borderGraphics.lineStyle(4, 0xff5555, 0.8);
    borderGraphics.strokeRect(10, 10, GAME_WIDTH - 20, GAME_HEIGHT - 20);
    
    // Add secondary inner border
    borderGraphics.lineStyle(2, 0x00ffff, 0.4);
    borderGraphics.strokeRect(20, 20, GAME_WIDTH - 40, GAME_HEIGHT - 40);
    
    // Add decorative corner elements
    const cornerSize = 40;
    
    // Top-left corner
    borderGraphics.lineStyle(4, 0xffaa00, 1);
    borderGraphics.moveTo(5, 40);
    borderGraphics.lineTo(5, 5);
    borderGraphics.lineTo(40, 5);
    
    // Top-right corner
    borderGraphics.moveTo(GAME_WIDTH - 5, 40);
    borderGraphics.lineTo(GAME_WIDTH - 5, 5);
    borderGraphics.lineTo(GAME_WIDTH - 40, 5);
    
    // Bottom-left corner
    borderGraphics.moveTo(5, GAME_HEIGHT - 40);
    borderGraphics.lineTo(5, GAME_HEIGHT - 5);
    borderGraphics.lineTo(40, GAME_HEIGHT - 5);
    
    // Bottom-right corner
    borderGraphics.moveTo(GAME_WIDTH - 5, GAME_HEIGHT - 40);
    borderGraphics.lineTo(GAME_WIDTH - 5, GAME_HEIGHT - 5);
    borderGraphics.lineTo(GAME_WIDTH - 40, GAME_HEIGHT - 5);
    
    // Add extra corner decorations
    borderGraphics.lineStyle(3, 0xff9900, 0.8);
    
    // Top-left decorative elements
    borderGraphics.beginPath();
    borderGraphics.arc(5, 5, 30, 0, Math.PI/2);
    borderGraphics.strokePath();
    
    // Top-right decorative elements
    borderGraphics.beginPath();
    borderGraphics.arc(GAME_WIDTH - 5, 5, 30, Math.PI/2, Math.PI);
    borderGraphics.strokePath();
    
    // Bottom-left decorative elements
    borderGraphics.beginPath();
    borderGraphics.arc(5, GAME_HEIGHT - 5, 30, Math.PI*1.5, Math.PI*2);
    borderGraphics.strokePath();
    
    // Bottom-right decorative elements
    borderGraphics.beginPath();
    borderGraphics.arc(GAME_WIDTH - 5, GAME_HEIGHT - 5, 30, Math.PI, Math.PI*1.5);
    borderGraphics.strokePath();
    
    // Add a pulsing glow effect to the border
    this.tweens.add({
      targets: borderGraphics,
      alpha: { from: 0.7, to: 1 },
      yoyo: true,
      repeat: -1,
      duration: 2000,
      ease: 'Sine.easeInOut'
    });
    
    // Add background particles for atmosphere
    const particles = this.add.particles(0, 0, 'particle', {
      x: { min: 0, max: GAME_WIDTH },
      y: { min: 0, max: GAME_HEIGHT },
      lifespan: 8000,
      speedY: { min: -10, max: 10 },
      speedX: { min: -10, max: 10 },
      scale: { start: 0.2, end: 0 },
      quantity: 1,
      frequency: 500,
      blendMode: 'ADD',
      tint: [0x4455ff, 0x22ffaa, 0xff44aa],
      alpha: { start: 0.2, end: 0 }
    });
    
    // Add energy field particles around the border
    this.createEnergyFieldEffect();
    
    // Create arena title with match number
    this.add.text(
      GAME_WIDTH / 2, 
      30, 
      `AI Gladiators Arena - Match #${this.matchCount}`, 
      { 
        fontFamily: 'Arial', 
        fontSize: '28px', 
        color: COLORS.primaryText 
      }
    ).setOrigin(0.5, 0.5);

    // Create spawn zones (four corners of the arena)
    this.createSpawnZones();
    
    // Visualize spawn zones in debug mode
    if (this.debugMode) {
      this.visualizeSpawnZones();
    }
    
    // Reset match timer
    this.matchTimer = MATCH_DURATION;
    
    // Create match timer text
    this.matchTimerText = this.add.text(
      GAME_WIDTH / 2,
      70,
      `Time: ${this.matchTimer}s`,
      {
        fontFamily: 'Arial',
        fontSize: '18px',
        color: COLORS.primaryText
      }
    ).setOrigin(0.5, 0.5);
    
    // Timer event to update match timer every second
    this.time.addEvent({
      delay: 1000,
      callback: this.updateMatchTimer,
      callbackScope: this,
      loop: true
    });
    
    // Start the UI Scene
    if (!this.scene.isActive('UIScene')) {
      this.scene.launch('UIScene');
    }
    
    // Listen for prediction events from UI scene
    this.events.on('predictionMade', this.handlePrediction, this);
    
    // Spawn gladiators
    this.spawnGladiators();
    
    // Set up power-up spawning timer
    this.setupPowerUpSpawner();
    
    // Set up hazard spawning timer
    this.setupHazardSpawner();
    
    // Set up collision between gladiators
    this.physics.add.collider(
      this.gladiators,
      this.gladiators,
      this.handleGladiatorCollision,
      undefined,
      this
    );
    
    // Set up collision between gladiators and power-ups
    this.physics.add.overlap(
      this.gladiators,
      this.powerUps,
      this.handlePowerUpCollision,
      undefined,
      this
    );
    
    // Set up collision between gladiators and hazards
    this.physics.add.overlap(
      this.gladiators,
      this.hazards,
      this.handleHazardCollision,
      undefined,
      this
    );
    
    // Enable world bounds collision feedback to prevent sticking to edges
    this.physics.world.setBoundsCollision(true, true, true, true);
    
    console.log(`ArenaScene created successfully for match #${this.matchCount}!`);
    
    // Add a visual "starting" effect
    this.createRoundStartEffect();
  }

  // Clean up scene elements to prevent memory leaks
  private cleanupScene(): void {
    console.log('Running thorough cleanup...');
    
    // Clean up gladiators first
    if (this.gladiators && this.gladiators.length > 0) {
      for (const gladiator of this.gladiators) {
        if (gladiator) {
          gladiator.cleanup();
        }
      }
      // Clear the array
      this.gladiators = [];
    }
    
    // Clean up power-ups
    if (this.powerUps && this.powerUps.length > 0) {
      for (const powerUp of this.powerUps) {
        if (powerUp && powerUp.active) {
          powerUp.destroyPowerUp();
        }
      }
      this.powerUps = [];
    }
    
    // Clean up hazards
    if (this.hazards && this.hazards.length > 0) {
      for (const hazard of this.hazards) {
        if (hazard && hazard.active) {
          hazard.destroyHazard();
        }
      }
      this.hazards = [];
    }
    
    // Stop all timers to prevent duplicate events
    this.time.removeAllEvents();
    
    // Clear power-up and hazard spawn timers
    if (this.powerUpSpawnTimer) {
      this.powerUpSpawnTimer.remove();
      this.powerUpSpawnTimer = null;
    }
    
    if (this.hazardSpawnTimer) {
      this.hazardSpawnTimer.remove();
      this.hazardSpawnTimer = null;
    }
    
    // Destroy all game objects by type
    this.children.getAll().forEach(child => {
      // Skip essential objects
      if (child.name === '__camera') return;
      
      // Clean up various object types
      if (child instanceof Phaser.GameObjects.Text || 
          child instanceof Phaser.GameObjects.Graphics ||
          child instanceof Phaser.GameObjects.Rectangle ||
          child instanceof Phaser.GameObjects.Sprite ||
          child instanceof Phaser.GameObjects.Particles.ParticleEmitter) {
        child.destroy();
      }
    });
    
    // Reset match timer
    this.matchTimer = MATCH_DURATION;
    
    // Clear any cached data
    this.data.set('matchEnding', false);
    
    console.log('Cleanup completed');
  }

  update(): void {
    // Update each gladiator
    for (const gladiator of this.gladiators) {
      if (gladiator.active) {
        gladiator.update();
      }
    }
    
    // Update each power-up
    for (const powerUp of this.powerUps) {
      if (powerUp.active) {
        powerUp.update();
      }
    }
    
    // Update each hazard
    for (const hazard of this.hazards) {
      if (hazard.active) {
        hazard.update();
      }
    }
    
    // Find targets for each gladiator
    this.updateGladiatorTargets();
    
    // Check if we should end the match
    this.checkMatchEnd();
  }

  private createSpawnZones(): void {
    // Create four spawn zones in the corners of the arena
    const margin = 80; // Margin from edges
    const zoneSize = 100; // Size of spawn zone
    
    // Top-left spawn zone
    this.spawnZones.push(new Phaser.Geom.Rectangle(
      margin, 
      margin, 
      zoneSize, 
      zoneSize
    ));
    
    // Top-right spawn zone
    this.spawnZones.push(new Phaser.Geom.Rectangle(
      GAME_WIDTH - margin - zoneSize, 
      margin, 
      zoneSize, 
      zoneSize
    ));
    
    // Bottom-left spawn zone
    this.spawnZones.push(new Phaser.Geom.Rectangle(
      margin, 
      GAME_HEIGHT - margin - zoneSize, 
      zoneSize, 
      zoneSize
    ));
    
    // Bottom-right spawn zone
    this.spawnZones.push(new Phaser.Geom.Rectangle(
      GAME_WIDTH - margin - zoneSize, 
      GAME_HEIGHT - margin - zoneSize, 
      zoneSize, 
      zoneSize
    ));
  }

  private visualizeSpawnZones(): void {
    // Draw spawn zones for debugging
    const graphics = this.add.graphics({ fillStyle: { color: 0x008800, alpha: 0.3 } });
    
    for (const zone of this.spawnZones) {
      graphics.fillRectShape(zone);
      
      // Add a label to each spawn zone
      const zoneIndex = this.spawnZones.indexOf(zone);
      this.add.text(
        zone.x + zone.width / 2,
        zone.y + zone.height / 2,
        `Zone ${zoneIndex + 1}`,
        { 
          fontFamily: 'Arial', 
          fontSize: '14px',
          color: COLORS.primaryText
        }
      ).setOrigin(0.5, 0.5);
    }
  }
  
  // Select random sprites for this round
  private selectRandomSpritesForRound(): void {
    // Clear previous selection
    this.currentRoundSprites = [];
    
    // Create a copy of the sprite array to shuffle
    const availableSprites = [...GLADIATOR_SPRITES];
    
    // Fisher-Yates shuffle algorithm
    for (let i = availableSprites.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [availableSprites[i], availableSprites[j]] = [availableSprites[j], availableSprites[i]];
    }
    
    // Take the first 4 sprites (or however many we need)
    for (let i = 0; i < this.gladiatorCount; i++) {
      if (i < availableSprites.length) {
        // Generate a texture key for this sprite
        const textureKey = `gladiator_sprite_${GLADIATOR_SPRITES.indexOf(availableSprites[i])}`;
        this.currentRoundSprites.push(textureKey);
      } else {
        // Use fallback if we somehow run out of sprites
        this.currentRoundSprites.push('gladiator_fallback');
      }
    }
    
    console.log(`Selected ${this.currentRoundSprites.length} random sprites for this round`);
  }
  
  private spawnGladiators(): void {
    console.log('Spawning gladiators...');
    
    // Loop through each spawn zone
    for (let i = 0; i < Math.min(this.spawnZones.length, this.gladiatorCount); i++) {
      const zone = this.spawnZones[i];
      
      // Choose random position within zone
      const x = Phaser.Math.Between(zone.x, zone.x + zone.width);
      const y = Phaser.Math.Between(zone.y, zone.y + zone.height);
      
      // Get random sprite from the current round's selection
      const spriteKey = this.currentRoundSprites[i] || 'gladiator_fallback';
      
      // Create gladiator
      const gladiator = new Gladiator(this, x, y, spriteKey);
      
      // Set unique ID for the gladiator
      gladiator.id = i + 1;
      
      // Make gladiator interactable
      gladiator.setInteractive({ useHandCursor: true });
      
      // Add click handler for gladiator selection
      gladiator.on('pointerdown', () => {
        this.selectGladiator(gladiator);
      });
      
      // Add to gladiators array
      this.gladiators.push(gladiator);
      
      console.log(`Gladiator ${i + 1} spawned at (${x}, ${y}) with sprite ${spriteKey}`);
    }
    
    // Set initial targets for gladiators
    this.updateGladiatorTargets();
  }
  
  // Add a method to handle gladiator selection
  private selectGladiator(gladiator: Gladiator): void {
    // First log the gladiator to debug
    console.log('Gladiator selected in ArenaScene:', gladiator);
    console.log('Gladiator ID:', gladiator.id);
    console.log('Gladiator stats:', gladiator.getStats());

    // Make sure the gladiator is valid before emitting
    if (!gladiator || !gladiator.active) {
      console.error('Attempted to select an invalid or inactive gladiator');
      return;
    }

    // Highlight the selected gladiator
    this.gladiators.forEach(g => {
      const outline = g.getData('selectOutline');
      if (outline) {
        outline.destroy();
      }
    });
    
    // Add a selection outline to the selected gladiator
    const outline = this.add.circle(gladiator.x, gladiator.y, 35, 0xffff00, 0.3);
    outline.setStrokeStyle(2, 0xffff00);
    gladiator.setData('selectOutline', outline);

    // Make sure to update the outline position when the gladiator moves
    const outlineUpdate = this.time.addEvent({
      delay: 100,
      callback: () => {
        if (outline && outline.active && gladiator && gladiator.active) {
          outline.setPosition(gladiator.x, gladiator.y);
        } else {
          // Clean up the timer if gladiator is no longer active
          outlineUpdate.remove();
          if (outline && outline.active) {
            outline.destroy();
          }
        }
      },
      callbackScope: this,
      loop: true
    });

    // Emit event that UIScene can listen to - do this AFTER all setup
    this.events.emit('gladiatorSelected', gladiator);
  }
  
  private updateGladiatorTargets(): void {
    // For each gladiator, find the nearest other gladiator as target
    for (const gladiator of this.gladiators) {
      if (!gladiator.active) continue;
      
      let nearestGladiator: Gladiator | null = null;
      let nearestDistance = Number.MAX_VALUE;
      
      // Find the nearest other gladiator
      for (const otherGladiator of this.gladiators) {
        if (otherGladiator === gladiator || !otherGladiator.active) continue;
        
        const distance = Phaser.Math.Distance.Between(
          gladiator.x, gladiator.y,
          otherGladiator.x, otherGladiator.y
        );
        
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestGladiator = otherGladiator;
        }
      }
      
      // Set the target
      gladiator.setTarget(nearestGladiator);
      
      // Find the nearest power-up
      let nearestPowerUp: PowerUp | null = null;
      nearestDistance = Number.MAX_VALUE;
      
      for (const powerUp of this.powerUps) {
        if (!powerUp.active) continue;
        
        const distance = Phaser.Math.Distance.Between(
          gladiator.x, gladiator.y,
          powerUp.x, powerUp.y
        );
        
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestPowerUp = powerUp;
        }
      }
      
      // If a power-up is within range (300 pixels), set it as a target
      if (nearestPowerUp && nearestDistance < 300) {
        gladiator.setPowerUpTarget(nearestPowerUp);
      } else {
        gladiator.setPowerUpTarget(null);
      }
    }
  }
  
  private handleGladiatorCollision(gladiator1: any, gladiator2: any): void {
    // Safety check and conversion
    if (!(gladiator1 instanceof Gladiator) || !(gladiator2 instanceof Gladiator)) {
      return;
    }
    
    // Determine if both gladiators are active
    if (!gladiator1.active || !gladiator2.active) {
      return;
    }
    
    // Apply stronger separation to prevent sticking
    if (gladiator1.body && gladiator1.body.velocity) {
      const angle = Phaser.Math.Angle.Between(
        gladiator1.x, gladiator1.y,
        gladiator2.x, gladiator2.y
      );
      
      // Apply opposite force to separate gladiators
      gladiator1.setVelocity(
        -Math.cos(angle) * gladiator1.stats.speed * 0.5,
        -Math.sin(angle) * gladiator1.stats.speed * 0.5
      );
    }
    
    if (gladiator2.body && gladiator2.body.velocity) {
      const angle = Phaser.Math.Angle.Between(
        gladiator2.x, gladiator2.y,
        gladiator1.x, gladiator1.y
      );
      
      // Apply opposite force to separate gladiators
      gladiator2.setVelocity(
        -Math.cos(angle) * gladiator2.stats.speed * 0.5,
        -Math.sin(angle) * gladiator2.stats.speed * 0.5
      );
    }
    
    // Random chance to trigger attack state immediately upon collision
    if (Math.random() < 0.3) {
      if (gladiator1.active) gladiator1.setTarget(gladiator2);
      if (gladiator2.active) gladiator2.setTarget(gladiator1);
    }
  }
  
  private updateMatchTimer(): void {
    if (this.matchTimer <= 0) return;
    
    // Decrement timer
    this.matchTimer--;
    
    // Update text
    if (this.matchTimerText) {
      // Make the timer change color as it gets closer to 0
      let timerColor = COLORS.primaryText;
      if (this.matchTimer <= 10) {
        // Flash red for last 10 seconds
        timerColor = this.matchTimer % 2 === 0 ? '#ff4444' : '#ff0000';
      } else if (this.matchTimer <= 20) {
        // Yellow warning for 20-10 seconds remaining
        timerColor = '#ffff00';
      }
      
      this.matchTimerText.setText(`Time: ${this.matchTimer}s`);
      this.matchTimerText.setColor(timerColor);
      
      // Pulse effect for last 10 seconds
      if (this.matchTimer <= 10 && this.matchTimer > 0) {
        this.tweens.add({
          targets: this.matchTimerText,
          scale: { from: 1, to: 1.2 },
          duration: 200,
          yoyo: true,
          ease: 'Sine.easeInOut'
        });
      }
    }
    
    // Check for time up
    if (this.matchTimer <= 0) {
      console.log('Time up!');
      this.endMatch();
    }
  }
  
  private checkMatchEnd(): void {
    // Count active gladiators
    const activeGladiators = this.gladiators.filter(g => g.active);
    
    // If only one or zero left, end match
    let shouldEndMatch = activeGladiators.length <= 1;
    
    // If the match should end, handle results
    if (shouldEndMatch) {
      // Calculate match duration in seconds
      const matchDuration = (this.time.now - this.matchStartTime) / 1000;
      
      // Prepare match result for record keeping
      const matchResult: MatchResult = {
        matchId: this.matchCount,
        winner: null, // Will be set if there's a winner
        duration: matchDuration,
        timestamp: Date.now(),
        stats: {
          powerUpsCollected: this.currentMatchPowerUpsCollected,
          hazardsTriggered: this.currentMatchHazardsTriggered
        },
        predictions: this.predictions.map(p => ({
          address: p.walletAddress,
          gladiatorId: p.gladiatorId,
          amount: p.amount,
          wasCorrect: false // Will be updated for correct predictions
        }))
      };
      
      if (activeGladiators.length === 1) {
        const winner = activeGladiators[0];
        console.log(`Gladiator ${winner.id} is the winner!`);
        
        // Set winner in match result
        matchResult.winner = {
          id: winner.id,
          name: `Gladiator ${winner.id}`
        };
        
        // Mark correct predictions
        matchResult.predictions.forEach(p => {
          if (p.gladiatorId === winner.id) {
            p.wasCorrect = true;
          }
        });
        
        // Record match statistics
        this.matchStatistics.push({
          matchNumber: this.matchCount,
          winnerId: winner.id,
          winnerName: `Gladiator ${winner.id}`,
          duration: matchDuration,
          powerUpsCollected: this.currentMatchPowerUpsCollected,
          hazardsTriggered: this.currentMatchHazardsTriggered
        });
        
        // Emit match end event for UI scene with stats
        this.events.emit('matchEnd', winner, {
          matchNumber: this.matchCount,
          duration: matchDuration,
          powerUpsCollected: this.currentMatchPowerUpsCollected,
          hazardsTriggered: this.currentMatchHazardsTriggered
        });
        
        // Create a clean game over overlay
        this.createGameOverScreen(winner);
      } else {
        console.log('No gladiators left - draw!');
        
        // Record match statistics for a draw
        this.matchStatistics.push({
          matchNumber: this.matchCount,
          duration: matchDuration,
          powerUpsCollected: this.currentMatchPowerUpsCollected,
          hazardsTriggered: this.currentMatchHazardsTriggered
        });
        
        // Emit match end event for UI scene
        this.events.emit('matchEnd', null, {
          matchNumber: this.matchCount,
          duration: matchDuration,
          powerUpsCollected: this.currentMatchPowerUpsCollected,
          hazardsTriggered: this.currentMatchHazardsTriggered
        });
        
        // Create a clean game over overlay for a draw
        this.createGameOverScreen(null);
      }
      
      // Record the match in MatchManager
      matchManager.recordMatch(matchResult);
      
      this.endMatch();
    }
  }
  
  // Create a new visual effect for round start
  private createRoundStartEffect(): void {
    // Add a "Round X" text that zooms in
    const roundText = this.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      `MATCH ${this.matchCount}`,
      {
        fontFamily: 'Arial',
        fontSize: '64px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 6,
        fontStyle: 'bold'
      }
    ).setOrigin(0.5)
     .setAlpha(0)
     .setScale(3);
    
    // Add "FIGHT!" text that appears after
    const fightText = this.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2 + 80,
      'FIGHT!',
      {
        fontFamily: 'Arial',
        fontSize: '72px',
        color: '#ff0000',
        stroke: '#000000',
        strokeThickness: 8,
        fontStyle: 'bold'
      }
    ).setOrigin(0.5)
     .setAlpha(0)
     .setScale(0.5);
    
    // First animate the round text
    this.tweens.add({
      targets: roundText,
      alpha: { from: 0, to: 1 },
      scale: { from: 3, to: 1 },
      duration: 800,
      ease: 'Bounce.Out',
      onComplete: () => {
        // Then show the fight text
        this.tweens.add({
          targets: fightText,
          alpha: { from: 0, to: 1 },
          scale: { from: 0.5, to: 2 },
          duration: 600,
          ease: 'Power2',
          yoyo: true,
          hold: 300,
          onComplete: () => {
            // Clean up both texts
            roundText.destroy();
            fightText.destroy();
          }
        });
      }
    });
  }

  // Create a clean, attractive game over screen with improved stats
  private createGameOverScreen(winner: Gladiator | null): void {
    // Create semi-transparent overlay
    const overlay = this.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      GAME_WIDTH,
      GAME_HEIGHT,
      0x000000,
      0.7
    ).setDepth(9);
    
    // Add border to the overlay
    const border = this.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      GAME_WIDTH - 40,
      GAME_HEIGHT - 40,
      0x000000,
      0
    ).setStrokeStyle(3, 0xffdd00)
     .setDepth(10);
    
    if (winner) {
      // Create winner header text
      this.add.text(
        GAME_WIDTH / 2,
        GAME_HEIGHT / 4,
        'WINNER!',
        {
          fontFamily: 'Arial',
          fontSize: '64px',
          color: '#ffdd00',
          fontStyle: 'bold',
          stroke: '#000000',
          strokeThickness: 6
        }
      ).setOrigin(0.5, 0.5)
       .setDepth(10);
       
      // Create winner display in center
      const winnerDisplay = this.add.sprite(
        GAME_WIDTH / 2,
        GAME_HEIGHT / 2,
        winner.texture.key
      ).setDepth(11)
       .setScale(3.0); // Make winner bigger
       
      // Add a rotating highlight around the winner
      const highlightRadius = 70;
      const highlight = this.add.graphics().setDepth(10);
      
      // Create pulsing and rotating effect
      this.tweens.add({
        targets: winnerDisplay,
        scale: 3.5,
        duration: 800,
        yoyo: true,
        repeat: -1
      });
      
      // Create ribbon-like celebration effect
      this.createConfettiEffect(GAME_WIDTH / 2, GAME_HEIGHT / 2);
      
      // Add winner ID text
      this.add.text(
        GAME_WIDTH / 2,
        GAME_HEIGHT / 2 + 100,
        `Gladiator ${winner.id}`,
        {
          fontFamily: 'Arial',
          fontSize: '32px',
          color: '#ffffff',
          fontStyle: 'bold'
        }
      ).setOrigin(0.5, 0.5)
       .setDepth(10);
    } else {
      // Draw text - if no winner
      this.add.text(
        GAME_WIDTH / 2,
        GAME_HEIGHT / 2,
        'DRAW!',
        {
          fontFamily: 'Arial',
          fontSize: '64px',
          color: '#ffffff',
          fontStyle: 'bold',
          stroke: '#000000',
          strokeThickness: 6
        }
      ).setOrigin(0.5, 0.5)
       .setDepth(10);
    }
    
    // Add match statistics
    const currentMatchStats = this.matchStatistics[this.matchStatistics.length - 1];
    
    // Match duration
    this.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT - 200,
      `Match Duration: ${currentMatchStats.duration.toFixed(1)}s`,
      {
        fontFamily: 'Arial',
        fontSize: '18px',
        color: COLORS.primaryText
      }
    ).setOrigin(0.5, 0.5)
     .setDepth(10);
    
    // Power-ups collected
    this.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT - 170,
      `Power-ups Collected: ${currentMatchStats.powerUpsCollected}`,
      {
        fontFamily: 'Arial',
        fontSize: '18px',
        color: COLORS.primaryText
      }
    ).setOrigin(0.5, 0.5)
     .setDepth(10);
    
    // Hazards triggered
    this.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT - 140,
      `Hazards Triggered: ${currentMatchStats.hazardsTriggered}`,
      {
        fontFamily: 'Arial',
        fontSize: '18px',
        color: COLORS.primaryText
      }
    ).setOrigin(0.5, 0.5)
     .setDepth(10);
  }
  
  // Create ribbon-like celebration effect
  private createConfettiEffect(x: number, y: number): void {
    // Festive, celebratory color palette
    const ribbonColors = [0xffd700, 0xff6347, 0xda70d6, 0x00ced1, 0xff1493];
    
    // Create more ribbons to compensate for removed particles
    for (let i = 0; i < 40; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 100 + Math.random() * 180;
      const color = ribbonColors[Math.floor(Math.random() * ribbonColors.length)];
      
      // Create ribbon with varying sizes
      const ribbon = this.add.rectangle(
        x,
        y,
        2 + Math.random() * 3, // width
        15 + Math.random() * 25, // height (longer ribbon)
        color
      ).setOrigin(0.5, 0)
       .setDepth(11)
       .setAlpha(0.7 + Math.random() * 0.3);
      
      // Make ribbons spiral outward
      this.tweens.add({
        targets: ribbon,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        rotation: Math.random() * 8,
        alpha: 0,
        duration: 1200 + Math.random() * 800,
        ease: 'Cubic.easeOut',
        onComplete: () => {
          ribbon.destroy();
        }
      });
    }
    
    // Create a second burst of ribbons with slight delay for continuous effect
    this.time.delayedCall(300, () => {
      for (let i = 0; i < 20; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = 80 + Math.random() * 150;
        const color = ribbonColors[Math.floor(Math.random() * ribbonColors.length)];
        
        const ribbon = this.add.rectangle(
          x,
          y,
          2 + Math.random() * 3, // width
          10 + Math.random() * 30, // height
          color
        ).setOrigin(0.5, 0)
         .setDepth(11)
         .setAlpha(0.7 + Math.random() * 0.3);
        
        // Different animation pattern for variety
        this.tweens.add({
          targets: ribbon,
          x: x + Math.cos(angle) * distance,
          y: y + Math.sin(angle) * distance,
          rotation: Math.random() * 6 - 3,
          alpha: 0,
          duration: 1000 + Math.random() * 1000,
          ease: 'Sine.easeOut',
          onComplete: () => {
            ribbon.destroy();
          }
        });
      }
    });
  }
  
  private endMatch(): void {
    console.log('Ending match...');
    
    // Flag to prevent multiple restarts
    if (this.data.has('matchEnding') && this.data.get('matchEnding')) {
      return;
    }
    this.data.set('matchEnding', true);
    
    // Stop timer events but keep our new countdown timer
    this.time.removeAllEvents();
    
    // Stop all gladiator movements
    for (const gladiator of this.gladiators) {
      if (gladiator && gladiator.active) {
        gladiator.setVelocity(0, 0);
      }
    }
    
    // Create "New Match Starting..." text
    const newMatchText = this.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT - 80,
      'New Match Starting...',
      {
        fontFamily: 'Arial',
        fontSize: '18px',
        color: COLORS.primaryText,
        backgroundColor: '#00000088',
        padding: { x: 10, y: 5 }
      }
    ).setOrigin(0.5, 0.5)
     .setDepth(11);
    
    // Countdown effect
    let countdown = RESET_TIME; // Use the constant instead of hardcoded value
    const countdownText = this.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT - 40,
      countdown.toString(),
      {
        fontFamily: 'Arial',
        fontSize: '36px',
        color: COLORS.highlight,
        fontStyle: 'bold',
        backgroundColor: '#00000088',
        padding: { x: 15, y: 5 }
      }
    ).setOrigin(0.5, 0.5)
     .setDepth(11);
    
    // Animate countdown with a smoother sequence
    const countdownInterval = 1000; // 1 second between counts
    const countdownEvent = this.time.addEvent({
      delay: countdownInterval,
      callback: () => {
        countdown--;
        if (countdown >= 0) {
          countdownText.setText(countdown.toString());
          
          // Pulse animation for countdown
          this.tweens.add({
            targets: countdownText,
            scale: { from: 1, to: 1.5 },
            duration: 300,
            yoyo: true,
            ease: 'Sine.easeInOut'
          });
        }
      },
      callbackScope: this,
      repeat: RESET_TIME - 1 // One less than reset time to account for starting at 0
    });
    
    // Add a transition effect between rounds
    this.cameras.main.fadeOut(RESET_TIME * 1000 - 500, 0, 0, 0);
    
    // Single hard restart after a fixed delay instead of cascading timers
    this.time.delayedCall(RESET_TIME * 1000, () => {
      console.log('Restarting scene now...');
      
      // Clean up scene properly before restarting
      this.sceneCleanup();
      
      // Force a complete restart using a full scene transition
      this.scene.stop('ArenaScene');
      this.scene.start('ArenaScene');
      
      // Fade back in
      this.cameras.main.fadeIn(500, 0, 0, 0);
    });
    
    // Clear predictions for the next match
    this.predictions = [];
  }
  
  // Called when scene shuts down
  public sceneCleanup(): void {
    // This can be called manually when scene transitions
    console.log('ArenaScene cleanup');
    
    // Make sure we do a full cleanup
    this.cleanupScene();
    
    // Reset the match ending flag
    this.data.set('matchEnding', false);
  }

  // New methods for power-ups and hazards
  
  // Set up power-up spawning timer
  private setupPowerUpSpawner(): void {
    // Spawn first power-up after 5 seconds, then every 8-15 seconds
    this.powerUpSpawnTimer = this.time.addEvent({
      delay: 5000,
      callback: this.spawnRandomPowerUp,
      callbackScope: this,
      loop: false
    });
  }
  
  // Spawn a random power-up in the arena
  private spawnRandomPowerUp(): void {
    // Don't spawn more power-ups if match is ending
    if (this.data.get('matchEnding')) return;
    
    // Calculate a random position within the arena (avoid edges)
    const margin = 100; // Margin from edges
    const x = margin + Math.random() * (GAME_WIDTH - margin * 2);
    const y = margin + Math.random() * (GAME_HEIGHT - margin * 2);
    
    // Choose a random power-up type
    const powerUpTypes = [
      PowerUpType.SHIELD,
      PowerUpType.TRAP,
      PowerUpType.CHAOS
    ];
    
    const randomType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
    
    // Create the power-up
    const powerUp = new PowerUp(this, x, y, randomType);
    
    // Add to the power-ups array
    this.powerUps.push(powerUp);
    
    console.log(`Spawned ${randomType} power-up at (${x}, ${y})`);
    
    // Schedule next power-up spawn
    const nextSpawnTime = 8000 + Math.random() * 7000; // 8-15 seconds
    this.powerUpSpawnTimer = this.time.addEvent({
      delay: nextSpawnTime,
      callback: this.spawnRandomPowerUp,
      callbackScope: this,
      loop: false
    });
  }
  
  // Set up hazard spawning timer
  private setupHazardSpawner(): void {
    // Spawn first hazard after 10 seconds, then every 6-12 seconds
    this.hazardSpawnTimer = this.time.addEvent({
      delay: 10000,
      callback: this.spawnRandomHazard,
      callbackScope: this,
      loop: false
    });
  }
  
  // Spawn a random hazard in the arena
  private spawnRandomHazard(): void {
    // Don't spawn more hazards if match is ending
    if (this.data.get('matchEnding')) return;
    
    // Choose a random hazard type (spike wall or fireball)
    const hazardType = Math.random() > 0.5 ? 'spikeWall' : 'fireball';
    let hazard;
    
    if (hazardType === 'spikeWall') {
      // For spike wall, choose a random direction
      const direction = Math.random() > 0.5 ? HazardDirection.HORIZONTAL : HazardDirection.VERTICAL;
      hazard = ArenaHazard.createSpikeWall(this, direction);
    } else {
      // For fireball, just create it
      hazard = ArenaHazard.createFireball(this);
    }
    
    // Add to the hazards array
    this.hazards.push(hazard);
    
    console.log(`Spawned ${hazardType} hazard`);
    
    // Schedule next hazard spawn
    const nextSpawnTime = 6000 + Math.random() * 6000; // 6-12 seconds
    this.hazardSpawnTimer = this.time.addEvent({
      delay: nextSpawnTime,
      callback: this.spawnRandomHazard,
      callbackScope: this,
      loop: false
    });
  }
  
  // Handle collision between gladiator and power-up
  private handlePowerUpCollision(gladiator: any, powerUp: any): void {
    // Make sure both objects are valid
    if (!gladiator.active || !powerUp.active) return;
    
    // Cast to correct types
    const typedGladiator = gladiator as Gladiator;
    const typedPowerUp = powerUp as PowerUp;
    
    // Apply power-up effect to the gladiator
    typedPowerUp.applyEffect(typedGladiator);
    
    // Track power-ups collected stat
    this.currentMatchPowerUpsCollected++;
    
    // Remove power-up from array (it's already destroyed in applyEffect)
    this.powerUps = this.powerUps.filter(p => p !== typedPowerUp);
  }
  
  // Handle collision between gladiator and hazard
  private handleHazardCollision(gladiator: any, hazard: any): void {
    // Make sure both objects are valid
    if (!gladiator.active || !hazard.active) return;
    
    // Cast to correct types
    const typedGladiator = gladiator as Gladiator;
    const typedHazard = hazard as ArenaHazard;
    
    // Apply hazard effect to the gladiator
    typedHazard.applyEffect(typedGladiator);
    
    // Track hazards triggered stat
    this.currentMatchHazardsTriggered++;
  }

  // Handle prediction events from UI scene
  private handlePrediction(prediction: { walletAddress: string; gladiatorId: number; amount: number }): void {
    console.log('Prediction received:', prediction);
    
    // Add prediction to the list
    this.predictions.push(prediction);
    
    // Optionally, show some visual feedback like a banner or effect on the predicted gladiator
    const predictedGladiator = this.gladiators.find(g => g.id === prediction.gladiatorId);
    if (predictedGladiator) {
      // Add a golden glow effect to the predicted gladiator
      const glow = this.add.graphics();
      glow.lineStyle(4, 0xFFD700, 0.5);
      glow.strokeCircle(predictedGladiator.x, predictedGladiator.y, 40);
      
      // Animate the glow
      this.tweens.add({
        targets: glow,
        alpha: { from: 0.8, to: 0.2 },
        duration: 1000,
        yoyo: true,
        repeat: 2,
        onComplete: () => {
          glow.destroy();
        }
      });
      
      // Show prediction amount
      const predictionText = this.add.text(
        predictedGladiator.x,
        predictedGladiator.y - 60,
        `Prediction: ${prediction.amount} $GLAD`,
        {
          fontFamily: 'Arial',
          fontSize: '14px',
          color: '#FFD700',
          stroke: '#000000',
          strokeThickness: 3
        }
      ).setOrigin(0.5);
      
      // Fade out the text
      this.tweens.add({
        targets: predictionText,
        alpha: { from: 1, to: 0 },
        y: predictionText.y - 20,
        duration: 2000,
        ease: 'Power2',
        onComplete: () => {
          predictionText.destroy();
        }
      });
    }
  }

  // Create decorative elements in the arena corners
  private createCornerDecorations(): void {
    // Top-left corner decoration
    const tlCorner = this.add.graphics();
    tlCorner.fillStyle(0x3377ff, 0.3);
    tlCorner.fillCircle(50, 50, 80);
    tlCorner.lineStyle(2, 0x66aaff, 0.6);
    tlCorner.strokeCircle(50, 50, 80);
    tlCorner.strokeCircle(50, 50, 65);
    tlCorner.strokeCircle(50, 50, 50);
    
    // Top-right corner decoration
    const trCorner = this.add.graphics();
    trCorner.fillStyle(0xff7733, 0.3);
    trCorner.fillCircle(GAME_WIDTH - 50, 50, 80);
    trCorner.lineStyle(2, 0xffaa66, 0.6);
    trCorner.strokeCircle(GAME_WIDTH - 50, 50, 80);
    trCorner.strokeCircle(GAME_WIDTH - 50, 50, 65);
    trCorner.strokeCircle(GAME_WIDTH - 50, 50, 50);
    
    // Bottom-left corner decoration
    const blCorner = this.add.graphics();
    blCorner.fillStyle(0x33ff77, 0.3);
    blCorner.fillCircle(50, GAME_HEIGHT - 50, 80);
    blCorner.lineStyle(2, 0x66ffaa, 0.6);
    blCorner.strokeCircle(50, GAME_HEIGHT - 50, 80);
    blCorner.strokeCircle(50, GAME_HEIGHT - 50, 65);
    blCorner.strokeCircle(50, GAME_HEIGHT - 50, 50);
    
    // Bottom-right corner decoration
    const brCorner = this.add.graphics();
    brCorner.fillStyle(0xff33aa, 0.3);
    brCorner.fillCircle(GAME_WIDTH - 50, GAME_HEIGHT - 50, 80);
    brCorner.lineStyle(2, 0xff66cc, 0.6);
    brCorner.strokeCircle(GAME_WIDTH - 50, GAME_HEIGHT - 50, 80);
    brCorner.strokeCircle(GAME_WIDTH - 50, GAME_HEIGHT - 50, 65);
    brCorner.strokeCircle(GAME_WIDTH - 50, GAME_HEIGHT - 50, 50);
  }
  
  // Create special center marker for the arena
  private createCenterArenaMarker(): void {
    const centerX = GAME_WIDTH / 2;
    const centerY = GAME_HEIGHT / 2;
    
    // Create center marker
    const centerMarker = this.add.graphics();
    
    // Outer circle
    centerMarker.lineStyle(2, 0xff9900, 0.6);
    centerMarker.strokeCircle(centerX, centerY, 100);
    
    // Inner circles
    centerMarker.lineStyle(1, 0xffaa00, 0.5);
    centerMarker.strokeCircle(centerX, centerY, 80);
    centerMarker.strokeCircle(centerX, centerY, 60);
    
    // Center dot
    centerMarker.fillStyle(0xffaa00, 0.4);
    centerMarker.fillCircle(centerX, centerY, 10);
    
    // Cross lines through center
    centerMarker.lineStyle(1, 0xffaa00, 0.4);
    // Horizontal line
    centerMarker.beginPath();
    centerMarker.moveTo(centerX - 120, centerY);
    centerMarker.lineTo(centerX + 120, centerY);
    centerMarker.strokePath();
    
    // Vertical line
    centerMarker.beginPath();
    centerMarker.moveTo(centerX, centerY - 120);
    centerMarker.lineTo(centerX, centerY + 120);
    centerMarker.strokePath();
    
    // Diagonal lines
    centerMarker.lineStyle(1, 0xffaa00, 0.3);
    // Diagonal line 1
    centerMarker.beginPath();
    centerMarker.moveTo(centerX - 85, centerY - 85);
    centerMarker.lineTo(centerX + 85, centerY + 85);
    centerMarker.strokePath();
    
    // Diagonal line 2
    centerMarker.beginPath();
    centerMarker.moveTo(centerX + 85, centerY - 85);
    centerMarker.lineTo(centerX - 85, centerY + 85);
    centerMarker.strokePath();
    
    // Create pulsing animation for the center
    this.tweens.add({
      targets: centerMarker,
      alpha: { from: 0.8, to: 0.4 },
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }
  
  // Create energy field particles around the arena border
  private createEnergyFieldEffect(): void {
    // Instead of using emitters, create individual particle effects at fixed intervals
    
    // Create a timer to spawn particles along the border at regular intervals
    this.time.addEvent({
      delay: 300,
      callback: () => {
        this.createBorderParticle();
      },
      callbackScope: this,
      loop: true
    });
  }
  
  // Create individual border particles
  private createBorderParticle(): void {
    // Randomly select which border to create the particle on
    const border = Math.floor(Math.random() * 4); // 0-3 (top, right, bottom, left)
    
    let x = 0;
    let y = 0;
    let vx = 0;
    let vy = 0;
    
    // Position and velocity based on selected border
    switch (border) {
      case 0: // Top
        x = Phaser.Math.Between(20, GAME_WIDTH - 20);
        y = 10;
        vx = Phaser.Math.Between(-20, 20);
        vy = Phaser.Math.Between(5, 15);
        break;
      case 1: // Right
        x = GAME_WIDTH - 10;
        y = Phaser.Math.Between(20, GAME_HEIGHT - 20);
        vx = Phaser.Math.Between(-15, -5);
        vy = Phaser.Math.Between(-20, 20);
        break;
      case 2: // Bottom
        x = Phaser.Math.Between(20, GAME_WIDTH - 20);
        y = GAME_HEIGHT - 10;
        vx = Phaser.Math.Between(-20, 20);
        vy = Phaser.Math.Between(-15, -5);
        break;
      case 3: // Left
        x = 10;
        y = Phaser.Math.Between(20, GAME_HEIGHT - 20);
        vx = Phaser.Math.Between(5, 15);
        vy = Phaser.Math.Between(-20, 20);
        break;
    }
    
    // Create the particle
    const particle = this.add.image(x, y, 'particle')
      .setScale(0.2)
      .setAlpha(0.6)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setTint(0x66ffff);
    
    // Animate the particle
    this.tweens.add({
      targets: particle,
      x: x + vx * 10,
      y: y + vy * 10,
      scale: 0,
      alpha: 0,
      duration: 2000,
      ease: 'Linear',
      onComplete: () => {
        particle.destroy();
      }
    });
  }
} 