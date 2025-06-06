import express from 'express';
import walletController from '../controllers/walletControllerNew.js';

const router = express.Router();

// POST /api/wallets/verify - Verify wallet ownership and add to monitoring
router.post('/verify', walletController.verifyAndAddWallet);

// GET /api/wallets/:address/transactions - Get wallet transactions
router.get('/:address/transactions', walletController.getWalletTransactions);

// GET /api/wallets/:address/alerts - Get wallet alerts
router.get('/:address/alerts', walletController.getWalletAlerts);

// DELETE /api/wallets/:address - Remove wallet from monitoring
router.delete('/:address', walletController.removeWallet);

export default router;