/**
 * MVPVotingManager - Manages MVP voting for gladiators after matches
 * 
 * This utility handles the collection and tallying of votes for the MVP (Most Valuable Player)
 * gladiator after each match. It stores voting history in localStorage.
 */

import { zoraClient } from './zoraClient';

// Types for MVP voting
export interface MVPVote {
  matchId: number;
  voterId: string; // Wallet address of voter
  gladiatorId: number;
  timestamp: number;
}

export interface MVPVoteResult {
  matchId: number;
  mvpGladiatorId: number;
  totalVotes: number;
  votesByGladiator: { [gladiatorId: number]: number };
  timestamp: number;
}

// Define the cost of voting for MVP
export const MVP_VOTE_COST = 1; // 1 token

export class MVPVotingManager {
  private static instance: MVPVotingManager;
  private activeVoting: boolean = false;
  private currentMatchId: number = 0;
  private eligibleGladiators: number[] = [];
  private votes: MVPVote[] = [];
  private voteResults: MVPVoteResult[] = [];
  private voteTimer: any = null;
  private voteEndCallback: ((result: MVPVoteResult) => void) | null = null;
  private voteEndTime: number = 0;
  
  // Duration of voting period in milliseconds
  private readonly VOTING_DURATION = 15000; // 15 seconds
  
  private constructor() {
    // Load voting history from localStorage
    this.loadFromStorage();
  }
  
  /**
   * Get the singleton instance of MVPVotingManager
   */
  public static getInstance(): MVPVotingManager {
    if (!MVPVotingManager.instance) {
      MVPVotingManager.instance = new MVPVotingManager();
    }
    return MVPVotingManager.instance;
  }
  
  /**
   * Start a new voting session for MVP
   * @param matchId ID of the current match
   * @param gladiatorIds Array of gladiator IDs that participated in the match
   * @param callback Function to call when voting ends
   */
  public startVoting(
    matchId: number, 
    gladiatorIds: number[], 
    callback: (result: MVPVoteResult) => void
  ): void {
    console.log(`Starting MVP voting for match #${matchId} with ${gladiatorIds.length} gladiators`);
    
    // If there's already a vote in progress, end it
    if (this.activeVoting) {
      console.log('Ending previous voting session before starting a new one');
      this.endVoting();
    }
    
    // Set up new voting session
    this.activeVoting = true;
    this.currentMatchId = matchId;
    this.eligibleGladiators = [...gladiatorIds];
    this.voteEndCallback = callback;
    
    // Clear current votes for this match
    this.votes = this.votes.filter(vote => vote.matchId !== matchId);
    
    // Set end time
    this.voteEndTime = Date.now() + this.VOTING_DURATION;
    
    // Clear any existing timer
    if (this.voteTimer) {
      clearTimeout(this.voteTimer);
      this.voteTimer = null;
    }
    
    // Set timer to end voting automatically
    this.voteTimer = setTimeout(() => {
      console.log('Voting timer expired, ending voting session');
      this.endVoting();
    }, this.VOTING_DURATION);
    
    console.log(`MVP voting started for match #${matchId} with ${gladiatorIds.length} gladiators`);
  }
  
  /**
   * Cast a vote for MVP
   * @param voterId Wallet address of the voter
   * @param gladiatorId ID of the gladiator being voted for
   * @returns Success status and message
   */
  public async castVote(voterId: string, gladiatorId: number): Promise<{ success: boolean; message: string }> {
    // Check if voting is active
    if (!this.activeVoting) {
      return { success: false, message: 'Voting is not currently active' };
    }
    
    // Check if gladiator is eligible
    if (!this.eligibleGladiators.includes(gladiatorId)) {
      return { success: false, message: 'Gladiator is not eligible for MVP voting' };
    }
    
    // Check if voter has already voted in this match
    const existingVote = this.votes.find(v => v.matchId === this.currentMatchId && v.voterId === voterId);
    if (existingVote) {
      return { success: false, message: 'You have already voted in this match' };
    }
    
    // Check if voter has enough tokens and charge for the vote
    const spendResult = await zoraClient.spend(voterId, MVP_VOTE_COST);
    if (!spendResult.success) {
      return { success: false, message: `Not enough tokens to vote (need ${MVP_VOTE_COST} $GLAD)` };
    }
    
    // Record the vote
    const vote: MVPVote = {
      matchId: this.currentMatchId,
      voterId,
      gladiatorId,
      timestamp: Date.now()
    };
    
    this.votes.push(vote);
    this.saveToStorage();
    
    console.log(`Vote recorded for gladiator #${gladiatorId} by ${voterId}`);

    // Stop the automatic voting timer after a manual vote
    if (this.voteTimer) {
      clearTimeout(this.voteTimer);
      
      // Set a shorter timer to end voting after a manual vote (5 seconds)
      this.voteTimer = setTimeout(() => {
        console.log('Ending voting after manual vote');
        this.endVoting();
      }, 5000);
    }
    
    return { success: true, message: 'Vote recorded successfully' };
  }
  
