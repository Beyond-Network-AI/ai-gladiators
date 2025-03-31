import Phaser from 'phaser';
import { HazardType, HazardDirection, IHazardConfig } from '../types/HazardType';
import { Gladiator } from './Gladiator';
import { GAME_WIDTH, GAME_HEIGHT } from '../utils/constants';
import { HAZARD_SPRITES } from '../utils/AssetManager';

export class ArenaHazard extends Phaser.Physics.Arcade.Sprite {
  // Hazard properties
  private hazardType: HazardType;
  private config: IHazardConfig;
  
  // Special effects
  private warningEffect: Phaser.GameObjects.Graphics | null = null;
  private particleEffect: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
  
  // Movement properties
  private movementDirection: HazardDirection;
  private movementSpeed: number;
  
  // Damage amount
  private damage: number;
  
  // Timer for timed hazards
  private lifeTimer: Phaser.Time.TimerEvent | null = null;
  
  constructor(scene: Phaser.Scene, x: number, y: number, config: IHazardConfig) {
    // Set texture based on hazard type
    const texture = ArenaHazard.getTextureForType(config.type);
    
    super(scene, x, y, texture);
    
    // Add to scene and enable physics
    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    // Store hazard type and config
    this.hazardType = config.type;
    this.config = config;
    
    // Set movement properties
    this.movementDirection = config.direction || HazardDirection.NONE;
    this.movementSpeed = config.speed || 100;
    
    // Set damage amount
    this.damage = config.damage;
    
    // Set physical properties
    this.setCollideWorldBounds(true);
    
    // Set origin to center
    this.setOrigin(0.5, 0.5);
    
    // Configure hazard based on type
    this.configureHazard();
    
    // Create special effects
    this.createEffects();
    
    // If hazard has a lifetime, set up a timer to destroy it
    if (config.lifetime) {
      this.lifeTimer = this.scene.time.delayedCall(config.lifetime, () => {
        this.destroyHazard();
      });
    }
    
    console.log(`Arena hazard of type ${config.type} created at (${x}, ${y})`);
  }
  
  // Get appropriate texture based on hazard type
  private static getTextureForType(type: HazardType): string {
    switch (type) {
      case HazardType.SPIKE_WALL:
        return HAZARD_SPRITES.SPIKE;
      case HazardType.FIREBALL:
        return HAZARD_SPRITES.FIREBALL;
      default:
        return HAZARD_SPRITES.SPIKE;
    }
  }
  
  // Configure hazard based on its type
  private configureHazard(): void {
    switch (this.hazardType) {
      case HazardType.SPIKE_WALL:
        this.configureSpikeWall();
        break;
      case HazardType.FIREBALL:
        this.configureFireball();
        break;
    }
  }
  
  // Configure a spike wall hazard
  private configureSpikeWall(): void {
    // Set scale for spike wall (larger to cover more area)
    if (this.movementDirection === HazardDirection.HORIZONTAL) {
      this.setScale(0.5, 5); // Wide wall for horizontal movement
    } else {
      this.setScale(5, 0.5); // Tall wall for vertical movement
    }
    
    // Set tint to make it look dangerous
    this.setTint(0xff0000);
    
    // Set bounce to 1 to bounce off world bounds
    this.setBounce(1);
    
    // Start movement
    if (this.movementDirection === HazardDirection.HORIZONTAL) {
      this.setVelocity(this.movementSpeed, 0);
    } else if (this.movementDirection === HazardDirection.VERTICAL) {
      this.setVelocity(0, this.movementSpeed);
    }
  }
  
  // Configure a fireball hazard
  private configureFireball(): void {
    // Set scale for fireball (smaller)
    this.setScale(2);
    
    // Start falling from top or sides depending on configuration
    if (this.movementDirection === HazardDirection.VERTICAL) {
      this.setVelocity(0, this.movementSpeed);
    } else if (this.movementDirection === HazardDirection.HORIZONTAL) {
      this.setVelocity(this.movementSpeed, 0);
    } else {
      // If no direction specified, fall from top
      this.setVelocity(
        Phaser.Math.Between(-50, 50), // Random x velocity for more chaos
        this.movementSpeed
      );
    }
    
    // Enable gravity for falling effect (for fireballs only)
    if (this.body) {
      this.body.gravity.y = 200;
    }
  }
  
  // Create special effects
  private createEffects(): void {
    // Create warning effect based on hazard type
    this.createWarningEffect();
    
    // Create particle effect based on hazard type
    this.createParticleEffect();
  }
  
  // Create a warning effect (e.g., flashing area before spike wall appears)
  private createWarningEffect(): void {
    this.warningEffect = this.scene.add.graphics();
    
    switch (this.hazardType) {
      case HazardType.SPIKE_WALL:
        // Flashing warning box
        this.scene.tweens.add({
          targets: this,
          alpha: 0.3,
          duration: 200,
          yoyo: true,
          repeat: 4,
          onComplete: () => {
            this.setAlpha(1);
          }
        });
        break;
        
      case HazardType.FIREBALL:
        // Show warning shadow
        const shadow = this.scene.add.ellipse(this.x, GAME_HEIGHT - 30, 50, 20, 0x000000, 0.3);
        
        // Tween the shadow to match fireball position
        this.scene.tweens.add({
          targets: shadow,
          x: this.x,
          duration: 2000,
          onComplete: () => {
            shadow.destroy();
          }
        });
        break;
    }
  }
  
