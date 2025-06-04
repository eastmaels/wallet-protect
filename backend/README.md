# Wallet Monitor Backend

Backend service for monitoring blockchain wallet addresses using Nodit APIs.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy environment variables:
   ```bash
   cp .env.example .env
   ```

3. Add your Nodit API key to `.env` file

4. Start the development server:
   ```bash
   npm run dev
   ```

The server will be available at `http://localhost:3001`

## API Endpoints

- `POST /api/monitor/add` - Add wallet to monitoring
- `GET /api/monitor/wallets` - Get all monitored wallets
- `GET /api/monitor/wallet/:id` - Get specific wallet details
- `POST /api/monitor/refresh/:id` - Refresh wallet data
- `DELETE /api/monitor/remove/:id` - Remove wallet from monitoring
- `GET /api/supported-networks` - Get supported networks
- `GET /api/health` - Health check
