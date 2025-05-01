require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const registerRoutes = require('./routes');
const { checkAndSeedForNewUsers } = require('../scripts/seed-demo-data');

// Create Express app
const app = express();

// Apply middleware
app.use(cors({
  origin: true, // Accept all origins in development, properly set in production
  credentials: true, // Allow cookies to be sent with requests
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Register all routes and create HTTP server
const server = registerRoutes(app);

// Start server
const PORT = 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Enhanced server running on port ${PORT}`);
  console.log('Server address:', server.address());
  console.log(`Server is ready at http://localhost:${PORT}`);
  
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
