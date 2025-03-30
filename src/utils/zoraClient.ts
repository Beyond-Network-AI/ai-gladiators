import { DEFAULT_GAME_SETTINGS } from '../types/GameConfig';

/**
 * ZoraClient - Interface for interacting with the Zora Coins SDK
 * 
 * In development mode, this uses mock functions that simulate token interactions.
 * In production mode, this connects to the actual Zora Coins API.
 */

// Track balances for development mode
const devBalances: { [address: string]: number } = {};

// Interface for transaction results
interface TransactionResult {
  success: boolean;
  message: string;
  data?: any;
}

/**
 * ZoraClient class for handling token operations
 */
export class ZoraClient {
  private isDevMode: boolean;
  
  constructor() {
    // Set dev mode based on game config
    this.isDevMode = DEFAULT_GAME_SETTINGS.isDevMode;
    console.log(`ZoraClient initialized in ${this.isDevMode ? 'development' : 'production'} mode`);
  }

  /**
   * Connect wallet to Zora ecosystem
   * @returns Information about the connected wallet
   */
  async connectWallet(): Promise<{ address: string; isConnected: boolean }> {
    if (this.isDevMode) {
      // Generate a mock wallet address in dev mode
      const address = '0x' + Math.random().toString(16).substr(2, 38);
      console.log(`[DEV] Connected mock wallet: ${address}`);
      
      // Initialize balance if not exists
      if (!devBalances[address]) {
        devBalances[address] = 0;
      }
      
      return { address, isConnected: true };
    } else {
      // In production, this would use something like:
      // return await zoraCoinsSDK.connectWallet();
      console.warn('Production wallet connection not implemented');
      return { address: '', isConnected: false };
    }
  }

  /**
   * Get token balance for an address
   * @param address Wallet address
   * @returns The token balance
   */
  async getBalance(address: string): Promise<number> {
    if (this.isDevMode) {
      // Return mock balance in dev mode
      const balance = devBalances[address] || 0;
      console.log(`[DEV] Balance check for ${address}: ${balance} $GLAD`);
      return balance;
    } else {
      // In production, this would use the SDK:
      // return await zoraCoinsSDK.getBalance(address);
      console.warn('Production balance check not implemented');
      return 0;
    }
  }

  /**
   * Mint tokens to a wallet address
   * @param address Wallet address to mint tokens to
   * @param amount Amount of tokens to mint
   * @returns Transaction result
   */
  async mint(address: string, amount: number): Promise<TransactionResult> {
    if (this.isDevMode) {
      // Simulate minting in dev mode
      if (!devBalances[address]) {
        devBalances[address] = 0;
      }
      
      devBalances[address] += amount;
      console.log(`[DEV] Minted ${amount} $GLAD to ${address}. New balance: ${devBalances[address]}`);
      
      return {
        success: true,
        message: `Successfully minted ${amount} $GLAD tokens`,
        data: { newBalance: devBalances[address] }
      };
    } else {
      // In production, this would use the SDK:
      // return await zoraCoinsSDK.mint(address, amount);
      console.warn('Production minting not implemented');
      return {
        success: false,
        message: 'Minting not available in production yet'
      };
    }
  }

  /**
   * Spend tokens from a wallet
   * @param address Wallet address to spend from
   * @param amount Amount to spend
   * @returns Transaction result
   */
  async spend(address: string, amount: number): Promise<TransactionResult> {
    if (this.isDevMode) {
      // Check if there's enough balance
      if (!devBalances[address] || devBalances[address] < amount) {
        console.log(`[DEV] Insufficient funds: ${address} has ${devBalances[address] || 0} $GLAD, tried to spend ${amount}`);
        return {
          success: false,
          message: 'Insufficient funds',
          data: { balance: devBalances[address] || 0 }
        };
      }
      
      // Spend tokens
      devBalances[address] -= amount;
      console.log(`[DEV] Spent ${amount} $GLAD from ${address}. New balance: ${devBalances[address]}`);
      
      return {
        success: true,
        message: `Successfully spent ${amount} $GLAD tokens`,
        data: { newBalance: devBalances[address] }
      };
    } else {
      // In production, this would use the SDK:
      // return await zoraCoinsSDK.spend(address, amount);
      console.warn('Production spending not implemented');
      return {
        success: false,
        message: 'Spending not available in production yet'
      };
    }
  }

