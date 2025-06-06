const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cron = require('node-cron');
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Configuration
const NODIT_API_KEY = process.env.NODIT_API_KEY; // Set your Nodit API key
const NODIT_BASE_URL = 'https://web3.nodit.io/v1';

// In-memory storage for monitored wallets (use database in production)
const monitoredWallets = new Map();
const walletHistory = new Map();

// Nodit API client
class NoditClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = NODIT_BASE_URL;
  }

  async makeRequest(protocol, network, operationId, data) {
    const url = `${this.baseURL}/${protocol}/${network}/${operationId}`;
    const headers = {
      'Content-Type': 'application/json',
      'X-API-KEY': this.apiKey
    };

    try {
      const response = await axios.post(url, data, { headers });
      return response.data;
    } catch (error) {
      console.error(`Nodit API Error: ${error.response?.data?.message || error.message}`);
      throw error;
    }
  }

  // Get wallet balance
  async getWalletBalance(protocol, network, address) {
    return await this.makeRequest(protocol, network, 'getNativeBalanceByAccount', {
      address: address
    });
  }

  // Get token balances
  async getTokenBalances(protocol, network, address) {
    return await this.makeRequest(protocol, network, 'getTokensOwnedByAccount', {
      address: address,
      limit: 100
    });
  }

  // Get recent transactions
  async getRecentTransactions(protocol, network, address, limit = 50) {
    return await this.makeRequest(protocol, network, 'getTransactionsByAccount', {
      address: address,
      limit: limit,
      order: 'desc'
    });
  }

  // Get token transfers
  async getTokenTransfers(protocol, network, address, limit = 50) {
    return await this.makeRequest(protocol, network, 'getTokenTransfersByAccount', {
      address: address,
      limit: limit,
      order: 'desc'
    });
  }

  // Get NFT holdings
  async getNFTHoldings(protocol, network, address) {
    return await this.makeRequest(protocol, network, 'getNftsOwnedByAccount', {
      address: address,
      limit: 100
    });
  }

  // Get account statistics
  async getAccountStats(protocol, network, address) {
    return await this.makeRequest(protocol, network, 'getAccountStats', {
      address: address
    });
  }
}

const noditClient = new NoditClient(NODIT_API_KEY);

// Wallet monitoring functions
async function getWalletSnapshot(protocol, network, address) {
  try {
    console.log(`Fetching wallet snapshot for ${address} on ${protocol}-${network}`);
    
    const [balance, tokens, transactions, tokenTransfers, nfts, stats] = await Promise.allSettled([
      noditClient.getWalletBalance(protocol, network, address),
      noditClient.getTokenBalances(protocol, network, address),
      noditClient.getRecentTransactions(protocol, network, address, 10),
      noditClient.getTokenTransfers(protocol, network, address, 10),
      noditClient.getNFTHoldings(protocol, network, address),
      noditClient.getAccountStats(protocol, network, address)
    ]);

    return {
      address,
      protocol,
      network,
      timestamp: new Date().toISOString(),
      balance: balance.status === 'fulfilled' ? balance.value : null,
      tokens: tokens.status === 'fulfilled' ? tokens.value : null,
      recentTransactions: transactions.status === 'fulfilled' ? transactions.value : null,
      tokenTransfers: tokenTransfers.status === 'fulfilled' ? tokenTransfers.value : null,
      nfts: nfts.status === 'fulfilled' ? nfts.value : null,
      stats: stats.status === 'fulfilled' ? stats.value : null,
      errors: [
        balance.status === 'rejected' ? { type: 'balance', error: balance.reason.message } : null,
        tokens.status === 'rejected' ? { type: 'tokens', error: tokens.reason.message } : null,
        transactions.status === 'rejected' ? { type: 'transactions', error: transactions.reason.message } : null,
        tokenTransfers.status === 'rejected' ? { type: 'tokenTransfers', error: tokenTransfers.reason.message } : null,
        nfts.status === 'rejected' ? { type: 'nfts', error: nfts.reason.message } : null,
        stats.status === 'rejected' ? { type: 'stats', error: stats.reason.message } : null
      ].filter(Boolean)
    };
  } catch (error) {
    console.error(`Error fetching wallet snapshot: ${error.message}`);
    return {
      address,
      protocol,
      network,
      timestamp: new Date().toISOString(),
      error: error.message
    };
  }
}

