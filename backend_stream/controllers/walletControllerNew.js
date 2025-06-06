import Wallet from '../models/Wallet.js';
import NoditService from '../services/NoditService.js';
import { ethers } from 'ethers';

class WalletController {
  async verifyAndAddWallet(req, res) {
    console.log('verifyAndAddWallet')
    try {
      const { address, signature, message, chains } = req.body;

      // Verify the signature using ethers v6
      const recoveredAddress = ethers.verifyMessage(message, signature);
      console.log('recoveredAddress', recoveredAddress)
      
      if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
        return res.status(400).json({ error: 'Invalid signature' });
      }

      // Check if wallet already exists
      let wallet = await Wallet.findOne({ address: address.toLowerCase() });
      
      if (wallet) {
        // Update existing wallet
        wallet.chains = [...new Set([...wallet.chains, ...chains])];
        wallet.isActive = true;
        await wallet.save();
      } else {
        // Create new wallet
        wallet = new Wallet({
          address: address.toLowerCase(),
          chains,
          userId: req.user?.id // If you have user authentication
        });
        await wallet.save();
      }

      // Subscribe to Nodit monitoring
      await NoditService.subscribeToWallet(address, chains);

      res.json({
        success: true,
        wallet: {
          id: wallet._id,
          address: wallet.address,
          chains: wallet.chains,
          isActive: wallet.isActive
        }
      });

    } catch (error) {
      console.error('Error verifying wallet:', error);
      res.status(500).json({ error: 'Failed to verify wallet' });
    }
  }

  async getWalletTransactions(req, res) {
    try {
      const { address } = req.params;
      const { page = 1, limit = 50, chain, riskLevel } = req.query;

      const wallet = await Wallet.findOne({ address: address.toLowerCase() });
      if (!wallet) {
        return res.status(404).json({ error: 'Wallet not found' });
      }

      const query = { walletId: wallet._id };
      
      if (chain) query.chain = chain;
      if (riskLevel) {
        const riskThresholds = { low: 3, medium: 6, high: 8 };
        query['riskAnalysis.score'] = { $gte: riskThresholds[riskLevel] || 0 };
      }

      const transactions = await Transaction.find(query)
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .lean();

      const totalCount = await Transaction.countDocuments(query);

      res.json({
        transactions,
        pagination: {
          current: page,
          pages: Math.ceil(totalCount / limit),
          total: totalCount
        }
      });

    } catch (error) {
      console.error('Error fetching transactions:', error);
      res.status(500).json({ error: 'Failed to fetch transactions' });
    }
  }

  async getWalletAlerts(req, res) {
    try {
      const { address } = req.params;
      const { unreadOnly = false } = req.query;

      const wallet = await Wallet.findOne({ address: address.toLowerCase() });
      if (!wallet) {
        return res.status(404).json({ error: 'Wallet not found' });
      }

      const query = { walletId: wallet._id };
      if (unreadOnly === 'true') query.isRead = false;

      const alerts = await Alert.find(query)
        .populate('transactionId')
        .sort({ createdAt: -1 })
        .limit(100);

      res.json({ alerts });

    } catch (error) {
      console.error('Error fetching alerts:', error);
      res.status(500).json({ error: 'Failed to fetch alerts' });
    }
  }

  async removeWallet(req, res) {
    try {
      const { address } = req.params;

      const wallet = await Wallet.findOne({ address: address.toLowerCase() });
      if (!wallet) {
        return res.status(404).json({ error: 'Wallet not found' });
      }

      // Unsubscribe from Nodit
      await NoditService.unsubscribeFromWallet(address);

      // Soft delete - keep data but stop monitoring
      wallet.isActive = false;
      await wallet.save();

      res.json({ success: true, message: 'Wallet monitoring stopped' });

    } catch (error) {
      console.error('Error removing wallet:', error);
      res.status(500).json({ error: 'Failed to remove wallet' });
    }
  }
}

export default new WalletController();