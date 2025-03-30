import Phaser from 'phaser';
import { PowerUpType, IPowerUpEffect } from '../types/PowerUpType';
import { Gladiator } from './Gladiator';

export class PowerUp extends Phaser.Physics.Arcade.Sprite {
  // Power-up type and effects
  private powerUpType: PowerUpType;
  private effect: IPowerUpEffect;
  
  // Visual elements
  private glowEffect: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
  private labelText: Phaser.GameObjects.Text | null = null;
  
  // Lifetime management
  private lifespan: number = 10000; // Default 10 seconds lifespan before disappearing
  private creationTime: number;
  
  // Animation properties
  private floatTween: Phaser.Tweens.Tween | null = null;
  
  constructor(scene: Phaser.Scene, x: number, y: number, type: PowerUpType) {
    // Set texture based on power-up type
    const texture = PowerUp.getTextureForType(type);
    
    super(scene, x, y, texture);
    
    // Add to scene and enable physics
    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    // Store creation time
    this.creationTime = scene.time.now;
    
    // Set up power-up type and effects
    this.powerUpType = type;
    this.effect = this.generateEffect(type);
    
    // Set scale and other properties
    this.setScale(0.7);
    this.setOrigin(0.5, 0.5);
    this.setCollideWorldBounds(true);
    
    // Set interactive
    this.setInteractive();
    
    // Create visual effects
    this.createVisualEffects();
    
    // Create floating animation
    this.createFloatingAnimation();
    
    // Add label text
    this.createLabel();
    
    console.log(`PowerUp of type ${type} created at position (${x}, ${y})`);
  }
  
  // Get appropriate texture based on power-up type
  private static getTextureForType(type: PowerUpType): string {
    switch (type) {
      case PowerUpType.SHIELD:
        return 'https://labs.phaser.io/assets/sprites/orb-green.png';
      case PowerUpType.TRAP:
        return 'https://labs.phaser.io/assets/sprites/orb-red.png';
      case PowerUpType.CHAOS:
        return 'https://labs.phaser.io/assets/sprites/wizball.png';
      default:
        return 'https://labs.phaser.io/assets/sprites/orb-green.png';
    }
  }
  
  // Generate effect data based on power-up type
  private generateEffect(type: PowerUpType): IPowerUpEffect {
    switch (type) {
      case PowerUpType.SHIELD:
        return {
          type: PowerUpType.SHIELD,
          duration: 8000, // 8 seconds
          multiplier: 0.5 // 50% damage reduction
        };
      case PowerUpType.TRAP:
        return {
          type: PowerUpType.TRAP,
          duration: 3000, // 3 seconds slow effect
          multiplier: 0.5 // 50% speed reduction and damage
        };
      case PowerUpType.CHAOS:
        // Random effect (duration between 3-10 seconds, multiplier between 0.3-2.0)
        return {
          type: PowerUpType.CHAOS,
          duration: 3000 + Math.random() * 7000,
          multiplier: 0.3 + Math.random() * 1.7
        };
      default:
        return {
          type: PowerUpType.SHIELD,
          duration: 8000,
          multiplier: 0.5
        };
    }
  }
  
  // Create visual particle effects
  private createVisualEffects(): void {
    // Different particle colors based on power-up type
    let particleColor: number;
    
    switch (this.powerUpType) {
      case PowerUpType.SHIELD:
        particleColor = 0x00ff00;
        break;
      case PowerUpType.TRAP:
        particleColor = 0xff0000;
        break;
      case PowerUpType.CHAOS:
        particleColor = 0xffaa00;
        break;
      default:
        particleColor = 0xffffff;
    }
    
    // Create particle emitter
    const particles = this.scene.add.particles(0, 0, 'particle', {
      lifespan: 1000,
      speed: { min: 10, max: 30 },
      scale: { start: 0.2, end: 0 },
      quantity: 1,
      blendMode: 'ADD',
      tint: particleColor
    });
    
    // Follow the power-up
    particles.startFollow(this);
    
    this.glowEffect = particles;
  }
  
  // Create floating animation
  private createFloatingAnimation(): void {
    this.floatTween = this.scene.tweens.add({
      targets: this,
      y: this.y - 10,
      duration: 1000,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    });
  }
  
  // Create label text
  private createLabel(): void {
    let labelText = '';
    
    switch (this.powerUpType) {
      case PowerUpType.SHIELD:
        labelText = 'SHIELD';
        break;
      case PowerUpType.TRAP:
        labelText = 'TRAP';
        break;
      case PowerUpType.CHAOS:
        labelText = '???';
        break;
    }
    
    this.labelText = this.scene.add.text(
      this.x,
      this.y - 25,
      labelText,
      {
        fontSize: '12px',
        fontFamily: 'Arial',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 3
      }
    );
    this.labelText.setOrigin(0.5, 0.5);
  }
  
  // Apply effect to a gladiator
  public applyEffect(gladiator: Gladiator): void {
    console.log(`Applying ${this.powerUpType} effect to gladiator`);
    
    switch (this.powerUpType) {
      case PowerUpType.SHIELD:
        this.applyShieldEffect(gladiator);
        break;
      case PowerUpType.TRAP:
        this.applyTrapEffect(gladiator);
        break;
      case PowerUpType.CHAOS:
        this.applyChaosEffect(gladiator);
        break;
    }
    
    // After applying effect, destroy the power-up
    this.destroyPowerUp();
  }
  