  /**
   * Transfer tokens between wallets
   * @param fromAddress Sender wallet address
   * @param toAddress Recipient wallet address
   * @param amount Amount to transfer
   * @returns Transaction result
   */
  async transfer(fromAddress: string, toAddress: string, amount: number): Promise<TransactionResult> {
    if (this.isDevMode) {
      // Check if there's enough balance
      if (!devBalances[fromAddress] || devBalances[fromAddress] < amount) {
        console.log(`[DEV] Insufficient funds for transfer: ${fromAddress} has ${devBalances[fromAddress] || 0} $GLAD, tried to transfer ${amount}`);
        return {
          success: false,
          message: 'Insufficient funds for transfer',
          data: { balance: devBalances[fromAddress] || 0 }
        };
      }
      
      // Initialize recipient balance if needed
      if (!devBalances[toAddress]) {
        devBalances[toAddress] = 0;
      }
      
      // Transfer tokens
      devBalances[fromAddress] -= amount;
      devBalances[toAddress] += amount;
      
      console.log(`[DEV] Transferred ${amount} $GLAD from ${fromAddress} to ${toAddress}`);
      console.log(`[DEV] New balances - Sender: ${devBalances[fromAddress]}, Recipient: ${devBalances[toAddress]}`);
      
      return {
        success: true,
        message: `Successfully transferred ${amount} $GLAD tokens`,
        data: { 
          senderBalance: devBalances[fromAddress],
          recipientBalance: devBalances[toAddress]
        }
      };
    } else {
      // In production, this would use the SDK:
      // return await zoraCoinsSDK.transfer(fromAddress, toAddress, amount);
      console.warn('Production transfer not implemented');
      return {
        success: false,
        message: 'Transfer not available in production yet'
      };
    }
  }
  
  /**
   * Distribute rewards to winners based on predictions
   * @param winners Array of winner addresses
   * @param amount Amount each winner receives
   * @returns Array of transaction results
   */
  async distributeRewards(winners: string[], amount: number): Promise<TransactionResult[]> {
    const results: TransactionResult[] = [];
    
    if (this.isDevMode) {
      // Distribute rewards to each winner
      for (const address of winners) {
        // Initialize balance if needed
        if (!devBalances[address]) {
          devBalances[address] = 0;
        }
        
        // Add rewards
        devBalances[address] += amount;
        console.log(`[DEV] Rewarded ${amount} $GLAD to ${address}. New balance: ${devBalances[address]}`);
        
        results.push({
          success: true,
          message: `Successfully rewarded ${amount} $GLAD tokens`,
          data: { newBalance: devBalances[address] }
        });
      }
    } else {
      // In production, this would distribute rewards through the SDK
      console.warn('Production reward distribution not implemented');
      for (const address of winners) {
        results.push({
          success: false,
          message: 'Reward distribution not available in production yet'
        });
      }
    }
    
    return results;
  }

  /**
   * For development: Generate free tokens for a user to get started
   * @param address Wallet address to give tokens to
   * @param amount Amount of free tokens to give
   */
  async giveFreeTokens(address: string, amount: number = 100): Promise<TransactionResult> {
    if (this.isDevMode) {
      return this.mint(address, amount);
    } else {
      console.warn('Free tokens are only available in development mode');
      return {
        success: false,
        message: 'Free tokens are only available in development mode'
      };
    }
  }
}

// Export a singleton instance for easy use throughout the app
export const zoraClient = new ZoraClient(); 