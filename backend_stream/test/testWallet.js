import { post, get } from 'axios';

const testWalletMonitoring = async () => {
  try {
    // Test adding a wallet (you'll need actual signature)
    const walletData = {
      address: '0x742C0d87C8B2f8B65b913BfE7a8ca4D86C77A54C',
      signature: 'your_signature_here',
      message: 'Verify wallet ownership',
      chains: ['ethereum', 'polygon']
    };
    
    const response = await post('http://localhost:5000/api/wallets/verify', walletData);
    console.log('Wallet added:', response.data);
    
    // Test getting transactions
    const txResponse = await get(`http://localhost:5000/api/wallets/${walletData.address}/transactions`);
    console.log('Transactions:', txResponse.data);
    
  } catch (error) {
    console.error('Test failed:', error.response?.data || error.message);
  }
};

testWalletMonitoring();