function detectChanges(oldSnapshot, newSnapshot) {
  const changes = [];

  // Check balance changes
  if (oldSnapshot.balance && newSnapshot.balance) {
    const oldBalance = BigInt(oldSnapshot.balance.balance || '0');
    const newBalance = BigInt(newSnapshot.balance.balance || '0');
    
    if (oldBalance !== newBalance) {
      changes.push({
        type: 'balance_change',
        old: oldBalance.toString(),
        new: newBalance.toString(),
        difference: (newBalance - oldBalance).toString()
      });
    }
  }

  // Check for new transactions
  if (oldSnapshot.recentTransactions && newSnapshot.recentTransactions) {
    const oldTxHashes = new Set(oldSnapshot.recentTransactions.result?.map(tx => tx.hash) || []);
    const newTransactions = newSnapshot.recentTransactions.result?.filter(tx => !oldTxHashes.has(tx.hash)) || [];
    
    if (newTransactions.length > 0) {
      changes.push({
        type: 'new_transactions',
        count: newTransactions.length,
        transactions: newTransactions
      });
    }
  }

  // Check for new token transfers
  if (oldSnapshot.tokenTransfers && newSnapshot.tokenTransfers) {
    const oldTransferHashes = new Set(oldSnapshot.tokenTransfers.result?.map(tx => tx.transactionHash) || []);
    const newTransfers = newSnapshot.tokenTransfers.result?.filter(tx => !oldTransferHashes.has(tx.transactionHash)) || [];
    
    if (newTransfers.length > 0) {
      changes.push({
        type: 'new_token_transfers',
        count: newTransfers.length,
        transfers: newTransfers
      });
    }
  }

  return changes;
}

// API Routes

// Add wallet to monitoring
app.post('/api/monitor/add', async (req, res) => {
  try {
    const { address, protocol = 'ethereum', network = 'mainnet', name } = req.body;

    if (!address) {
      return res.status(400).json({ error: 'Address is required' });
    }

    const walletId = `${protocol}-${network}-${address}`;
    
    // Get initial snapshot
    const initialSnapshot = await getWalletSnapshot(protocol, network, address);
    
    monitoredWallets.set(walletId, {
      address,
      protocol,
      network,
      name: name || address,
      createdAt: new Date().toISOString(),
      lastChecked: new Date().toISOString(),
      isActive: true,
      currentSnapshot: initialSnapshot
    });

    // Initialize history
    if (!walletHistory.has(walletId)) {
      walletHistory.set(walletId, []);
    }
    walletHistory.get(walletId).push(initialSnapshot);

    res.json({
      success: true,
      walletId,
      message: 'Wallet added to monitoring',
      initialSnapshot
    });
  } catch (error) {
    console.error('Error adding wallet to monitoring:', error);
    res.status(500).json({ error: 'Failed to add wallet to monitoring' });
  }
});

// Remove wallet from monitoring
app.delete('/api/monitor/remove/:walletId', (req, res) => {
  const { walletId } = req.params;
  
  if (monitoredWallets.has(walletId)) {
    monitoredWallets.delete(walletId);
    res.json({ success: true, message: 'Wallet removed from monitoring' });
  } else {
    res.status(404).json({ error: 'Wallet not found' });
  }
});

// Get all monitored wallets
app.get('/api/monitor/wallets', (req, res) => {
  const wallets = Array.from(monitoredWallets.entries()).map(([id, wallet]) => ({
    id,
    ...wallet
  }));
  
  res.json({ wallets });
});

// Get specific wallet data
app.get('/api/monitor/wallet/:walletId', (req, res) => {
  const { walletId } = req.params;
  
  if (!monitoredWallets.has(walletId)) {
    return res.status(404).json({ error: 'Wallet not found' });
  }

  const wallet = monitoredWallets.get(walletId);
  const history = walletHistory.get(walletId) || [];

  res.json({
    wallet: { id: walletId, ...wallet },
    history
  });
});

