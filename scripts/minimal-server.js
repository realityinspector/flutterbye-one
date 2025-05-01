// Absolute minimum server implementation
const express = require('express');
const path = require('path');

// Create Express app
const app = express();

// Debug request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Serve static content
app.use(express.static(path.join(__dirname, '../public')));

// Basic health check
app.get('/health', (req, res) => {
  console.log('Health check request received');
  res.send('Server is healthy');
});

// Specific route for root path
app.get('/', (req, res) => {
  console.log('Root path request received');
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Specific route for test page
app.get('/test', (req, res) => {
  console.log('Test page request received');
  res.sendFile(path.join(__dirname, '../public/test.html'));
});

// Simple route
app.get('/simple', (req, res) => {
  console.log('Simple page request received');
  res.sendFile(path.join(__dirname, '../public/simple.html'));
});

// Start server
const PORT = 5000;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Super minimal server running on port ${PORT}`);
  console.log(`Server address: ${JSON.stringify(server.address())}`);
});

// Handle errors
server.on('error', (error) => {
  console.error('Server error:', error);
});

