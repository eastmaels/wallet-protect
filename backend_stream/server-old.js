import io from "socket.io-client";
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const messageId = uuidv4();
const eventType = "BLOCK_PERIOD";
const url = "wss://web3.nodit.io/v1/websocket";

const NODIT_API_KEY = process.env.NODIT_API_KEY; // Set your Nodit API key

const params = {
  description: "Nodit Wallet Protect Socket",
  condition: {
    period: 1,
  },
};

const options = {
  rejectUnauthorized: false,
  transports: ["websocket", "polling"],
  path: "/v1/websocket/",
  auth: {
    apiKey: NODIT_API_KEY,
  },
  query: {
    protocol: "ethereum",
    network: "mainnet",
  },
};

function connectToServer() {
  return new Promise((resolve, reject) => {
    const socket = io(url, options);

    socket.on("connect", () => {
      socket.on("subscription_registered", (message) => {
        console.log("registered", message);
      });

      socket.on("subscription_connected", (message) => {
        console.log("subscription_connected", message);
        
        socket.emit(
          "subscription",
          messageId,
          eventType,
          JSON.stringify(params)
        );
      });

      socket.on("subscription_error", (message) => {
        console.error(`nova_subscription_error: ${message}`);
      });

      socket.on("subscription_event", (message) => {
        console.log("subscription Event : ", message);
      });

      socket.on("disconnect", (message) => {
        console.warn(`disconnect`, message);
      });

      resolve(socket);
    });

    socket.on("connect_error", (error) => {
      console.error(`Socket connection error to : `, error);
      reject(error);
    });
  });
}

connectToServer();