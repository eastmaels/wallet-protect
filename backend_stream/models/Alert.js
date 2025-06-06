import { Schema, model } from 'mongoose';

const alertSchema = new Schema({
    walletId: {
      type: Schema.Types.ObjectId,
      ref: 'Wallet',
      required: true
    },
    transactionId: {
      type: Schema.Types.ObjectId,
      ref: 'Transaction'
    },
    alertType: {
      type: String,
      required: true,
      enum: [
        'high_value_transfer',
        'suspicious_contract',
        'unusual_frequency',
        'potential_scam',
        'large_approval',
        'draining_pattern',
        'sandwich_attack',
        'flash_loan',
        'mixer_interaction'
      ]
    },
    severity: {
      type: String,
      required: true,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
    },
    title: String,
    message: String,
    metadata: Schema.Types.Mixed,
    isRead: { type: Boolean, default: false },
    isResolved: { type: Boolean, default: false },
    resolvedAt: Date,
    actions: [{
      type: {
        type: String,
        enum: ['dismissed', 'investigated', 'escalated', 'whitelisted']
      },
      timestamp: { type: Date, default: Date.now },
      note: String
    }]
  }, {
    timestamps: true
  });
  
  alertSchema.index({ walletId: 1, createdAt: -1 });
  alertSchema.index({ severity: 1 });
  alertSchema.index({ alertType: 1 });
  alertSchema.index({ isRead: 1 });
  
  export default model('Alert', alertSchema);