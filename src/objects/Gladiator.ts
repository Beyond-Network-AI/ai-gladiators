import Phaser from 'phaser';
import { IGladiatorStats } from '../types/IGladiatorStats';
import { GLADIATOR_STAT_RANGES } from '../utils/constants';

// Define Gladiator states for the Finite State Machine
export enum GladiatorState {
  IDLE = 'idle',
  SEEK = 'seek',
  ATTACK = 'attack',
  EVADE = 'evade',
  COLLECT_POWERUP = 'collectPowerUp'
}

export class Gladiator extends Phaser.Physics.Arcade.Sprite {
  // Stats
  public stats: IGladiatorStats;
  
  // Unique identifier
  public id: number = 0;
  
  // FSM state
  private currentState: GladiatorState;
  
  // Target tracking
  private target: Gladiator | null = null;
  private powerUpTarget: any | null = null;
  
  // Attack cooldown tracking
  private lastAttackTime: number = 0;
  private attackCooldown: number = 1000; // 1 second in ms
  
  // Debug text for state display
  private stateText: Phaser.GameObjects.Text | null = null;
  private healthBar: Phaser.GameObjects.Graphics | null = null;
  
  constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
    // Use fallback texture if the specified one isn't available
    const availableTexture = scene.textures.exists(texture) ? texture : 'gladiator_fallback';
    
    super(scene, x, y, availableTexture);
    
    // Add to scene and enable physics
    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    // Set physics properties
    this.setCollideWorldBounds(true);
    this.setBounce(0.2);
    
    // Generate random stats
    this.stats = this.generateRandomStats();
    
    // Set initial state
    this.currentState = GladiatorState.IDLE;
    
    // Set health based on stats
    this.stats.maxHealth = Math.floor(100 + this.stats.defense * 20);
    this.stats.health = this.stats.maxHealth;
    
    // Set scale to make gladiator more visible
    this.setScale(1.0);
    
    // Add debug outline to see sprite boundaries
    // @ts-ignore - accessing property
    const debugMode = scene.debugMode || false;
    if (debugMode) {
      this.scene.add.rectangle(this.x, this.y, this.width, this.height)
        .setStrokeStyle(2, 0xff0000)
        .setOrigin(0.5, 0.5)
        .setDepth(0);
    }
    
    // Create debug text for state (only show in debug mode)
    if (debugMode) {
      this.stateText = this.scene.add.text(
        this.x, 
        this.y - 40, 
        this.currentState, 
        { 
          fontSize: '12px', 
          color: '#ffffff',
          backgroundColor: '#000000',
          padding: { x: 2, y: 2 }  
        }
      );
    } else {
      this.stateText = null;
    }
    
    // Create health bar
    this.createHealthBar();
    
