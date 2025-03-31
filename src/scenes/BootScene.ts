import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    // Load gladiator sprites
    this.load.image('gladiator_red', 'assets/gladiators/gladiator_red.png');
    this.load.image('gladiator_blue', 'assets/gladiators/gladiator_blue.png');
    this.load.image('gladiator_green', 'assets/gladiators/gladiator_green.png');
    this.load.image('gladiator_yellow', 'assets/gladiators/gladiator_yellow.png');

    // Load powerup sprites
    this.load.image('powerup_shield', 'assets/powerups/powerup_shield.png');
    this.load.image('powerup_trap', 'assets/powerups/powerup_trap.png');
    this.load.image('powerup_chaos', 'assets/powerups/powerup_chaos.png');

    // Load hazard sprites
    this.load.image('hazard_spike', 'assets/hazards/hazard_spike.png');
    this.load.image('hazard_fireball', 'assets/hazards/hazard_fireball.png');

    // Load arena sprites
    this.load.image('tileset', 'assets/arena/tileset.png');
    this.createBackgroundTexture();

    // Load UI elements
    this.load.image('button', 'assets/ui/button.png');
    this.load.image('panel', 'assets/ui/panel.png');
    this.load.image('coin', 'assets/ui/coin.png');

    // Show loading progress
    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(240, 270, 320, 50);
    
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const loadingText = this.add.text(width / 2, height / 2 - 50, 'Loading...', {
      fontFamily: 'Arial',
      fontSize: '20px',
      color: '#ffffff'
    });
    loadingText.setOrigin(0.5, 0.5);
    
    this.load.on('progress', (value: number) => {
      progressBar.clear();
      progressBar.fillStyle(0xffffff, 1);
      progressBar.fillRect(250, 280, 300 * value, 30);
    });
    
    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
    });
  }

  create(): void {
    // Create a particle texture
    this.createParticleTexture();
    
    // Set a colored background
    this.cameras.main.setBackgroundColor('#4488AA');
    
    // Display some text
    this.add.text(
      this.cameras.main.centerX, 
      this.cameras.main.centerY, 
      'AI Gladiators: Onchain Arena', 
      { 
        fontFamily: 'Arial', 
        fontSize: '32px', 
        color: '#ffffff' 
      }
    ).setOrigin(0.5);

    // Add some subtext
    this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.centerY + 50,
      'Phaser 3 + TypeScript Project Setup Complete',
      {
        fontFamily: 'Arial',
        fontSize: '18px',
        color: '#ffffff'
      }
    ).setOrigin(0.5);
    
    // Add loading message
    const loadingText = this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.centerY + 100,
      'Loading arena...',
      {
        fontFamily: 'Arial',
        fontSize: '16px',
        color: '#ffffff'
      }
    ).setOrigin(0.5);
    
    // Transition to ArenaScene after 2 seconds
    this.time.delayedCall(2000, () => {
      this.scene.start('ArenaScene');
    });
    
    console.log('BootScene created successfully!');
  }

  // Create a particle texture for effects
  private createParticleTexture(): void {
    // Create a circle particle for effects
    const graphics = this.add.graphics();
    graphics.fillStyle(0xffffff);
    graphics.fillCircle(8, 8, 8);
    graphics.generateTexture('particle', 16, 16);
    graphics.destroy();
  }

  // Create a background texture programmatically
  private createBackgroundTexture(): void {
    // Create a 256x256 arena texture with more detail
    const size = 256;
    const graphics = this.add.graphics();
    
    // Create a gradient-like background with multiple color layers
    // Base dark layer
    graphics.fillStyle(0x0a0a20);
    graphics.fillRect(0, 0, size, size);
    
    // Add scattered stars/dots in the background
    graphics.fillStyle(0x3a3a6a, 0.3);
    for (let i = 0; i < 60; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const radius = 0.5 + Math.random() * 1.5;
      graphics.fillCircle(x, y, radius);
    }
    
    // Add brighter dots (stars) in the background
    graphics.fillStyle(0x6a6aca, 0.5);
    for (let i = 0; i < 25; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const radius = 0.3 + Math.random() * 0.8;
      graphics.fillCircle(x, y, radius);
    }
    
    // Add a few larger glowing areas
    graphics.fillStyle(0x252570, 0.3);
    for (let i = 0; i < 4; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const radius = 20 + Math.random() * 40;
      graphics.fillCircle(x, y, radius);
    }
    
    // Add a hexagonal grid pattern for arena floor
    graphics.lineStyle(1, 0x3333aa, 0.4);
    
    // Draw a hexagonal grid pattern
    const hexSize = 32;
    const rows = Math.ceil(size / hexSize) + 1;
    const cols = Math.ceil(size / hexSize) + 1;
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = col * hexSize * 1.5;
        const y = row * hexSize * (Math.sqrt(3) * 0.5) * 2;
        const offset = (row % 2) * hexSize * 0.75;
        
        // Draw hexagon
        graphics.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = Phaser.Math.DegToRad(60 * i - 30);
          const hx = x + offset + hexSize * Math.cos(angle);
          const hy = y + hexSize * Math.sin(angle);
          
          if (i === 0) {
            graphics.moveTo(hx, hy);
          } else {
            graphics.lineTo(hx, hy);
          }
        }
        graphics.closePath();
        graphics.strokePath();
      }
    }
    
    // Add crisscrossing lines for a tech/circuit look
    graphics.lineStyle(1, 0x4040cf, 0.3);
    
    // Horizontal lines at various heights
    for (let y = 0; y < size; y += 48) {
      graphics.beginPath();
      graphics.moveTo(0, y);
      graphics.lineTo(size, y);
      graphics.strokePath();
    }
    
    // Vertical lines at various widths
    for (let x = 0; x < size; x += 48) {
      graphics.beginPath();
      graphics.moveTo(x, 0);
      graphics.lineTo(x, size);
      graphics.strokePath();
    }
    
    // Add diagonal accent lines
    graphics.lineStyle(1, 0x5555dd, 0.25);
    for (let i = -size * 2; i < size * 2; i += 64) {
      graphics.beginPath();
      graphics.moveTo(0, i + size);
      graphics.lineTo(i + size, 0);
      graphics.strokePath();
    }
    
    // Add some circular patterns in the corners
    const cornerPositions = [
      {x: 0, y: 0},
      {x: size, y: 0},
      {x: 0, y: size},
      {x: size, y: size}
    ];
    
    graphics.lineStyle(1, 0x4466dd, 0.4);
    cornerPositions.forEach(pos => {
      for (let r = 10; r <= 60; r += 15) {
        graphics.beginPath();
        graphics.arc(pos.x, pos.y, r, 0, Math.PI * 2);
        graphics.strokePath();
      }
    });
    
    // Generate the texture from the graphics object
    graphics.generateTexture('background', size, size);
    graphics.destroy();
  }

  update(): void {
    // Update logic here
  }
} 