// Add the progress bar with consistent position and size
    this.progressBar = this.add.graphics();
    this.progressBar.fillStyle(0xff6644, 1);
    this.progressBar.fillGradientStyle(0xff6644, 0xffaa00, 0xff6644, 0xffaa00, 1);

    // Fixed progress bar position and dimensions
    const barX = 260;
    const barY = 485;
    const maxWidth = 280;
    const barHeight = 10;

    // Start with a consistent partially filled bar
    const initialProgress = 0.3;
    this.progressBar.fillRect(barX, barY, maxWidth * initialProgress, barHeight);

    // Store dimensions for consistent updates
    this.progressBarConfig = { x: barX, y: barY, width: maxWidth, height: barHeight };

    // Add a timer with more predictable progression
    this.time.addEvent({
      delay: 1200, // Slower updates
      callback: this.updateProgress,
      callbackScope: this,
      loop: true
    });


private updateProgress(): void {
    // Predictable progress increase
    this.currentProgress += 0.1; // Consistent increment

    if (this.currentProgress >= 1) {
      this.currentProgress = 1; // Explicitly set to 1 to avoid overflow

      // Show ready message
      if (!this.readyText) {
        this.readyText = this.add.text(400, 460, 'Ready to battle!', {
          fontFamily: 'Arial',
          fontSize: '18px',
          color: '#55ff55'
        }).setOrigin(0.5);

        // Enable the enter button
        this.enterButton.setInteractive({ useHandCursor: true });
        this.enterButton.setFillStyle(0xff6644, 1);

        // Stop the progress update
        this.progressEvent?.remove();
      }
    }

    // Update the bar graphic with consistent dimensions
    this.progressBar.clear();
    this.progressBar.fillStyle(0xff6644, 1);
    this.progressBar.fillGradientStyle(0xff6644, 0xffaa00, 0xff6644, 0xffaa00, 1);
    const config = this.progressBarConfig;
    const width = Math.floor(config.width * this.currentProgress); // Use floor for stable pixel values
    this.progressBar.fillRect(config.x, config.y, width, config.height);
  }