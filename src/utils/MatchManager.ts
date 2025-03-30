/**
 * MatchManager - Manages match history, statistics, and leaderboards
 * 
 * This utility class handles the persistence and retrieval of match data
 * and provides functionality for tracking statistics across multiple matches.
 */

// Types for match data
export interface MatchResult {
  matchId: number;
  winner: {
    id: number;
    name: string;
  } | null; // null in case of draw
  duration: number;
  timestamp: number;
  stats: {
    powerUpsCollected: number;
    hazardsTriggered: number;
  };
  predictions: {
    address: string;
    gladiatorId: number;
    amount: number;
    wasCorrect: boolean;
  }[];
}

export interface PlayerStats {
  address: string;
  predictionsTotal: number;
  predictionsCorrect: number;
  tokensSpent: number;
  tokensWon: number;
  matchesWatched: number;
}

export class MatchManager {
  private static instance: MatchManager;
  private matchHistory: MatchResult[] = [];
  private playerStats: Map<string, PlayerStats> = new Map();
  private currentMatchId: number = 0;

  private constructor() {
    // Load from localStorage if available
    this.loadFromStorage();
  }

  /**
   * Get the singleton instance of MatchManager
   */
  public static getInstance(): MatchManager {
    if (!MatchManager.instance) {
      MatchManager.instance = new MatchManager();
    }
    return MatchManager.instance;
  }

  /**
   * Get the ID for the next match
   */
  public getNextMatchId(): number {
    return this.currentMatchId + 1;
  }

  /**
   * Record a completed match
   * @param result Match result details
   */
  public recordMatch(result: MatchResult): void {
    // Update match ID if needed
    this.currentMatchId = result.matchId;
    
    // Add to history
    this.matchHistory.push(result);
    
    // Update player stats based on predictions
    result.predictions.forEach(prediction => {
      let playerStat = this.playerStats.get(prediction.address);
      
      if (!playerStat) {
        playerStat = {
          address: prediction.address,
          predictionsTotal: 0,
          predictionsCorrect: 0,
          tokensSpent: 0,
          tokensWon: 0,
          matchesWatched: 0
        };
      }
      
      // Update stats
      playerStat.predictionsTotal++;
      if (prediction.wasCorrect) {
        playerStat.predictionsCorrect++;
        playerStat.tokensWon += prediction.amount * 2; // Assuming 2x reward
      }
      playerStat.tokensSpent += prediction.amount;
      playerStat.matchesWatched++;
      
      // Save updated stats
      this.playerStats.set(prediction.address, playerStat);
    });
    
    // Persist to localStorage
    this.saveToStorage();
  }

  /**
   * Get match history
   * @param limit Number of matches to return (most recent first)
   */
  public getMatchHistory(limit: number = 10): MatchResult[] {
    // Return most recent matches first
    return this.matchHistory.slice(-limit).reverse();
  }

  /**
   * Get player statistics
   * @param address Player wallet address
   */
  public getPlayerStats(address: string): PlayerStats | null {
    return this.playerStats.get(address) || null;
  }

  /**
   * Get all player stats sorted by win rate
   */
  public getLeaderboard(): PlayerStats[] {
    return Array.from(this.playerStats.values())
      .filter(player => player.predictionsTotal >= 3) // Minimum 3 predictions to be ranked
      .sort((a, b) => {
        const aWinRate = a.predictionsCorrect / a.predictionsTotal;
        const bWinRate = b.predictionsCorrect / b.predictionsTotal;
        return bWinRate - aWinRate; // Descending order
      });
  }

  /**
   * Save data to localStorage
   */
  private saveToStorage(): void {
    try {
      // Save match history
      localStorage.setItem('matchHistory', JSON.stringify(this.matchHistory));
      
      // Save player stats (convert Map to object)
      const playerStatsObj = Object.fromEntries(this.playerStats.entries());
      localStorage.setItem('playerStats', JSON.stringify(playerStatsObj));
      
      // Save current match ID
      localStorage.setItem('currentMatchId', this.currentMatchId.toString());
      
      console.log('Match data saved to localStorage');
    } catch (error) {
      console.error('Failed to save match data to localStorage:', error);
    }
  }

  /**
   * Load data from localStorage
   */
  private loadFromStorage(): void {
    try {
      // Load match history
      const historyJson = localStorage.getItem('matchHistory');
      if (historyJson) {
        this.matchHistory = JSON.parse(historyJson);
      }
      
      // Load player stats
      const statsJson = localStorage.getItem('playerStats');
      if (statsJson) {
        const statsObj = JSON.parse(statsJson);
        this.playerStats = new Map(Object.entries(statsObj));
      }
      
      // Load current match ID
      const matchIdStr = localStorage.getItem('currentMatchId');
      if (matchIdStr) {
        this.currentMatchId = parseInt(matchIdStr, 10);
      }
      
      console.log('Match data loaded from localStorage');
    } catch (error) {
      console.error('Failed to load match data from localStorage:', error);
    }
  }

  /**
   * Clear all match history and player stats
   */
  public clearAllData(): void {
    this.matchHistory = [];
    this.playerStats.clear();
    this.currentMatchId = 0;
    
    // Clear localStorage
    localStorage.removeItem('matchHistory');
    localStorage.removeItem('playerStats');
    localStorage.removeItem('currentMatchId');
    
    console.log('All match data cleared');
  }
}

// Export a singleton instance for easy use throughout the app
export const matchManager = MatchManager.getInstance(); 