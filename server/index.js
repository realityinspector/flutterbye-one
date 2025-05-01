require('dotenv').config();
const express = require('express');
const path = require('path');
const http = require('http');
const cors = require('cors');
const compression = require('compression');
const { setupAuth } = require('./auth');
const { db } = require('./db');
const { storage } = require('./storage');
const { eq, and, desc, asc } = require('drizzle-orm');
const { globalLeads, userLeads, calls } = require('../shared/schema');

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

// Serve static files from the public directory
app.use(express.static('public'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    message: "Walk N Talk CRM API is running"
  });
});

// API Routes
// ===========

// Set up authentication
setupAuth(app);

// Lead routes
app.get('/api/leads', async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  
  try {
    const leads = await db.query.userLeads.findMany({
      where: eq(userLeads.userId, req.user.id),
      with: {
        globalLead: true,
      },
      orderBy: [desc(userLeads.priority)],
    });
    
    res.json(leads);
  } catch (error) {
    console.error('Error fetching leads:', error);
    res.status(500).json({ message: 'Failed to fetch leads' });
  }
});

app.get('/api/leads/:id', async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  
  try {
    const [lead] = await db.query.userLeads.findMany({
      where: and(
        eq(userLeads.id, parseInt(req.params.id)),
        eq(userLeads.userId, req.user.id)
      ),
      with: {
        globalLead: true,
      },
    });
    
    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }
    
    res.json(lead);
  } catch (error) {
    console.error('Error fetching lead:', error);
    res.status(500).json({ message: 'Failed to fetch lead' });
  }
});

app.post('/api/leads', async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  
  try {
    // Create a global lead record
    const [globalLead] = await db.insert(globalLeads).values({
      companyName: req.body.companyName,
      contactName: req.body.contactName,
      phoneNumber: req.body.phoneNumber,
      email: req.body.email,
      address: req.body.address,
      city: req.body.city,
      state: req.body.state,
      zipCode: req.body.zipCode,
      industry: req.body.industry,
      website: req.body.website,
    }).returning();
    
    // Create a user-specific lead record
    const [userLead] = await db.insert(userLeads).values({
      userId: req.user.id,
      globalLeadId: globalLead.id,
      status: 'new',
      priority: 5, // Default medium priority
      notes: req.body.notes,
    }).returning();
    
    // Return the combined lead data
    const createdLead = {
      ...userLead,
      globalLead,
    };
    
    res.status(201).json(createdLead);
  } catch (error) {
    console.error('Error creating lead:', error);
    res.status(500).json({ message: 'Failed to create lead' });
  }
});

// Call routes
app.get('/api/calls', async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  
  try {
    const calls = await db.query.calls.findMany({
      where: eq(calls.userId, req.user.id),
      orderBy: [desc(calls.callDate)],
    });
    
    res.json(calls);
  } catch (error) {
    console.error('Error fetching calls:', error);
    res.status(500).json({ message: 'Failed to fetch calls' });
  }
});

// User routes (in addition to auth routes)
app.put('/api/user', async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  
  try {
    // Update user in database
    const updatedUser = await storage.updateUser(req.user.id, req.body);
    
    // Update session user
    req.user = updatedUser;
    
    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Failed to update user' });
  }
});

// Default route to serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// API 404 handler
app.all('/api/*', (req, res) => {
  res.status(404).json({ message: 'API endpoint not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Server error',
    message: process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred' 
      : err.message,
  });
});

// Start server
const PORT = 5000;
const server = http.createServer(app);
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});
