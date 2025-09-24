import { io } from 'socket.io-client';

// Get API URL from environment or use default
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001';

// Create socket connection with proper configuration
const socket = io(API_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
  timeout: 20000,
  transports: ['websocket', 'polling']
});

// Connection event handlers
socket.on('connect', () => {
  console.log('✅ Connected to server:', socket.id);
});

socket.on('disconnect', (reason) => {
  console.log('❌ Disconnected from server:', reason);
});

socket.on('connect_error', (error) => {
  console.error('❌ Connection error:', error);
});

socket.on('reconnect', (attemptNumber) => {
  console.log('🔄 Reconnected after', attemptNumber, 'attempts');
});

socket.on('reconnect_error', (error) => {
  console.error('❌ Reconnection failed:', error);
});

export default socket;
