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

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static content
app.use(express.static(path.join(__dirname, '../public')));

// Basic health check
app.get('/health', (req, res) => {
  console.log('Health check request received');
  res.send('Server is healthy');
});

// API login route - simplified
app.post('/api/login', (req, res) => {
  console.log('Login attempt');
  res.json({ 
    success: true,
    user: {
      id: 1,
      name: 'Demo User',
      email: 'user@example.com',
      role: 'user'
    }
  });
});

// API user route - simplified
app.get('/api/user', (req, res) => {
  console.log('User profile request');
  res.json({
    success: true,
    user: {
      id: 1,
      name: 'Demo User',
      email: 'user@example.com',
      role: 'user'
    }
  });
});

// API leads route - simplified
app.get('/api/leads', (req, res) => {
  console.log('Leads request');
  res.json([
    {
      id: 1,
      userId: 1,
      globalLead: {
        id: 101,
        companyName: 'Acme Corp',
        contactName: 'John Doe',
        phoneNumber: '555-1234',
        email: 'john@acme.com',
        industry: 'Technology'
      },
      status: 'new',
      priority: 5
    },
    {
      id: 2,
      userId: 1,
      globalLead: {
        id: 102,
        companyName: 'Widget Inc',
        contactName: 'Jane Smith',
        phoneNumber: '555-5678',
        email: 'jane@widget.com',
        industry: 'Manufacturing'
      },
      status: 'contacted',
      priority: 3
    }
  ]);
});

// API calls route - simplified
app.get('/api/calls', (req, res) => {
  console.log('Calls request');
  res.json([
    {
      id: 1,
      userId: 1,
      leadId: 1,
      callDate: new Date().toISOString(),
      duration: 300,
      outcome: 'interested'
    },
    {
      id: 2,
      userId: 1,
      leadId: 2,
      callDate: new Date(Date.now() - 86400000).toISOString(),
      duration: 180,
      outcome: 'callback'
    }
  ]);
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