  /**
   * End the current voting session and tally results
   * @returns The voting result, or null if no voting was active
   */
  public endVoting(): MVPVoteResult | null {
    console.log('Ending MVP voting session');
    
    if (!this.activeVoting) {
      console.log('No active voting session to end');
      return null;
    }
    
    // Clear any pending timer
    if (this.voteTimer) {
      clearTimeout(this.voteTimer);
      this.voteTimer = null;
    }
    
    // Tally votes for current match
    const matchVotes = this.votes.filter(vote => vote.matchId === this.currentMatchId);
    const voteCounts: { [gladiatorId: number]: number } = {};
    
    // Initialize with 0 votes for all eligible gladiators
    this.eligibleGladiators.forEach(id => {
      voteCounts[id] = 0;
    });
    
    // Count votes
    matchVotes.forEach(vote => {
      voteCounts[vote.gladiatorId] = (voteCounts[vote.gladiatorId] || 0) + 1;
    });
    
    console.log('Vote counts:', voteCounts);
    
    // Find the gladiator with the most votes
    let mvpGladiatorId = -1;
    let maxVotes = -1;
    
    Object.entries(voteCounts).forEach(([gladiatorId, count]) => {
      if (count > maxVotes) {
        maxVotes = count;
        mvpGladiatorId = parseInt(gladiatorId, 10);
      }
    });
    
    // Only choose a random MVP if there are no manual votes at all
    if (maxVotes <= 0 && this.eligibleGladiators.length > 0) {
      console.log('No votes cast, selecting random gladiator as MVP');
      // If no votes, pick a random gladiator as MVP
      const randomIndex = Math.floor(Math.random() * this.eligibleGladiators.length);
      mvpGladiatorId = this.eligibleGladiators[randomIndex];
    }
    
    // Verify we have a valid MVP
    if (mvpGladiatorId < 0 && this.eligibleGladiators.length > 0) {
      mvpGladiatorId = this.eligibleGladiators[0];
      console.log(`Using fallback MVP: Gladiator #${mvpGladiatorId}`);
    }
    
    // Create result object
    const result: MVPVoteResult = {
      matchId: this.currentMatchId,
      mvpGladiatorId,
      totalVotes: matchVotes.length,
      votesByGladiator: voteCounts,
      timestamp: Date.now()
    };
    
    // Store result
    this.voteResults.push(result);
    this.saveToStorage();
    
    // Reset voting state
    this.activeVoting = false;
    
    // Store match ID before clearing
    const matchId = this.currentMatchId;
    
    // Clear state
    this.currentMatchId = 0;
    this.eligibleGladiators = [];
    
    // Call callback if provided
    if (this.voteEndCallback) {
      try {
        console.log('Calling vote end callback with result:', result);
        this.voteEndCallback(result);
      } catch (error) {
        console.error('Error in vote end callback:', error);
      }
      this.voteEndCallback = null;
    }
    
    console.log(`MVP voting ended for match #${matchId}. Gladiator #${mvpGladiatorId} is MVP with ${maxVotes} votes`);
    return result;
  }
  
  /**
   * Get voting results for a specific match
   * @param matchId ID of the match
   * @returns Voting result or null if not found
   */
  public getVoteResult(matchId: number): MVPVoteResult | null {
    return this.voteResults.find(r => r.matchId === matchId) || null;
  }
  
  /**
   * Get all voting results
   * @param limit Maximum number of results to return
   * @returns Array of voting results, most recent first
   */
  public getAllVoteResults(limit?: number): MVPVoteResult[] {
    const sorted = [...this.voteResults].sort((a, b) => b.timestamp - a.timestamp);
    return limit ? sorted.slice(0, limit) : sorted;
  }
  
  /**
   * Get time remaining in current voting session
   * @returns Milliseconds remaining, or 0 if no voting active
   */
  public getTimeRemaining(): number {
    if (!this.activeVoting) return 0;
    const remaining = this.voteEndTime - Date.now();
    return remaining > 0 ? remaining : 0;
  }
  
  /**
   * Check if voting is currently active
   */
  public isVotingActive(): boolean {
    return this.activeVoting;
  }
  
  /**
   * Save voting data to localStorage
   */
  private saveToStorage(): void {
    try {
      localStorage.setItem('mvpVotes', JSON.stringify(this.votes));
      localStorage.setItem('mvpResults', JSON.stringify(this.voteResults));
      console.log('MVP voting data saved to localStorage');
    } catch (error) {
      console.error('Failed to save MVP voting data to localStorage:', error);
    }
  }
  
  /**
   * Load voting data from localStorage
   */
  private loadFromStorage(): void {
    try {
      const votesJson = localStorage.getItem('mvpVotes');
      if (votesJson) {
        this.votes = JSON.parse(votesJson);
      }
      
      const resultsJson = localStorage.getItem('mvpResults');
      if (resultsJson) {
        this.voteResults = JSON.parse(resultsJson);
      }
      
      console.log('MVP voting data loaded from localStorage');
    } catch (error) {
      console.error('Failed to load MVP voting data from localStorage:', error);
    }
  }
  
  /**
   * Clear all voting data
   */
  public clearAllData(): void {
    this.votes = [];
    this.voteResults = [];
    
    localStorage.removeItem('mvpVotes');
    localStorage.removeItem('mvpResults');
    
    console.log('All MVP voting data cleared');
  }
}

// Export a singleton instance for easy use throughout the app
export const mvpVotingManager = MVPVotingManager.getInstance(); 