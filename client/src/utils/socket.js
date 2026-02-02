import { io } from 'socket.io-client';

// Get API URL from environment or use default
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001';

// Extract base URL for socket connection (remove protocol and path)
let socketUrl;
try {
  const url = new URL(API_URL);
  socketUrl = `${url.protocol}//${url.hostname}:${url.port || '4001'}`;
} catch (e) {
  // If API_URL is not a valid URL, assume it's just the base URL
  socketUrl = API_URL.startsWith('http') ? API_URL : 'http://localhost:4001';
}

// Create socket connection with proper configuration
const socket = io(socketUrl, {
  autoConnect: true,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
  timeout: 20000,
  transports: ['websocket', 'polling']
});

// Connection event handlers
socket.on('connect', () => {
  console.log('✅ Connected to server:', socket.id);
  // Emit a test event to verify connection
  socket.emit('ping', { timestamp: Date.now() });
});

socket.on('disconnect', (reason) => {
  console.log('❌ Disconnected from server:', reason);
});

socket.on('connect_error', (error) => {
  console.error('❌ Connection error:', error);
  // Try to reconnect manually
  setTimeout(() => {
    if (!socket.connected) {
      console.log('Attempting manual reconnection...');
      socket.connect();
    }
  }, 3000);
});

socket.on('reconnect', (attemptNumber) => {
  console.log('🔄 Reconnected after', attemptNumber, 'attempts');
});

socket.on('reconnect_error', (error) => {
  console.error('❌ Reconnection failed:', error);
});

socket.on('reconnect_failed', () => {
  console.error('❌ Reconnection failed after max attempts');
});

// Handle ping/pong for connection health
socket.on('pong', (data) => {
  console.log('🏓 Pong received:', data);
});

// Global error handler
socket.on('error', (error) => {
  console.error('Socket error:', error);
});

export default socket;
