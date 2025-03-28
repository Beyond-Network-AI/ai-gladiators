import Phaser from 'phaser';
import { COLORS, GAME_WIDTH, GAME_HEIGHT } from '../utils/constants';
import { Gladiator } from '../objects/Gladiator';
import { DEFAULT_GAME_SETTINGS } from '../types/GameConfig';

export class ArenaScene extends Phaser.Scene {
  // Spawn zones for gladiators
  private spawnZones: Phaser.Geom.Rectangle[];
  
  // Gladiator management
  private gladiators: Gladiator[];
  private gladiatorCount: number = 4; // Number of gladiators to spawn
  
  // Debug settings
  private debugMode: boolean;
  
  // Match timer
  private matchTimer: number = 60; // 60 seconds match duration
  private matchTimerText: Phaser.GameObjects.Text | null = null;
  
  constructor() {
    super({ key: 'ArenaScene' });
    this.spawnZones = [];
    this.gladiators = [];
    this.debugMode = DEFAULT_GAME_SETTINGS.debugMode;
  }

  preload(): void {
    // Load gladiator placeholder sprite
    this.load.image('gladiator', 'https://labs.phaser.io/assets/sprites/mushroom2.png');
  }

  create(): void {
    // Reset match state
    this.data.set('matchEnding', false);
    
    // Clear any existing objects in case of incomplete cleanup
    this.cleanupScene();
    
    // Reset arrays
    this.spawnZones = [];
    this.gladiators = [];
    
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
    
    // Set up collision between gladiators
    this.physics.add.collider(
      this.gladiators,
      this.gladiators,
      this.handleGladiatorCollision,
      undefined,
      this
    );
    
    // Enable world bounds collision feedback to prevent sticking to edges
    this.physics.world.setBoundsCollision(true, true, true, true);
    
    console.log('ArenaScene created successfully!');
  }

  // Clean up scene elements to prevent memory leaks
  private cleanupScene(): void {
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
    
    // Stop all timers to prevent duplicate events
    this.time.removeAllEvents();
    
    // Clean up any remaining game objects
    this.children.each(child => {
      if (child instanceof Phaser.GameObjects.Text || 
          child instanceof Phaser.GameObjects.Graphics) {
        child.destroy();
      }
    });
  }

  update(): void {
    // Update each gladiator
    for (const gladiator of this.gladiators) {
      if (gladiator.active) {
        gladiator.update();
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
  
  private spawnGladiators(): void {
    // Spawn gladiators in each zone
    for (let i = 0; i < this.gladiatorCount; i++) {
      // Get spawn zone (wrap around if more gladiators than zones)
      const zoneIndex = i % this.spawnZones.length;
      const zone = this.spawnZones[zoneIndex];
      
      // Calculate random position within zone
      const x = zone.x + Math.random() * zone.width;
      const y = zone.y + Math.random() * zone.height;
      
      // Create gladiator
      const gladiator = new Gladiator(this, x, y, 'gladiator');
      
      // Add to array for tracking
      this.gladiators.push(gladiator);
      
      // Create gladiator label
      this.add.text(
        gladiator.x,
        gladiator.y - 55,
        `Gladiator ${i + 1}`,
        {
          fontFamily: 'Arial',
          fontSize: '14px',
          color: COLORS.primaryText
        }
      ).setOrigin(0.5, 0.5)
       .setDepth(1);
    }
    
    console.log(`${this.gladiators.length} gladiators spawned!`);
  }
  
  private updateGladiatorTargets(): void {
    // For each active gladiator, find closest target
    for (const gladiator of this.gladiators) {
      if (!gladiator.active) continue;
      
      // Find closest gladiator
      let closestDistance = Number.MAX_VALUE;
      let closestGladiator: Gladiator | null = null;
      
      for (const target of this.gladiators) {
        // Skip self or inactive targets
        if (target === gladiator || !target.active) continue;
        
        // Calculate distance
        const distance = Phaser.Math.Distance.Between(
          gladiator.x, gladiator.y,
          target.x, target.y
        );
        
        // Update closest if this one is closer
        if (distance < closestDistance) {
          closestDistance = distance;
          closestGladiator = target;
        }
      }
      
      // Set target (may be null if no active targets)
      gladiator.setTarget(closestGladiator);
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
        
        // Create winner text effect
        this.add.text(
          GAME_WIDTH / 2,
          GAME_HEIGHT / 2,
          'WINNER!',
          {
            fontFamily: 'Arial',
            fontSize: '48px',
            color: '#ffff00',
            fontStyle: 'bold'
          }
        ).setOrigin(0.5, 0.5)
         .setDepth(10);
         
        // Create a visual highlight around the winner
        const winnerGlow = this.add.graphics();
        winnerGlow.fillStyle(0xffff00, 0.3);
        winnerGlow.fillCircle(winner.x, winner.y, 50);
        winnerGlow.lineStyle(3, 0xffff00, 1);
        winnerGlow.strokeCircle(winner.x, winner.y, 55);
      } else {
        console.log('No gladiators left - draw!');
        
        // Create draw text
        this.add.text(
          GAME_WIDTH / 2,
          GAME_HEIGHT / 2,
          'DRAW!',
          {
            fontFamily: 'Arial',
            fontSize: '48px',
            color: '#ffffff',
            fontStyle: 'bold'
          }
        ).setOrigin(0.5, 0.5)
         .setDepth(10);
      }
      
      this.endMatch();
    }
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
      GAME_HEIGHT - 50,
      'New Match Starting...',
      {
        fontFamily: 'Arial',
        fontSize: '18px',
        color: COLORS.primaryText
      }
    ).setOrigin(0.5, 0.5);
    
    // Countdown effect
    let countdown = 3;
    const countdownText = this.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT - 20,
      countdown.toString(),
      {
        fontFamily: 'Arial',
        fontSize: '24px',
        color: COLORS.highlight
      }
    ).setOrigin(0.5, 0.5);
    
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
} 