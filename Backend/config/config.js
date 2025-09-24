require('dotenv').config();

const config = {
  // Server Configuration
  PORT: process.env.PORT || 4001,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Database Configuration
  MONGODB_URI: process.env.MONGODB_URI || process.env.uri,
  
  // JWT Configuration
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
  
  // CORS Configuration
  CORS_ORIGINS: process.env.CORS_ORIGINS ? 
    process.env.CORS_ORIGINS.split(',') : 
    ['http://localhost:5173', 'https://heart-connect.netlify.app'],
  
  // Socket.IO Configuration
  SOCKET_CORS_ORIGINS: process.env.SOCKET_CORS_ORIGINS ? 
    process.env.SOCKET_CORS_ORIGINS.split(',') : 
    ['http://localhost:5173', 'https://heart-connect.netlify.app'],
  
  // Security Configuration
  BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS) || 12,
  
  // Rate Limiting
  RATE_LIMIT_WINDOW: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX) || 100, // requests per window
  
  // Validation
  validateConfig() {
    const required = ['JWT_SECRET', 'MONGODB_URI'];
    const missing = required.filter(key => !this[key] && !process.env[key]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
    
    if (this.JWT_SECRET && this.JWT_SECRET.length < 32) {
      console.warn(' JWT_SECRET should be at least 32 characters long for security');
    }
  }
};

// Validate configuration on load
config.validateConfig();

module.exports = config;
