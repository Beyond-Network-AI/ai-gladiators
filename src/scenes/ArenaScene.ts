import Phaser from 'phaser';
import { COLORS, GAME_WIDTH, GAME_HEIGHT, GLADIATOR_SPRITES, FALLBACK_SPRITE } from '../utils/constants';
import { Gladiator } from '../objects/Gladiator';
import { PowerUp } from '../objects/PowerUp';
import { ArenaHazard } from '../objects/ArenaHazard';
import { PowerUpType } from '../types/PowerUpType';
import { HazardDirection } from '../types/HazardType';
import { DEFAULT_GAME_SETTINGS } from '../types/GameConfig';

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
  private matchTimer: number = 60; // 60 seconds match duration
  private matchTimerText: Phaser.GameObjects.Text | null = null;
  
  // Sprite selection for this round
  private currentRoundSprites: string[] = [];
  
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
    
    // Select random sprites for this round
    this.selectRandomSpritesForRound();
    
    // Set arena background
    this.cameras.main.setBackgroundColor(COLORS.background);
    
    // Create arena title
    this.add.text(
      GAME_WIDTH / 2, 
      30, 
      'AI Gladiators Arena', 
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
    
    // Create match timer text
    this.matchTimerText = this.add.text(
      GAME_WIDTH / 2,
      70,
      `Time: ${this.matchTimer}`,
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
    
    console.log('ArenaScene created successfully!');
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
    this.matchTimer = 60;
    
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
    // Spawn gladiators in each zone
    for (let i = 0; i < this.gladiatorCount; i++) {
      // Get spawn zone (wrap around if more gladiators than zones)
      const zoneIndex = i % this.spawnZones.length;
      const zone = this.spawnZones[zoneIndex];
      
      // Calculate random position within zone
      const x = zone.x + Math.random() * zone.width;
      const y = zone.y + Math.random() * zone.height;
      
      // Get texture key for this gladiator
      const gladiatorSprite = this.currentRoundSprites[i];
      
      // Create gladiator with selected sprite
      const gladiator = new Gladiator(this, x, y, gladiatorSprite);
      
      // Add to array for tracking
      this.gladiators.push(gladiator);
      
      // Create gladiator label (only in debug mode)
      if (this.debugMode) {
        this.add.text(
          gladiator.x,
          gladiator.y - 55,
          `Gladiator ${i + 1}`,
          {
            fontFamily: 'Arial',
            fontSize: '14px',
            color: COLORS.primaryText,
            backgroundColor: '#00000080',
            padding: { x: 4, y: 2 }
          }
        ).setOrigin(0.5, 0.5)
         .setDepth(1);
      }
    }
    
    console.log(`${this.gladiators.length} gladiators spawned with unique sprites!`);
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
      this.matchTimerText.setText(`Time: ${this.matchTimer}`);
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
    if (activeGladiators.length <= 1) {
      if (activeGladiators.length === 1) {
        console.log(`Gladiator is the winner!`);
        const winner = activeGladiators[0];
        
        // Create a clean game over overlay
        this.createGameOverScreen(winner);
      } else {
        console.log('No gladiators left - draw!');
        
        // Create a clean game over overlay for a draw
        this.createGameOverScreen(null);
      }
      
      this.endMatch();
    }
  }
  
  // Create a clean, attractive game over screen
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
    
    // We're also adding some code to display stats about power-ups and hazards
    let powerUpText = '';
    if (this.powerUps.length > 0) {
      powerUpText = `Power-ups still active: ${this.powerUps.length}`;
    } else {
      powerUpText = 'All power-ups collected';
    }
    
    this.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT - 160,
      powerUpText,
      {
        fontFamily: 'Arial',
        fontSize: '16px',
        color: COLORS.secondaryText
      }
    ).setOrigin(0.5, 0.5);
    
    let hazardText = '';
    if (this.hazards.length > 0) {
      hazardText = `Hazards still active: ${this.hazards.length}`;
    } else {
      hazardText = 'No hazards remaining';
    }
    
    this.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT - 130,
      hazardText,
      {
        fontFamily: 'Arial',
        fontSize: '16px',
        color: COLORS.secondaryText
      }
    ).setOrigin(0.5, 0.5);
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
    let countdown = 3;
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
    
    // Animate countdown
    const countdownEvent = this.time.addEvent({
      delay: 1000,
      callback: () => {
        countdown--;
        if (countdown >= 0) {
          countdownText.setText(countdown.toString());
          // Pulse animation for countdown
          this.tweens.add({
            targets: countdownText,
            scale: 1.5,
            duration: 300,
            yoyo: true
          });
        }
      },
      callbackScope: this,
      repeat: 2
    });
    
    // Single hard restart after a fixed delay instead of cascading timers
    this.time.delayedCall(3500, () => {
      console.log('Restarting scene now...');
      
      // Clean up scene properly before restarting
      this.sceneCleanup();
      
      // Force a complete restart using a full scene transition
      this.scene.stop('ArenaScene');
      this.scene.start('ArenaScene');
    });
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
  }
} 