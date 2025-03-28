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
    
    console.log('BootScene created successfully!');
  }

  update(): void {
    // Update logic here
  }
} 