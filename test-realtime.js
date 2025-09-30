// Simple test script to verify real-time functionality
// Run this after starting both servers

const io = require('socket.io-client');

const API_URL = 'http://localhost:4001';
const socket = io(API_URL);

console.log('🧪 Testing Real-Time Features...\n');

// Test connection
socket.on('connect', () => {
  console.log('✅ Connected to server:', socket.id);
  
  // Test posting a feeling
  console.log('📝 Testing feeling post...');
  socket.emit('newFeeling', {
    text: 'Test feeling from script',
    author: 'TestUser',
    authorRole: 'child'
  });
});

// Test receiving feelings
socket.on('receiveFeeling', (feeling) => {
  console.log('📨 Received feeling:', feeling.text);
  console.log('   Author:', feeling.author);
  console.log('   Likes:', feeling.likesCount);
});

// Test like functionality
socket.on('likeUpdated', (data) => {
  console.log('❤️ Like updated:', data);
});

// Test comment functionality
socket.on('commentAdded', (data) => {
  console.log('💬 Comment added:', data);
});

// Test error handling
socket.on('error', (error) => {
  console.error('❌ Socket error:', error);
});

// Test disconnect
socket.on('disconnect', () => {
  console.log('❌ Disconnected from server');
});

// Test like after 2 seconds
setTimeout(() => {
  console.log('❤️ Testing like functionality...');
  socket.emit('toggleLike', {
    feelingId: 'test-id', // This will fail but tests the socket
    userId: 'test-user',
    userRole: 'child'
  });
}, 2000);

// Test comment after 3 seconds
setTimeout(() => {
  console.log('💬 Testing comment functionality...');
  socket.emit('newComment', {
    feelingId: 'test-id', // This will fail but tests the socket
    text: 'Test comment',
    author: 'TestUser',
    authorRole: 'child'
  });
}, 3000);

// Close connection after 5 seconds
setTimeout(() => {
  console.log('\n🏁 Test completed. Closing connection...');
  socket.disconnect();
  process.exit(0);
}, 5000);

console.log('⏳ Running tests for 5 seconds...');
console.log('   Make sure both servers are running!');
console.log('   Backend: http://localhost:4001');
console.log('   Frontend: http://localhost:5173\n');
