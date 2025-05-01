require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const compression = require('compression');
const registerRoutes = require('./routes');

// Create Express app
const app = express();

// Apply middleware
app.use(cors({
  origin: '*', // More permissive for development
  credentials: true,
}));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Register all routes and create HTTP server
const server = registerRoutes(app);

// Start server
const PORT = 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Enhanced server running on port ${PORT}`);
  console.log('Server address:', server.address());
  console.log(`Server is ready at http://localhost:${PORT}`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});