  // Apply shield effect
  private applyShieldEffect(gladiator: Gladiator): void {
    // Store original defense
    const originalDefense = gladiator.stats.defense;
    
    // Boost defense
    gladiator.stats.defense *= (1 + this.effect.multiplier);
    
    // Apply visual effect to the gladiator (shield)
    this.addGladiatorVisualEffect(gladiator, 0x00ff00);
    
    // Reset after duration
    this.scene.time.delayedCall(this.effect.duration, () => {
      if (gladiator.active) {
        gladiator.stats.defense = originalDefense;
        console.log('Shield effect has worn off');
      }
    });
  }
  
  // Apply trap effect (negative effect that slows and damages)
  private applyTrapEffect(gladiator: Gladiator): void {
    // Store original speed
    const originalSpeed = gladiator.stats.speed;
    
    // Slow down the gladiator
    gladiator.stats.speed *= this.effect.multiplier;
    
    // Deal some damage
    gladiator.takeDamage(10);
    
    // Apply visual effect (red particles)
    this.addGladiatorVisualEffect(gladiator, 0xff0000);
    
    // Reset after duration
    this.scene.time.delayedCall(this.effect.duration, () => {
      if (gladiator.active) {
        gladiator.stats.speed = originalSpeed;
        console.log('Trap effect has worn off');
      }
    });
  }
  
  // Apply chaos effect (random positive or negative effect)
  private applyChaosEffect(gladiator: Gladiator): void {
    // Random effect type
    const effectType = Math.floor(Math.random() * 3);
    
    switch (effectType) {
      case 0: // Invincibility
        const originalDefense = gladiator.stats.defense;
        gladiator.stats.defense *= 10;
        this.addGladiatorVisualEffect(gladiator, 0xffff00);
        
        this.scene.time.delayedCall(this.effect.duration, () => {
          if (gladiator.active) {
            gladiator.stats.defense = originalDefense;
          }
        });
        break;
        
      case 1: // Confusion (random movement)
        const confusionInterval = this.scene.time.addEvent({
          delay: 500,
          callback: () => {
            if (gladiator.active) {
              const angle = Math.random() * Math.PI * 2;
              const speed = gladiator.stats.speed;
              gladiator.setVelocity(
                Math.cos(angle) * speed,
                Math.sin(angle) * speed
              );
            }
          },
          callbackScope: this,
          loop: true
        });
        
        this.addGladiatorVisualEffect(gladiator, 0xff00ff);
        
        this.scene.time.delayedCall(this.effect.duration, () => {
          confusionInterval.destroy();
        });
        break;
        
      case 2: // Health boost or reduction
        if (Math.random() > 0.5) {
          // Health boost
          gladiator.stats.health = Math.min(
            gladiator.stats.maxHealth!,
            gladiator.stats.health! + 50
          );
          this.addGladiatorVisualEffect(gladiator, 0x00ff00);
        } else {
          // Health reduction
          gladiator.takeDamage(30);
          this.addGladiatorVisualEffect(gladiator, 0xff0000);
        }
        break;
    }
    
    console.log(`Applied chaos effect type ${effectType}`);
  }
  
  // Add visual effect to a gladiator
  private addGladiatorVisualEffect(gladiator: Gladiator, color: number): void {
    // Create a particle effect that follows the gladiator
    const particles = this.scene.add.particles(0, 0, 'particle', {
      lifespan: 1000,
      speed: { min: 20, max: 50 },
      scale: { start: 0.1, end: 0 },
      quantity: 1,
      blendMode: 'ADD',
      tint: color
    });
    
    particles.startFollow(gladiator);
    
    // Remove particles after effect duration
    this.scene.time.delayedCall(this.effect.duration, () => {
      particles.destroy();
    });
  }
  
  // Destroy this power-up and its associated objects
  public destroyPowerUp(): void {
    // Cleanup visual effects
    if (this.glowEffect) {
      this.glowEffect.destroy();
    }
    
    // Cleanup animation
    if (this.floatTween) {
      this.floatTween.stop();
      this.floatTween.remove();
    }
    
    // Cleanup label
    if (this.labelText) {
      this.labelText.destroy();
    }
    
    // Destroy the sprite
    this.destroy();
    
    console.log(`PowerUp of type ${this.powerUpType} destroyed`);
  }
  
  // Check if power-up should expire
  public update(): void {
    // Update label position to follow power-up
    if (this.labelText) {
      this.labelText.setPosition(this.x, this.y - 25);
    }
    
    // Check if power-up has expired (based on lifespan)
    if (this.scene.time.now - this.creationTime > this.lifespan) {
      console.log(`PowerUp of type ${this.powerUpType} expired`);
      this.destroyPowerUp();
    }
  }
  
  // Get power-up effect
  public getEffect(): IPowerUpEffect {
    return this.effect;
  }
  
  // Get power-up type
  public getType(): PowerUpType {
    return this.powerUpType;
  }
  
  // Set custom lifespan
  public setLifespan(lifespan: number): void {
    this.lifespan = lifespan;
  }
} 