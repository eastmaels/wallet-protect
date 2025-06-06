import Alert from '../models/Alert.js';

class AnalysisService {
  async analyzeTransaction(transaction) {
    const flags = [];
    let score = 0;
    let reasoning = [];

    // High value transfer check
    if (transaction.valueUSD > 50000) {
      flags.push('high_value_transfer');
      score += 3;
      reasoning.push(`High value transfer: $${transaction.valueUSD.toLocaleString()}`);
    }

    // Suspicious contract interaction
    if (await this.isKnownMaliciousContract(transaction.to)) {
      flags.push('suspicious_contract');
      score += 8;
      reasoning.push('Interaction with known malicious contract');
    }

    // Large token approval
    const largeApprovals = transaction.tokenTransfers?.filter(transfer => 
      transfer.value === '115792089237316195423570985008687907853269984665640564039457584007913129639935' // Max uint256
    );
    
    if (largeApprovals?.length > 0) {
      flags.push('large_approval');
      score += 5;
      reasoning.push('Unlimited token approval detected');
    }

    // Check transaction frequency
    const recentTxCount = await this.getRecentTransactionCount(transaction.walletId);
    if (recentTxCount > 15) {
      flags.push('unusual_frequency');
      score += 2;
      reasoning.push(`Unusual activity: ${recentTxCount} transactions in the last hour`);
    }

    // MEV/Sandwich attack detection
    if (await this.detectSandwichAttack(transaction)) {
      flags.push('sandwich_attack');
      score += 6;
      reasoning.push('Potential sandwich attack detected');
    }

    // Calculate confidence based on multiple factors
    const confidence = Math.min(flags.length * 0.2 + (score > 5 ? 0.3 : 0), 1);

    const analysis = {
      score: Math.min(score, 10),
      flags,
      confidence,
      reasoning: reasoning.join('; '),
      checkedAt: new Date()
    };

    // Create alert if high risk
    if (score >= 5) {
      await this.createAlert(transaction, flags, score);
    }

    return analysis;
  }

  async isKnownMaliciousContract(address) {
    // This would check against a database of known malicious contracts
    // For now, return false - implement with your threat intelligence
    return false;
  }

  async getRecentTransactionCount(walletId) {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    return await Transaction.countDocuments({
      walletId,
      createdAt: { $gte: oneHourAgo }
    });
  }

  async detectSandwichAttack(transaction) {
    // Simplified sandwich attack detection
    // Look for transactions in the same block with similar patterns
    const blockTransactions = await Transaction.find({
      chain: transaction.chain,
      blockNumber: transaction.blockNumber,
      transactionType: 'defi'
    });

    return blockTransactions.length > 3; // Simplified check
  }

  async createAlert(transaction, flags, riskScore) {
    const alertType = this.determineAlertType(flags);
    const severity = this.determineSeverity(riskScore);

    const alert = new Alert({
      walletId: transaction.walletId,
      transactionId: transaction._id,
      alertType,
      severity,
      title: this.generateAlertTitle(alertType, riskScore),
      message: this.generateAlertMessage(transaction, flags),
      metadata: {
        riskScore,
        flags,
        transactionHash: transaction.hash,
        chain: transaction.chain,
        valueUSD: transaction.valueUSD
      }
    });

    await alert.save();
    
    // Trigger real-time notification
    await this.sendRealTimeNotification(alert);
  }

  determineAlertType(flags) {
    if (flags.includes('suspicious_contract')) return 'suspicious_contract';
    if (flags.includes('large_approval')) return 'large_approval';
    if (flags.includes('high_value_transfer')) return 'high_value_transfer';
    if (flags.includes('sandwich_attack')) return 'sandwich_attack';
    return 'unusual_frequency';
  }

  determineSeverity(score) {
    if (score >= 8) return 'CRITICAL';
    if (score >= 6) return 'HIGH';
    if (score >= 4) return 'MEDIUM';
    return 'LOW';
  }

  generateAlertTitle(alertType, riskScore) {
    const titles = {
      'suspicious_contract': '⚠️ Suspicious Contract Interaction',
      'large_approval': '🔓 Large Token Approval Detected',
      'high_value_transfer': '💰 High Value Transaction',
      'sandwich_attack': '🥪 Potential Sandwich Attack',
      'unusual_frequency': '📈 Unusual Transaction Frequency'
    };
    
    return titles[alertType] || '🚨 Security Alert';
  }

  generateAlertMessage(transaction, flags) {
    const messages = [];
    
    if (flags.includes('high_value_transfer')) {
      messages.push(`High value transaction of $${transaction.valueUSD?.toLocaleString() || 'N/A'}`);
    }
    
    if (flags.includes('suspicious_contract')) {
      messages.push('Interaction with potentially malicious contract');
    }
    
    if (flags.includes('large_approval')) {
      messages.push('Unlimited token approval granted');
    }

    return messages.join('. ') + '.';
  }

  async sendRealTimeNotification(alert) {
    // Implement WebSocket notification to frontend
    // This would use Socket.io or similar to push real-time alerts
    console.log(`🚨 ALERT: ${alert.title} for wallet ${alert.walletId}`);
  }
}

export default new AnalysisService();