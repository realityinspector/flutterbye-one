// Enhanced server implementation
const express = require('express');
const path = require('path');
const session = require('express-session');

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

// Configure session middleware
app.use(session({
  secret: 'walkntalk-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    maxAge: 3600000, // 1 hour
    secure: false // set to true in production with HTTPS
  }
}));

// Serve static content
app.use(express.static(path.join(__dirname, '../public')));

// Authentication middleware
const requireAuth = (req, res, next) => {
  if (!req.session.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }
  next();
};

// Basic health check
app.get('/health', (req, res) => {
  console.log('Health check request received');
  res.send('Server is healthy');
});

// Main routes
app.get('/', (req, res) => {
  console.log('Landing page request');
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Middleware to check if user is authenticated for dashboard
const checkDashboardAccess = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/');
  }
  next();
};

app.get('/dashboard', checkDashboardAccess, (req, res) => {
  console.log('Dashboard page request');
  res.sendFile(path.join(__dirname, '../public/dashboard.html'));
});

// API login route
app.post('/api/login', (req, res) => {
  console.log('Login attempt', req.body);
  const { email, password } = req.body;
  
  // Simple validation
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required'
    });
  }
  
  // In a real app, validate credentials against database
  // For demo purposes, any email/password combination is accepted
  const user = {
    id: 1,
    name: email.split('@')[0], // Extract name from email for demo
    email: email,
    role: 'user'
  };
  
  // Store user in session
  req.session.user = user;
  
  res.json({
    success: true,
    user: user
  });
});

// API logout route
app.post('/api/logout', (req, res) => {
  console.log('Logout attempt');
  
  // Clear session
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Logout failed'
      });
    }
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  });
});

// API register route
app.post('/api/register', (req, res) => {
  console.log('Registration attempt', req.body);
  const { name, email, password } = req.body;
  
  // Simple validation
  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Name, email and password are required'
    });
  }
  
  // In a real app, this would create a user in the database
  // For demo purposes, we'll create a user object
  const user = {
    id: 1,
    name: name,
    email: email,
    role: 'user'
  };
  
  // Store user in session
  req.session.user = user;
  
  res.json({
    success: true,
    user: user
  });
});

// API user route
app.get('/api/user', (req, res) => {
  console.log('User profile request');
  
  if (!req.session.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authenticated'
    });
  }
  
  res.json({
    success: true,
    user: req.session.user
  });
});

// API leads route
app.get('/api/leads', requireAuth, (req, res) => {
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
      priority: 5,
      notes: 'Interested in premium plan'
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
      priority: 3,
      notes: 'Follow up next week'
    }
  ]);
});

// API calls route
app.get('/api/calls', requireAuth, (req, res) => {
  console.log('Calls request');
  
  res.json([
    {
      id: 1,
      userId: 1,
      leadId: 1,
      callDate: new Date().toISOString(),
      duration: 300,
      outcome: 'interested',
      notes: 'Customer showed interest in our basic package'
    },
    {
      id: 2,
      userId: 1,
      leadId: 2,
      callDate: new Date(Date.now() - 86400000).toISOString(),
      duration: 180,
      outcome: 'callback',
      notes: 'Need to call back next week to discuss pricing'
    }
  ]);
});

// Start server
const PORT = 5000;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Enhanced server running on port ${PORT}`);
  console.log(`Server address: ${JSON.stringify(server.address())}`);
});

// Handle errors
server.on('error', (error) => {
  console.error('Server error:', error);
});

