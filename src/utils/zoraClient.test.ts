import { zoraClient } from './zoraClient';

/**
 * Manual test function for zoraClient
 * This is a simple test to demonstrate zoraClient functionality.
 * In a real project, you'd use a testing framework like Jest.
 */
export async function testZoraClient() {
  console.log('=== Testing ZoraClient ===');
  
  try {
    // Test wallet connection
    console.log('1. Testing wallet connection...');
    const walletResult = await zoraClient.connectWallet();
    console.log('Wallet connected:', walletResult);
    
    if (!walletResult.isConnected) {
      console.error('Failed to connect wallet');
      return;
    }
    
    const address = walletResult.address;
    
    // Test initial balance after connection
    console.log('\n2. Testing initial balance after connection...');
    const initialBalance = await zoraClient.getBalance(address);
    console.log('Initial balance:', initialBalance);
    
    // Test minting tokens
    console.log('\n3. Testing minting tokens...');
    const mintResult = await zoraClient.mint(address, 10);
    console.log('Mint result:', mintResult);
    
    if (!mintResult.success) {
      console.error('Failed to mint tokens');
      return;
    }
    
    // Test balance after minting
    console.log('\n4. Testing balance after minting...');
    const balanceAfterMint = await zoraClient.getBalance(address);
    console.log('Balance after mint:', balanceAfterMint);
    
    // Test spending tokens
    console.log('\n5. Testing spending tokens...');
    const spendResult = await zoraClient.spend(address, 5);
    console.log('Spend result:', spendResult);
    
    if (!spendResult.success) {
      console.error('Failed to spend tokens');
      return;
    }
    
    // Test balance after spending
    console.log('\n6. Testing balance after spending...');
    const balanceAfterSpend = await zoraClient.getBalance(address);
    console.log('Balance after spend:', balanceAfterSpend);
    
    // Test distributing rewards
    console.log('\n7. Testing distributing rewards...');
    const rewardResults = await zoraClient.distributeRewards([address], 10);
    console.log('Reward results:', rewardResults);
    
    // Test final balance
    console.log('\n8. Testing final balance...');
    const finalBalance = await zoraClient.getBalance(address);
    console.log('Final balance:', finalBalance);
    
    console.log('\n=== ZoraClient Test Completed Successfully ===');
  } catch (error) {
    console.error('Error testing ZoraClient:', error);
  }
}

// Run the test automatically in development mode
if (process.env.NODE_ENV === 'development') {
  console.log('Running automated ZoraClient test...');
  testZoraClient().catch(console.error);
} 