  // Create particle effect
  private createParticleEffect(): void {
    let particleColor: number;
    
    switch (this.hazardType) {
      case HazardType.SPIKE_WALL:
        particleColor = 0xff0000;
        break;
      case HazardType.FIREBALL:
        particleColor = 0xff6600;
        break;
      default:
        particleColor = 0xffffff;
    }
    
    // Create particle emitter
    const particles = this.scene.add.particles(0, 0, 'particle', {
      lifespan: 500,
      speed: { min: 20, max: 50 },
      scale: { start: 0.2, end: 0 },
      quantity: 2,
      blendMode: 'ADD',
      tint: particleColor
    });
    
    // Follow the hazard
    particles.startFollow(this);
    
    this.particleEffect = particles;
  }
  
  // Apply hazard effect to a gladiator
  public applyEffect(gladiator: Gladiator): void {
    console.log(`Applying ${this.hazardType} effect to gladiator`);
    
    switch (this.hazardType) {
      case HazardType.SPIKE_WALL:
        // Instant KO for spike wall
        gladiator.takeDamage(1000); // Ensure KO
        
        // Visual effect
        this.createImpactEffect(gladiator.x, gladiator.y, 0xff0000);
        break;
        
      case HazardType.FIREBALL:
        // Deal damage based on configuration
        gladiator.takeDamage(this.damage);
        
        // Visual effect
        this.createImpactEffect(gladiator.x, gladiator.y, 0xff6600);
        
        // If it's a fireball, destroy it after hitting a gladiator
        this.destroyHazard();
        break;
    }
  }
  
  // Create impact effect at specified position
  private createImpactEffect(x: number, y: number, color: number): void {
    // Create a particle explosion
    const particles = this.scene.add.particles(x, y, 'particle', {
      lifespan: 800,
      speed: { min: 50, max: 200 },
      scale: { start: 0.4, end: 0 },
      quantity: 20,
      blendMode: 'ADD',
      tint: color,
      emitting: false
    });
    
    // Emit once and destroy after animation completes
    particles.explode(20, x, y);
    
    this.scene.time.delayedCall(800, () => {
      particles.destroy();
    });
  }
  
  // Check if hazard is outside game bounds and should be destroyed
  private checkBounds(): boolean {
    const padding = 100; // Extra space beyond visible bounds
    
    // Check if hazard is far outside the visible area
    return (
      this.x < -padding ||
      this.x > GAME_WIDTH + padding ||
      this.y < -padding ||
      this.y > GAME_HEIGHT + padding
    );
  }
  
  // Destroy this hazard and its associated objects
  public destroyHazard(): void {
    // Cancel life timer if exists
    if (this.lifeTimer) {
      this.lifeTimer.remove();
    }
    
    // Cleanup warning effect
    if (this.warningEffect) {
      this.warningEffect.destroy();
    }
    
    // Cleanup particle effect
    if (this.particleEffect) {
      this.particleEffect.destroy();
    }
    
    // Destroy the sprite
    this.destroy();
    
    console.log(`Arena hazard of type ${this.hazardType} destroyed`);
  }
  
  // Update method called every frame
  update(): void {
    // Check if hazard should be destroyed (out of bounds)
    if (this.checkBounds()) {
      this.destroyHazard();
      return;
    }
    
    // Special behavior for each hazard type
    switch (this.hazardType) {
      case HazardType.SPIKE_WALL:
        // Already handled by physics
        break;
        
      case HazardType.FIREBALL:
        // Rotate the fireball for visual effect
        this.angle += 2;
        
        // Make fireball flicker
        if (Math.random() > 0.9) {
          this.setAlpha(0.8 + Math.random() * 0.2);
        }
        break;
    }
  }
  
  // Factory method to create a spike wall
  public static createSpikeWall(scene: Phaser.Scene, direction: HazardDirection): ArenaHazard {
    let x, y, config;
    
    // Determine position and movement based on direction
    if (direction === HazardDirection.HORIZONTAL) {
      // Start at random height on left or right side
      const side = Math.random() > 0.5 ? 0 : GAME_WIDTH;
      x = side;
      y = 100 + Math.random() * (GAME_HEIGHT - 200); // Random height avoiding top/bottom
      
      config = {
        type: HazardType.SPIKE_WALL,
        damage: 1000, // Instant KO
        direction: HazardDirection.HORIZONTAL,
        speed: side === 0 ? 200 : -200 // Move right if on left side, left if on right side
      };
    } else {
      // Start at random width on top or bottom
      const side = Math.random() > 0.5 ? 0 : GAME_HEIGHT;
      x = 100 + Math.random() * (GAME_WIDTH - 200); // Random width avoiding sides
      y = side;
      
      config = {
        type: HazardType.SPIKE_WALL,
        damage: 1000, // Instant KO
        direction: HazardDirection.VERTICAL,
        speed: side === 0 ? 200 : -200 // Move down if on top, up if on bottom
      };
    }
    
    return new ArenaHazard(scene, x, y, config);
  }
  
  // Factory method to create a fireball
  public static createFireball(scene: Phaser.Scene): ArenaHazard {
    // Start at random x position at top of screen
    const x = 50 + Math.random() * (GAME_WIDTH - 100);
    const y = -50; // Start above screen
    
    // Random falling speed
    const speed = 150 + Math.random() * 100;
    
    const config = {
      type: HazardType.FIREBALL,
      damage: 25 + Math.floor(Math.random() * 15), // 25-40 damage
      direction: HazardDirection.VERTICAL,
      speed: speed,
      lifetime: 6000 // Auto-destroy after 6 seconds
    };
    
    return new ArenaHazard(scene, x, y, config);
  }
} 