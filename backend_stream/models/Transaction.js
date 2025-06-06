import { Schema, model } from 'mongoose';

const transactionSchema = new Schema({
    walletId: {
      type: Schema.Types.ObjectId,
      ref: 'Wallet',
      required: true
    },
    hash: {
      type: String,
      required: true,
      unique: true
    },
    chain: {
      type: String,
      required: true,
      enum: ['ethereum', 'polygon', 'bsc', 'arbitrum', 'optimism', 'avalanche']
    },
    blockNumber: Number,
    blockTimestamp: Date,
    from: String,
    to: String,
    value: String, // Store as string to avoid precision loss
    valueUSD: Number,
    gasUsed: Number,
    gasPrice: String,
    gasFeeUSD: Number,
    transactionType: {
      type: String,
      enum: ['transfer', 'contract_interaction', 'defi', 'nft', 'bridge', 'unknown']
    },
    contractAddresses: [String],
    methodName: String,
    tokenTransfers: [{
      contractAddress: String,
      from: String,
      to: String,
      value: String,
      symbol: String,
      decimals: Number,
      valueUSD: Number
    }],
    nftTransfers: [{
      contractAddress: String,
      from: String,
      to: String,
      tokenId: String,
      collection: String
    }],
    riskAnalysis: {
      score: { type: Number, min: 0, max: 10, default: 0 },
      flags: [String],
      confidence: { type: Number, min: 0, max: 1 },
      reasoning: String,
      checkedAt: Date
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'failed'],
      default: 'confirmed'
    }
  }, {
    timestamps: true
  });
  
  // Indexes for optimal querying
  transactionSchema.index({ walletId: 1, createdAt: -1 });
  transactionSchema.index({ hash: 1 });
  transactionSchema.index({ chain: 1 });
  transactionSchema.index({ blockNumber: 1 });
  transactionSchema.index({ 'riskAnalysis.score': -1 });
  transactionSchema.index({ transactionType: 1 });
  
  export default model('Transaction', transactionSchema);