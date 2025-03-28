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
    super(scene, x, y, texture);
    
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
    
    // Create debug text for state
    this.stateText = this.scene.add.text(
      this.x, 
      this.y - 40, 
      this.currentState, 
      { fontSize: '12px', color: '#ffffff' }
    );
    
    // Create health bar
    this.createHealthBar();
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
    
    // Background bar (red)
    this.healthBar.fillStyle(0xff0000);
    this.healthBar.fillRect(this.x - 20, this.y - 25, 40, 5);
    
    // Health bar (green) based on current health percentage
    const healthPercent = (this.stats.health! / this.stats.maxHealth!);
    this.healthBar.fillStyle(0x00ff00);
    this.healthBar.fillRect(this.x - 20, this.y - 25, 40 * healthPercent, 5);
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
    
    // Move away from target
    const angle = Phaser.Math.Angle.Between(
      this.x, this.y, this.target.x, this.target.y
    );
    
    // Reverse angle (move away) and use speed
    const speed = this.stats.speed * 1.2; // Faster when evading
    this.setVelocity(
      -Math.cos(angle) * speed,
      -Math.sin(angle) * speed
    );
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
    
    // Calculate damage based on strength, defense, and luck
    const baseDamage = this.stats.strength;
    const defense = target.stats.defense;
    
    // Reduced dodge chance for more reliable damage
    if (Math.random() < target.stats.luck / 2) {
      console.log('Attack dodged!');
      
      // Create a dodge text effect
      this.scene.add.text(
        target.x, 
        target.y - 20, 
        'DODGE!', 
        { fontSize: '16px', color: '#ffff00' }
      ).setOrigin(0.5)
        .setDepth(1)
        .setAlpha(1)
        .setBlendMode(Phaser.BlendModes.ADD);
      
      return;
    }
    
    // Check for critical hit (based on attacker's luck)
    let criticalMultiplier = 1;
    if (Math.random() < this.stats.luck * 3) {  // increased crit chance
      criticalMultiplier = 2;
      console.log('Critical hit!');
      
      // Create a critical hit text effect
      this.scene.add.text(
        target.x, 
        target.y - 20, 
        'CRIT!', 
        { fontSize: '16px', color: '#ff0000' }
      ).setOrigin(0.5)
        .setDepth(1)
        .setAlpha(1)
        .setBlendMode(Phaser.BlendModes.ADD);
    }
    
    // Calculate final damage - Higher minimum damage for faster fights
    const damage = Math.max(10, Math.floor((baseDamage - defense / 2) * criticalMultiplier));
    
    // Apply damage to target
    target.takeDamage(damage);
    
    // Create a damage text effect
    const damageText = this.scene.add.text(
      target.x, 
      target.y - 30, 
      `-${damage}`, 
      { fontSize: '16px', color: '#ff0000' }
    ).setOrigin(0.5)
      .setDepth(1);
    
    // Animate the damage text
    this.scene.tweens.add({
      targets: damageText,
      y: damageText.y - 30,
      alpha: 0,
      duration: 800,
      ease: 'Power2',
      onComplete: () => {
        damageText.destroy();
      }
    });
  }
  
  // Take damage and check for knockout
  public takeDamage(amount: number): void {
    this.stats.health! -= amount;
    
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
    
    // Create a knockout text effect
    this.scene.add.text(
      this.x, 
      this.y, 
      'K.O.!', 
      { fontSize: '24px', color: '#ff0000', fontStyle: 'bold' }
    ).setOrigin(0.5)
      .setDepth(2)
      .setAlpha(1);
    
    // Disable physics and fade out
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
    
    // Remove from scene after delay
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
    // Skip if knocked out
    if (!this.active) return;
    
    // Update FSM state
    this.updateState();
    
    // Execute current state behavior
    this.executeBehavior();
    
    // Update debug text
    if (this.stateText) {
      this.stateText.setPosition(this.x, this.y - 40);
      this.stateText.setText(this.currentState);
    }
    
    // Update health bar position
    this.updateHealthBar();
  }
} 