// Manual refresh wallet data
app.post('/api/monitor/refresh/:walletId', async (req, res) => {
  const { walletId } = req.params;
  
  if (!monitoredWallets.has(walletId)) {
    return res.status(404).json({ error: 'Wallet not found' });
  }

  try {
    const wallet = monitoredWallets.get(walletId);
    const newSnapshot = await getWalletSnapshot(wallet.protocol, wallet.network, wallet.address);
    
    // Detect changes
    const changes = detectChanges(wallet.currentSnapshot, newSnapshot);
    
    // Update wallet data
    wallet.currentSnapshot = newSnapshot;
    wallet.lastChecked = new Date().toISOString();
    monitoredWallets.set(walletId, wallet);
    
    // Add to history
    walletHistory.get(walletId).push(newSnapshot);
    
    // Keep only last 100 snapshots
    const history = walletHistory.get(walletId);
    if (history.length > 100) {
      history.splice(0, history.length - 100);
    }

    res.json({
      success: true,
      snapshot: newSnapshot,
      changes,
      wallet: { id: walletId, ...wallet }
    });
  } catch (error) {
    console.error('Error refreshing wallet data:', error);
    res.status(500).json({ error: 'Failed to refresh wallet data' });
  }
});

// Get wallet changes/alerts
app.get('/api/monitor/changes/:walletId', (req, res) => {
  const { walletId } = req.params;
  const { limit = 10 } = req.query;
  
  if (!monitoredWallets.has(walletId)) {
    return res.status(404).json({ error: 'Wallet not found' });
  }

  const history = walletHistory.get(walletId) || [];
  const changes = [];

  for (let i = 1; i < history.length && changes.length < limit; i++) {
    const currentChanges = detectChanges(history[i-1], history[i]);
    if (currentChanges.length > 0) {
      changes.push({
        timestamp: history[i].timestamp,
        changes: currentChanges
      });
    }
  }

  res.json({ changes });
});

// Supported protocols and networks
app.get('/api/supported-networks', (req, res) => {
  res.json({
    protocols: {
      ethereum: ['mainnet', 'sepolia'],
      polygon: ['mainnet', 'amoy'],
      arbitrum: ['mainnet', 'sepolia'],
      base: ['mainnet', 'sepolia'],
      optimism: ['mainnet', 'sepolia'],
      avalanche: ['mainnet', 'fuji'],
      kaia: ['mainnet', 'kairos'],
      luniverse: ['mainnet'],
      chiliz: ['mainnet'],
      tron: ['mainnet'],
      bitcoin: ['mainnet'],
      dogecoin: ['mainnet'],
      xrpl: ['mainnet']
    }
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    monitoredWallets: monitoredWallets.size
  });
});

// Background monitoring task (runs every 5 minutes)
cron.schedule('*/5 * * * *', async () => {
  console.log('Running background wallet monitoring...');
  
  for (const [walletId, wallet] of monitoredWallets) {
    if (!wallet.isActive) continue;
    
    try {
      const newSnapshot = await getWalletSnapshot(wallet.protocol, wallet.network, wallet.address);
      const changes = detectChanges(wallet.currentSnapshot, newSnapshot);
      
      if (changes.length > 0) {
        console.log(`Changes detected for wallet ${walletId}:`, changes);
        
        // Update wallet data
        wallet.currentSnapshot = newSnapshot;
        wallet.lastChecked = new Date().toISOString();
        monitoredWallets.set(walletId, wallet);
        
        // Add to history
        walletHistory.get(walletId).push(newSnapshot);
        
        // Keep only last 100 snapshots
        const history = walletHistory.get(walletId);
        if (history.length > 100) {
          history.splice(0, history.length - 100);
        }
      }
    } catch (error) {
      console.error(`Error monitoring wallet ${walletId}:`, error.message);
    }
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Wallet Monitor Backend running on port ${PORT}`);
  console.log(`Make sure to set NODIT_API_KEY environment variable`);
});

module.exports = app;