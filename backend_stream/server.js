import express, { json } from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketIo } from 'socket.io';
import * as dotenv from 'dotenv';
dotenv.config();

// Import database connection
import connectDB from './config/databaseConfig.js';

// Import services
import noditService from './services/NoditService.js';

// Import routes
import walletRoutes from './routes/walletRoutes.js';
import alertRoutes from './routes/alertRoutes.js';

const app = express();
const server = createServer(app);
const io = new SocketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(json());

// Make io available to routes
app.set('io', io);

// Routes
app.use('/api/wallets', walletRoutes);
app.use('/api/alerts', alertRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Initialize Nodit service
    await noditService.connect();
    
    // Start HTTP server
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
    
    // Handle Socket.IO connections
    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);
      
      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  server.close(() => {
    process.exit(0);
  });
});