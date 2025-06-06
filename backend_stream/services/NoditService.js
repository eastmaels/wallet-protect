import { io } from 'socket.io-client';
import Transaction from '../models/Transaction.js';
import analysisService from './AnalysisService.js';

class NoditService {
  constructor() {
    this.socket = null;
    this.subscriptions = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  async connect() {
    try {
      const options = {
        rejectUnauthorized: false,
        transports: ["websocket", "polling"],
        path: "/v1/websocket/",
        auth: {
            apiKey: process.env.NODIT_API_KEY,
        },
        query: {
            protocol: "ethereum",
            network: "mainnet",
        },
      };

      this.socket = io(process.env.NODIT_WEBSOCKET_URL || 'wss://web3.nodit.io/v1/websocket', options);

      this.socket.on('connect', () => {
        console.log('Connected to Nodit WebSocket');
        this.reconnectAttempts = 0;
        this.resubscribeAll();
      });

      this.socket.on('transaction', async (data) => {
        try {
          await this.processTransaction(data);
        } catch (error) {
          console.error('Error processing transaction:', error);
        }
      });

      this.socket.on('token_transfer', async (data) => {
        try {
          await this.processTokenTransfer(data);
        } catch (error) {
          console.error('Error processing token transfer:', error);
        }
      });

      this.socket.on('nft_transfer', async (data) => {
        try {
          await this.processNFTTransfer(data);
        } catch (error) {
          console.error('Error processing NFT transfer:', error);
        }
      });

      this.socket.on('disconnect', () => {
        console.log('Nodit WebSocket connection closed');
        this.scheduleReconnect();
      });

      this.socket.on('connect_error', (error) => {
        console.error('Nodit WebSocket error:', error);
      });

    } catch (error) {
      console.error('Failed to connect to Nodit:', error);
      this.scheduleReconnect();
    }
  }

  async subscribeToWallet(walletAddress, chains) {
    const subscription = {
      address: walletAddress.toLowerCase(),
      chains: chains,
      events: ['transaction', 'token_transfer', 'contract_interaction', 'nft_transfer']
    };

    if (this.socket?.connected) {
      this.socket.emit('subscribe', subscription);
      this.subscriptions.set(walletAddress, { chains, subscription });
      console.log(`Subscribed to wallet: ${walletAddress} on chains: ${chains.join(', ')}`);
    } else {
      // Store subscription for when connection is ready
      this.subscriptions.set(walletAddress, { chains, subscription });
    }
  }

  async unsubscribeFromWallet(walletAddress) {
    const unsubscription = {
      address: walletAddress.toLowerCase()
    };

    if (this.socket?.connected) {
      this.socket.emit('unsubscribe', unsubscription);
    }
    
    this.subscriptions.delete(walletAddress);
    console.log(`Unsubscribed from wallet: ${walletAddress}`);
  }

  async processTransaction(txData) {
    try {
      // Find the wallet this transaction belongs to
      const Wallet = require('../models/Wallet').default;
      const wallet = await Wallet.findOne({
        address: { $in: [txData.from?.toLowerCase(), txData.to?.toLowerCase()] }
      });

      if (!wallet) return;

      // Check if transaction already exists
      const existingTx = await Transaction.findOne({ hash: txData.hash });
      if (existingTx) return;

      // Create transaction record
      const transaction = new Transaction({
        walletId: wallet._id,
        hash: txData.hash,
        chain: txData.chain,
        blockNumber: txData.blockNumber,
        blockTimestamp: new Date(txData.timestamp * 1000),
        from: txData.from?.toLowerCase(),
        to: txData.to?.toLowerCase(),
        value: txData.value,
        valueUSD: txData.valueUSD || 0,
        gasUsed: txData.gasUsed,
        gasPrice: txData.gasPrice,
        gasFeeUSD: txData.gasFeeUSD || 0,
        transactionType: this.determineTransactionType(txData),
        contractAddresses: txData.contractAddresses || [],
        methodName: txData.methodName,
        tokenTransfers: txData.tokenTransfers || [],
        nftTransfers: txData.nftTransfers || []
      });

      await transaction.save();

      // Perform risk analysis
      const analysisResult = await analysisService.analyzeTransaction(transaction);
      
      // Update transaction with analysis
      transaction.riskAnalysis = analysisResult;
      await transaction.save();

      // Update wallet statistics
      await this.updateWalletStats(wallet._id, transaction);

      console.log(`Processed transaction: ${txData.hash} for wallet: ${wallet.address}`);

    } catch (error) {
      console.error('Error processing transaction:', error);
    }
  }

  determineTransactionType(txData) {
    if (txData.tokenTransfers?.length > 0) return 'defi';
    if (txData.nftTransfers?.length > 0) return 'nft';
    if (txData.to && txData.methodName) return 'contract_interaction';
    if (txData.value && txData.value !== '0') return 'transfer';
    return 'unknown';
  }

  async updateWalletStats(walletId, transaction) {
    await Wallet.findByIdAndUpdate(walletId, {
      $inc: {
        totalTransactions: 1,
        totalValueUSD: transaction.valueUSD || 0
      },
      $set: {
        lastActivity: new Date()
      }
    });
  }

  resubscribeAll() {
    for (const [address, { chains, subscription }] of this.subscriptions) {
      this.socket.emit('subscribe', subscription);
    }
  }

  scheduleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      const delay = Math.pow(2, this.reconnectAttempts) * 1000; // Exponential backoff
      setTimeout(() => {
        this.reconnectAttempts++;
        this.connect();
      }, delay);
    }
  }
}

export default new NoditService();