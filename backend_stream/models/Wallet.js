import { Schema, model } from 'mongoose';

const walletSchema = new Schema({
  address: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    match: /^0x[a-fA-F0-9]{40}$/
  },
  chains: [{
    type: String,
    // enum: ['ethereum', 'polygon', 'bsc', 'arbitrum', 'optimism', 'avalanche']
  }],
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  settings: {
    alertThresholds: {
      highValueUSD: { type: Number, default: 10000 },
      frequencyPerHour: { type: Number, default: 10 },
      riskScoreThreshold: { type: Number, default: 7 }
    },
    notifications: {
      email: { type: Boolean, default: true },
      browser: { type: Boolean, default: true },
      webhook: String
    },
    monitoringEnabled: { type: Boolean, default: true }
  },
  isActive: { type: Boolean, default: true },
  lastActivity: Date,
  totalTransactions: { type: Number, default: 0 },
  totalValueUSD: { type: Number, default: 0 }
}, {
  timestamps: true
});

// Indexes for optimal performance
walletSchema.index({ address: 1 });
walletSchema.index({ userId: 1 });
walletSchema.index({ chains: 1 });
walletSchema.index({ isActive: 1 });

export default model('Wallet', walletSchema);