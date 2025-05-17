require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const registerRoutes = require('./routes');
const { checkAndSeedForNewUsers } = require('../scripts/seed-demo-data');
const config = require('./config');

// Create Express app
const app = express();

// Apply middleware
app.use(cors({
  origin: true, // Accept all origins in development, properly set in production
  credentials: true, // Allow cookies to be sent with requests
}));
app.use(express.json())

// API Response Debugging
app.use((req, res, next) => {
  const originalJson = res.json;
  const originalSend = res.send;
  
  // Override json method to log and validate responses
  res.json = function(data) {
    try {
      // Ensure the data can be properly stringified
      const jsonString = JSON.stringify(data);
      // Log only for dashboard or problematic routes
      if (req.path.includes('dashboard') || req.path.includes('check')) {
        console.log(`API Response to ${req.method} ${req.path}: Valid JSON sent, content length ${jsonString.length}`);
      }
      return originalJson.call(this, data);
    } catch (error) {
      console.error(`ERROR: Invalid JSON response for ${req.method} ${req.path}: ${error.message}`);
      // Send error instead of invalid JSON to prevent client-side parser errors
      return originalJson.call(this, { error: 'Server Error', message: 'Invalid JSON response generated' });
    }
  };
  
  // Override send method to check for JSON strings
  res.send = function(data) {
    // Only check for strings that might be JSON
    if (typeof data === 'string' && (data.startsWith('{') || data.startsWith('['))) {
      try {
        // Try to parse it to ensure it's valid JSON
        JSON.parse(data);
      } catch (error) {
        console.error(`ERROR: Invalid JSON string sent for ${req.method} ${req.path}: ${error.message}`);
        // Return valid JSON error instead
        return originalJson.call(this, { error: 'Server Error', message: 'Invalid JSON string generated' });
      }
    }
    return originalSend.call(this, data);
  };
  
  next();
});

;
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '../public')));
console.log(`Serving static files from: ${path.join(__dirname, '../public')}`);


// Register all routes and create HTTP server
const server = registerRoutes(app);

// Start server
const { PORT } = config;
const port = PORT || 5000;
server.listen(port, '0.0.0.0', () => {
  console.log(`Enhanced server running on port ${port}`);
  console.log('Server address:', server.address());
  console.log(`Server is ready at http://0.0.0.0:${port}`);
  
  // Check for new users and seed demo data
  // This runs after the server has started to avoid blocking startup
  setTimeout(() => {
    checkAndSeedForNewUsers()
      .then(() => console.log('Completed check for new users to seed with demo data'))
      .catch(error => console.error('Error checking for users to seed:', error));
  }, 5000); // Wait 5 seconds after server startup
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});
