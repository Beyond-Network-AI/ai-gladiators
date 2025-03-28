import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    // Preload assets here
  }

  create(): void {
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

  update(): void {
    // Update logic here
  }
} 