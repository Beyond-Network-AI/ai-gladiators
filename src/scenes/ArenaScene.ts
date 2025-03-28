import Phaser from 'phaser';
import { COLORS, GAME_WIDTH, GAME_HEIGHT } from '../utils/constants';

export class ArenaScene extends Phaser.Scene {
  // Spawn zones for gladiators
  private spawnZones: Phaser.Geom.Rectangle[];
  
  constructor() {
    super({ key: 'ArenaScene' });
    this.spawnZones = [];
  }

  preload(): void {
    // Preload assets - will be implemented in future steps
  }

  create(): void {
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
    this.visualizeSpawnZones();
    
    console.log('ArenaScene created successfully!');
  }

  update(): void {
    // Update logic - will be implemented in future steps
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
} 