    console.log(`Gladiator created with texture: ${availableTexture}`);
  }
  
  // Generate random stats based on predefined ranges
  private generateRandomStats(): IGladiatorStats {
    const randomInRange = (min: number, max: number) => 
      Math.random() * (max - min) + min;
    
    return {
      strength: randomInRange(GLADIATOR_STAT_RANGES.strength.min, GLADIATOR_STAT_RANGES.strength.max),
      speed: randomInRange(GLADIATOR_STAT_RANGES.speed.min, GLADIATOR_STAT_RANGES.speed.max),
      defense: randomInRange(GLADIATOR_STAT_RANGES.defense.min, GLADIATOR_STAT_RANGES.defense.max),
      intelligence: randomInRange(GLADIATOR_STAT_RANGES.intelligence.min, GLADIATOR_STAT_RANGES.intelligence.max),
      aggression: randomInRange(GLADIATOR_STAT_RANGES.aggression.min, GLADIATOR_STAT_RANGES.aggression.max),
      luck: randomInRange(GLADIATOR_STAT_RANGES.luck.min, GLADIATOR_STAT_RANGES.luck.max)
    };
  }
  
  // Create health bar
  private createHealthBar(): void {
    this.healthBar = this.scene.add.graphics();
    this.updateHealthBar();
  }
  
  // Update health bar position and fill
  private updateHealthBar(): void {
    if (!this.healthBar) return;
    
    this.healthBar.clear();
    
    // Draw a black outline for better visibility
    this.healthBar.fillStyle(0x000000);
    this.healthBar.fillRect(this.x - 27, this.y - 32, 54, 14);
    
    // Background bar (red)
    this.healthBar.fillStyle(0xff0000);
    this.healthBar.fillRect(this.x - 25, this.y - 30, 50, 10);
    
    // Health bar (green) based on current health percentage
    const healthPercent = Math.max(0, this.stats.health! / this.stats.maxHealth!);
    this.healthBar.fillStyle(0x00ff00);
    this.healthBar.fillRect(this.x - 25, this.y - 30, 50 * healthPercent, 10);
  }
  
  // Update FSM state based on conditions
  private updateState(): void {
    const prevState = this.currentState;
    
    // Check if health is low, prioritize evading
    if (this.stats.health! < this.stats.maxHealth! * 0.3) {
      this.currentState = GladiatorState.EVADE;
      return;
    }
    
    // Check if power-up is nearby and decide whether to collect it based on intelligence
    if (this.powerUpTarget && Math.random() < this.stats.intelligence / 3) {
      this.currentState = GladiatorState.COLLECT_POWERUP;
      return;
    }
    
    // Check if there's a target to attack based on aggression
    if (this.target && Math.random() < this.stats.aggression) {
      // If target is within attack range, attack
      const distanceToTarget = Phaser.Math.Distance.Between(
        this.x, this.y, this.target.x, this.target.y
      );
      
      // Increased attack range to better detect when gladiators are close
      if (distanceToTarget < 120) {
        this.currentState = GladiatorState.ATTACK;
      } else {
        this.currentState = GladiatorState.SEEK;
      }
      return;
    }
    
    // Add randomization to break stuck states - occasionally switch to idle
    if (this.currentState === GladiatorState.SEEK && Math.random() < 0.05) {
      this.currentState = GladiatorState.IDLE;
      return;
    }
    
    // Random chance to become aggressive
    if (Math.random() < 0.02 && this.target) {
      this.currentState = GladiatorState.SEEK;
      return;
    }
    
    // Default to idle if no other conditions are met
    this.currentState = GladiatorState.IDLE;
    
    // Log state change if it happened
    if (prevState !== this.currentState) {
      console.log(`Gladiator state changed from ${prevState} to ${this.currentState}`);
    }
  }
  
  // FSM behaviors
  private executeBehavior(): void {
    switch (this.currentState) {
      case GladiatorState.IDLE:
        this.executeIdleBehavior();
        break;
      case GladiatorState.SEEK:
        this.executeSeekBehavior();
        break;
      case GladiatorState.ATTACK:
        this.executeAttackBehavior();
        break;
      case GladiatorState.EVADE:
        this.executeEvadeBehavior();
        break;
      case GladiatorState.COLLECT_POWERUP:
        this.executeCollectPowerUpBehavior();
        break;
    }
  }
  
  private executeIdleBehavior(): void {
    // Random movement with lower speed
    if (Math.random() < 0.05) {
      const angle = Math.random() * Math.PI * 2;
      const speed = this.stats.speed * 0.3;
      this.setVelocity(
        Math.cos(angle) * speed,
        Math.sin(angle) * speed
      );
    }
  }
  
  private executeSeekBehavior(): void {
    if (!this.target) return;
    
    // Move towards target
    const angle = Phaser.Math.Angle.Between(
      this.x, this.y, this.target.x, this.target.y
    );
    
    const speed = this.stats.speed;
    this.setVelocity(
      Math.cos(angle) * speed,
      Math.sin(angle) * speed
    );
  }
  
  private executeAttackBehavior(): void {
    if (!this.target) return;
    
    // When attacking, stop moving toward target
    this.setVelocity(0, 0);
    
    const currentTime = this.scene.time.now;
    if (currentTime - this.lastAttackTime >= this.attackCooldown) {
      // Perform attack
      this.attack(this.target);
      this.lastAttackTime = currentTime;
      
      // After attack, add a small random movement to break potential deadlocks
      this.scene.time.delayedCall(200, () => {
        if (this.active && this.currentState === GladiatorState.ATTACK) {
          const angle = Math.random() * Math.PI * 2;
          const speed = this.stats.speed * 0.4;
          this.setVelocity(
            Math.cos(angle) * speed,
            Math.sin(angle) * speed
          );
        }
      });
    }
  }
  
  private executeEvadeBehavior(): void {
    if (!this.target) return;
    
    // Get angle away from target
    const angleFromTarget = Phaser.Math.Angle.Between(
      this.x, this.y, this.target.x, this.target.y
    );
    
    // Calculate multiple potential evasion points in different directions
    const evadeOptions = [];
    const evadeDistance = this.stats.speed * 1.5; // Distance to check for evasion
    
    // Check 8 directions around the gladiator
    for (let i = 0; i < 8; i++) {
      const evadeAngle = angleFromTarget + Math.PI + (i * Math.PI / 4);
      const evadeX = this.x + Math.cos(evadeAngle) * evadeDistance;
      const evadeY = this.y + Math.sin(evadeAngle) * evadeDistance;
      
      // Ensure the position is within world bounds
      const withinBounds = 
        evadeX > 50 && 
        evadeX < this.scene.physics.world.bounds.width - 50 && 
        evadeY > 50 && 
        evadeY < this.scene.physics.world.bounds.height - 50;
      
      if (withinBounds) {
        // Calculate distance to all other gladiators from this evade point
        let minDistance = Number.MAX_VALUE;
        
        // @ts-ignore - accessing private property
        const allGladiators = (this.scene as any).gladiators || [];
        
        for (const otherGladiator of allGladiators) {
          if (otherGladiator !== this && otherGladiator.active) {
            const distance = Phaser.Math.Distance.Between(
              evadeX, evadeY, otherGladiator.x, otherGladiator.y
            );
            minDistance = Math.min(minDistance, distance);
          }
        }
        
        // Add to options with safety score (higher is better)
        evadeOptions.push({
          x: evadeX,
          y: evadeY,
          score: minDistance
        });
      }
    }
    
    // Choose the safest option (farthest from other gladiators)
    if (evadeOptions.length > 0) {
      // Sort by score (highest first)
      evadeOptions.sort((a, b) => b.score - a.score);
      
      // Get the best option
      const bestOption = evadeOptions[0];
      
      // Move towards the best evade position
      const evadeAngle = Phaser.Math.Angle.Between(
        this.x, this.y, bestOption.x, bestOption.y
      );
      
      const speed = this.stats.speed * 1.2; // Faster when evading
      this.setVelocity(
        Math.cos(evadeAngle) * speed,
        Math.sin(evadeAngle) * speed
      );
      
      // Only very occasionally show "DODGE!" text (5% chance) to reduce clutter
      if (Math.random() < 0.05) {
        const dodgeText = this.scene.add.text(
          this.x, 
          this.y - 40, 
          'DODGE!', 
          { 
            fontSize: '10px', 
            color: '#ffff00',
            fontStyle: 'bold',
            backgroundColor: '#000000'
          }
        ).setOrigin(0.5, 0.5);
        
        // Remove text after a very short time
        this.scene.time.delayedCall(200, () => {
          dodgeText.destroy();
        });
      }
    } else {
      // Fallback to simple evasion if no safe spots
      const speed = this.stats.speed * 1.2; // Faster when evading
      this.setVelocity(
        -Math.cos(angleFromTarget) * speed,
        -Math.sin(angleFromTarget) * speed
      );
    }
  }
  
  private executeCollectPowerUpBehavior(): void {
    if (!this.powerUpTarget) return;
    
    // Move towards power-up
    const angle = Phaser.Math.Angle.Between(
      this.x, this.y, this.powerUpTarget.x, this.powerUpTarget.y
    );
    
    const speed = this.stats.speed;
    this.setVelocity(
      Math.cos(angle) * speed,
      Math.sin(angle) * speed
    );
  }
  
  // Attack another gladiator
  public attack(target: Gladiator): void {
    if (!target) return;
    
    // Show attack animation - flash the sprite
    this.setTint(0xff0000);
    
    // Reset tint after a short delay
    this.scene.time.delayedCall(200, () => {
      if (this.active) {
        this.clearTint();
      }
    });
    
    // Calculate damage based on strength, defense, and luck
    const baseDamage = this.stats.strength;
    const defense = target.stats.defense;
    
    // Reduced dodge chance for more reliable damage
    if (Math.random() < target.stats.luck / 2) {
      console.log('Attack dodged!');
      
      // Only show dodge text 10% of the time
      if (Math.random() < 0.1) {
        // Create a dodge text effect
        const dodgeText = this.scene.add.text(
          target.x, 
          target.y - 20, 
          'DODGE!', 
          { 
            fontSize: '12px', 
            color: '#ffff00',
            backgroundColor: '#000000' 
          }
        ).setOrigin(0.5)
          .setDepth(1);
          
        // Remove the text quickly
        this.scene.time.delayedCall(300, () => {
          dodgeText.destroy();
        });
      }
      
      return;
    }
    
    // Check for critical hit (based on attacker's luck)
    let criticalMultiplier = 1;
    if (Math.random() < this.stats.luck * 3) {  // increased crit chance
      criticalMultiplier = 2;
      console.log('Critical hit!');
      
      // Only show crit text 20% of the time
      if (Math.random() < 0.2) {
        // Create a critical hit text effect
        const critText = this.scene.add.text(
          target.x, 
          target.y - 20, 
          'CRIT!', 
          { 
            fontSize: '12px', 
            color: '#ff0000',
            backgroundColor: '#000000'
          }
        ).setOrigin(0.5)
          .setDepth(1);
          
        // Remove text quickly
        this.scene.time.delayedCall(300, () => {
          critText.destroy();
        });
      }
    }
    
    // Calculate final damage - Higher minimum damage for faster fights
    const damage = Math.max(10, Math.floor((baseDamage - defense / 2) * criticalMultiplier));
    
    // Apply damage to target
    target.takeDamage(damage);
    
    // Only show damage text 30% of the time
    if (Math.random() < 0.3) {
      // Create a damage text effect
      const damageText = this.scene.add.text(
        target.x, 
        target.y - 30, 
        `-${damage}`, 
        { 
          fontSize: '12px', 
          color: '#ff0000',
          backgroundColor: '#000000'
        }
      ).setOrigin(0.5)
        .setDepth(1);
      
      // Remove text quickly
      this.scene.time.delayedCall(400, () => {
        if (damageText && damageText.active) {
          damageText.destroy();
        }
      });
    }
  }
  
  // Take damage and check for knockout
  public takeDamage(amount: number): void {
    // Calculate damage reduction based on defense
    // Higher defense means more damage reduction (up to 80% reduction with defense of 10)
    const damageReduction = Math.min(0.8, this.stats.defense / 12);
    const reducedDamage = amount * (1 - damageReduction);
    
    // Apply damage
    this.stats.health! -= reducedDamage;
    
    // Log damage reduction in debug mode
    // @ts-ignore - accessing property that may not be directly on the Scene type
    if (this.scene.debugMode) {
      console.log(`Gladiator took ${reducedDamage.toFixed(1)} damage (reduced from ${amount} by ${(damageReduction * 100).toFixed(1)}%)`);
    }
    
    // Update health bar
    this.updateHealthBar();
    
    // Check for knockout
    if (this.stats.health! <= 0) {
      this.knockout();
    }
  }
  
  // Proper cleanup method to ensure all resources are freed
  public cleanup(): void {
    // Remove all associated scene objects
    if (this.healthBar) {
      this.healthBar.destroy();
      this.healthBar = null;
    }
    
    if (this.stateText) {
      this.stateText.destroy();
      this.stateText = null;
    }
    
    // Clear references
    this.target = null;
    this.powerUpTarget = null;
    
    // Destroy the sprite itself
    this.destroy();
  }
  
  // Knockout effect and removal
  public knockout(): void {
    console.log('Gladiator knocked out!');
    
    // Only show KO text 50% of the time to reduce clutter
    if (Math.random() < 0.5) {
      // Create a knockout text effect
      const koText = this.scene.add.text(
        this.x, 
        this.y, 
        'K.O.!', 
        { 
          fontSize: '18px', 
          color: '#ff0000', 
          fontStyle: 'bold',
          backgroundColor: '#000000'
        }
      ).setOrigin(0.5)
        .setDepth(2);
        
      // Remove the KO text quickly
      this.scene.time.delayedCall(600, () => {
        koText.destroy();
      });
    }
    
    // Show a flash of red, then fade out
    this.setTint(0xff0000);
    
    // Add comedic death animation - dramatic spinning and shrinking
    this.scene.tweens.add({
      targets: this,
      angle: 720, // Double spin (720 degrees)
      scale: 0.1, // Shrink to tiny size
      alpha: 0,   // Fade out completely
      y: this.y - 30, // Float up slightly
      duration: 1000,
      ease: 'Cubic.easeOut'
    });
    
    // Add some "stars" circling around the knocked out gladiator
    const starCount = 5;
    const stars = [];
    
    for (let i = 0; i < starCount; i++) {
      const star = this.scene.add.text(
        this.x, 
        this.y, 
        '★', 
        { 
          fontSize: '24px', 
          color: '#ffff00',
          stroke: '#000000',
          strokeThickness: 3
        }
      ).setOrigin(0.5)
        .setDepth(2);
      
      stars.push(star);
      
      // Create orbital animation for each star
      const angle = (i / starCount) * Math.PI * 2;
      const radius = 30;
      const duration = 1000;
      
      this.scene.tweens.add({
        targets: star,
        x: this.x + Math.cos(angle) * radius,
        y: this.y + Math.sin(angle) * radius - 30, // Rise up with gladiator
        alpha: 0,
        scale: 0.2,
        duration: duration,
        onComplete: () => {
          star.destroy();
        }
      });
    }
    
    // Disable physics and make inactive
    this.setActive(false);
    this.setVisible(false);
    if (this.body) {
      this.disableBody();
    }
    
    // Remove health bar and state text
    if (this.healthBar) {
      this.healthBar.destroy();
      this.healthBar = null;
    }
    
    if (this.stateText) {
      this.stateText.destroy();
      this.stateText = null;
    }
    
    // Remove from scene after animation completes
    this.scene.time.delayedCall(1000, () => {
      this.destroy();
    });
  }
  
  // Set target to another gladiator
  public setTarget(gladiator: Gladiator | null): void {
    this.target = gladiator;
  }
  
  // Set power-up target
  public setPowerUpTarget(powerUp: any | null): void {
    this.powerUpTarget = powerUp;
  }
  
  // Main update method called by scene
  update(): void {
    // Update state text position
    if (this.stateText) {
      this.stateText.setPosition(this.x, this.y - 40);
      this.stateText.setText(this.currentState);
    }
    
    // Update health bar position
    this.updateHealthBar();
    
    // Update state based on conditions
    this.updateState();
    
    // Execute behavior based on state
    this.executeBehavior();
  }
  
  // Add getStats method to return the gladiator's stats
  public getStats(): IGladiatorStats {
    // Ensure stats exist
    if (!this.stats) {
      console.error('Stats object is undefined - regenerating');
      this.stats = this.generateRandomStats();
      this.stats.maxHealth = Math.floor(100 + this.stats.defense * 20);
      this.stats.health = this.stats.maxHealth;
    }

    // Make sure to include all stats with default values if missing
    const formattedStats = { 
      strength: this.stats.strength || 0,
      speed: this.stats.speed || 0,
      defense: this.stats.defense || 0,
      intelligence: this.stats.intelligence || 0,
      aggression: this.stats.aggression || 0,
      luck: this.stats.luck || 0,
      health: this.stats.health || 0,
      maxHealth: this.stats.maxHealth || 100
    };

    // Log formatted stats for debugging
    console.log(`Gladiator #${this.id} stats:`, formattedStats);

    return formattedStats;
  }
  
  // Add getter for health that properly accesses the stats.health value
  public get health(): number {
    return this.stats.health || 0;
  }
} 