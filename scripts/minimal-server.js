// Enhanced server implementation
const express = require('express');
const path = require('path');
const jwt = require('jsonwebtoken');

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'walktalk-development-jwt-secret';
const JWT_EXPIRES_IN = '24h'; // 24 hours

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

// JWT token verification function
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    console.error('Token verification error:', error.message);
    return null;
  }
};

// Generate JWT token
const generateToken = (user) => {
  // Don't include sensitive data in the token
  const { password, ...userWithoutPassword } = user;
  return jwt.sign({ user: userWithoutPassword }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

// Authentication middleware
const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: 'Authentication token is required'
    });
  }
  
  const token = authHeader.split(' ')[1]; // Bearer TOKEN
  const decoded = verifyToken(token);
  
  if (!decoded || !decoded.user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
  
  // Set user data in request object
  req.user = decoded.user;
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

// Cookie parsing function to extract JWT from cookie if present
const extractTokenFromCookie = (req) => {
  // If client sends cookie with token
  if (req.headers.cookie) {
    const cookies = req.headers.cookie.split(';').map(c => c.trim());
    const authCookie = cookies.find(c => c.startsWith('auth_token='));
    if (authCookie) {
      return authCookie.split('=')[1];
    }
  }
  return null;
};

// Middleware to check if user is authenticated for dashboard
const checkDashboardAccess = (req, res, next) => {
  // Try to get token from Authorization header or cookie
  const authHeader = req.headers.authorization;
  const token = authHeader ? authHeader.split(' ')[1] : extractTokenFromCookie(req);
  
  if (!token) {
    console.log('No token found, redirecting to login');
    // Add a flag to prevent redirect loops
    return res.redirect('/?auth=required&redirected=true');
  }
  
  const decoded = verifyToken(token);
  if (!decoded || !decoded.user) {
    console.log('Invalid or expired token, redirecting to login');
    return res.redirect('/?auth=required&redirected=true');
  }
  
  // Set user in request
  req.user = decoded.user;
  console.log('User authenticated, proceeding to dashboard');
  next();
};

// Handle SPA routes
const spaRoutes = [
  '/dashboard',
  '/calls',
  '/leads',
  '/leads/new',
  '/settings',
  '/call-queue'
];

spaRoutes.forEach(route => {
  app.get(route, checkDashboardAccess, (req, res) => {
    console.log(`${route} page request`);
    // Send the dashboard HTML instead of index.html for authenticated routes
    res.sendFile(path.join(__dirname, '../public/dashboard.html'));
  });
});

// Special case for new lead form - needs to be before the dynamic route
app.get('/leads/new', checkDashboardAccess, (req, res) => {
  console.log('New lead form page request');
  res.sendFile(path.join(__dirname, '../public/dashboard.html'));
});

// Fallback for dynamic routes with parameters
app.get('/leads/:id', checkDashboardAccess, (req, res) => {
  console.log(`Lead detail page request for ID: ${req.params.id}`);
  res.sendFile(path.join(__dirname, '../public/dashboard.html'));
});

app.get('/calls/:id', checkDashboardAccess, (req, res) => {
  console.log(`Call detail page request for ID: ${req.params.id}`);
  res.sendFile(path.join(__dirname, '../public/dashboard.html'));
});

app.get('/call-in-progress/:leadId', checkDashboardAccess, (req, res) => {
  console.log(`Call in progress for lead ID: ${req.params.leadId}`);
  res.sendFile(path.join(__dirname, '../public/dashboard.html'));
});

app.get('/call-log/:leadId', checkDashboardAccess, (req, res) => {
  console.log(`Call log form for lead ID: ${req.params.leadId}`);
  res.sendFile(path.join(__dirname, '../public/dashboard.html'));
});

// API login route
app.post('/api/login', (req, res) => {
  console.log('Login attempt', req.body);
  const { username, password } = req.body;
  
  // Simple validation
  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: 'Username and password are required'
    });
  }
  
  // In a real app, validate credentials against database
  // For demo purposes, we accept the user we just registered
  const user = {
    id: 1,
    username: username,
    fullName: 'Admin User',
    email: 'admin@example.com',
    role: 'user'
  };
  
  // Generate JWT token
  const token = generateToken(user);
  
  res.json({
    success: true,
    user: user,
    token: token
  });
});

// API logout route
app.post('/api/logout', (req, res) => {
  console.log('Logout attempt');
  
  // With JWT, the actual logout happens client-side by removing the token
  // This is just an endpoint for notifications or token blacklisting if implemented
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

// API register route
app.post('/api/register', (req, res) => {
  console.log('Registration attempt', req.body);
  const { username, fullName, email, password } = req.body;
  
  // Simple validation
  if (!username || !email || !password || !fullName) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields'
    });
  }
  
  // In a real app, this would create a user in the database
  // For demo purposes, we'll create a user object
  const user = {
    id: 1,
    username: username,
    fullName: fullName,
    email: email,
    role: 'user'
  };
  
  // Generate JWT token
  const token = generateToken(user);
  
  res.json({
    success: true,
    user: user,
    token: token
  });
});

// API user route
app.get('/api/user', requireAuth, (req, res) => {
  console.log('User profile request');
  
  // User is already verified via requireAuth middleware
  res.json({
    success: true,
    user: req.user
  });
});

// Token refresh endpoint
app.post('/api/refresh', (req, res) => {
  console.log('Token refresh request');
  
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: 'No token provided'
    });
  }
  
  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);
  
  if (!decoded || !decoded.user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
  
  // Generate a new token with the same user data
  const newToken = generateToken(decoded.user);
  
  res.json({
    success: true,
    token: newToken
  });
});

// Break the redirect loop for dashboard
app.get('/dashboard-check', (req, res) => {
  // Try to get token from Authorization header or cookie
  const authHeader = req.headers.authorization;
  const token = authHeader ? authHeader.split(' ')[1] : extractTokenFromCookie(req);
  
  if (!token) {
    return res.json({ authenticated: false });
  }
  
  const decoded = verifyToken(token);
  if (!decoded || !decoded.user) {
    return res.json({ authenticated: false });
  }
  
  return res.json({ authenticated: true });
});

// API leads route
app.get('/api/leads', requireAuth, (req, res) => {
  console.log('Leads request');
  
  res.json({success: true, data: [
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
  ]});
});

// Create new lead
app.post('/api/leads', requireAuth, (req, res) => {
  console.log('Create lead request', req.body);
  
  // In a real app, validate input and save to database
  // Create a mock global lead
  const globalLead = {
    id: 103, // In real app, this would be assigned by the database
    companyName: req.body.companyName,
    contactName: req.body.contactName,
    phoneNumber: req.body.phoneNumber,
    email: req.body.email,
    address: req.body.address,
    city: req.body.city,
    state: req.body.state,
    zipCode: req.body.zipCode,
    industry: req.body.industry,
    website: req.body.website
  };
  
  // Create a mock user lead
  const userLead = {
    id: 3, // In real app, this would be assigned by the database
    userId: req.user.id,
    globalLeadId: globalLead.id,
    status: req.body.status || 'new',
    priority: req.body.priority || 5,
    notes: req.body.notes || ''
  };
  
  // Create a combined lead object for the response
  const newLead = {
    ...userLead,
    globalLead: globalLead
  };
  
  res.status(201).json({
    success: true,
    data: newLead
  });
});

// Update a lead
app.put('/api/leads/:id', requireAuth, (req, res) => {
  console.log(`Update lead request for ID: ${req.params.id}`, req.body);
  
  // In a real app, validate input and update database
  // For now, return the updated lead with the changes
  const lead = {
    id: parseInt(req.params.id),
    userId: 1,
    globalLead: {
      id: parseInt(req.params.id) + 100,
      companyName: req.body.companyName || 'Updated Company',
      contactName: req.body.contactName || 'Updated Contact',
      phoneNumber: req.body.phoneNumber || '555-9999',
      email: req.body.email || 'updated@example.com',
      industry: req.body.industry || 'Updated Industry'
    },
    status: req.body.status || 'updated',
    priority: req.body.priority || 5,
    notes: req.body.notes || 'Updated notes'
  };
  
  res.json({
    success: true,
    data: lead
  });
});

// Delete a lead
app.delete('/api/leads/:id', requireAuth, (req, res) => {
  console.log(`Delete lead request for ID: ${req.params.id}`);
  
  // In a real app, validate and delete from database
  // For now, return a success response
  res.json({
    success: true,
    data: {
      id: parseInt(req.params.id),
      message: 'Lead deleted successfully'
    }
  });
});

// API leads by ID route
app.get('/api/leads/:id', requireAuth, (req, res) => {
  console.log(`Lead details request for ID: ${req.params.id}`);
  
  // Return a mock lead based on ID
  const leads = {
    '1': {
      success: true,
      data: {
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
      }
    },
    '2': {
      success: true,
      data: {
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
    }
  };
  
  const lead = leads[req.params.id];
  if (!lead) {
    return res.status(404).json({
      success: false,
      message: 'Lead not found'
    });
  }
  
  res.json(lead);
});

// API calls route
app.get('/api/calls', requireAuth, (req, res) => {
  console.log('Calls request');
  
  res.json({success: true, data: [
    {
      id: 1,
      userId: 1,
      userLeadId: 1,  // Changed from leadId to userLeadId to match route expectations
      callDate: new Date().toISOString(),
      duration: 300,
      outcome: 'interested',
      notes: 'Customer showed interest in our basic package'
    },
    {
      id: 2,
      userId: 1,
      userLeadId: 2,  // Changed from leadId to userLeadId to match route expectations
      callDate: new Date(Date.now() - 86400000).toISOString(),
      duration: 180,
      outcome: 'completed',
      notes: 'Need to call back next week to discuss pricing'
    }
  ]});
});

// API calls by lead ID route
app.get('/api/leads/:leadId/calls', requireAuth, (req, res) => {
  console.log(`Calls request for lead ID: ${req.params.leadId}`);
  
  // Mock calls for specific leads
  const leadCalls = {
    '1': [
      {
        id: 1,
        userId: 1,
        userLeadId: 1,
        callDate: new Date().toISOString(),
        duration: 300,
        outcome: 'interested',
        notes: 'Customer showed interest in our basic package'
      },
      {
        id: 3,
        userId: 1,
        userLeadId: 1,
        callDate: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        duration: 240,
        outcome: 'left_message',
        notes: 'Left voicemail introducing our services'
      }
    ],
    '2': [
      {
        id: 2,
        userId: 1,
        userLeadId: 2,
        callDate: new Date(Date.now() - 86400000).toISOString(),
        duration: 180,
        outcome: 'completed',
        notes: 'Need to call back next week to discuss pricing'
      }
    ]
  };
  
  const calls = leadCalls[req.params.leadId] || [];
  res.json({success: true, data: calls});
});

// Create new call record
app.post('/api/calls', requireAuth, (req, res) => {
  console.log('Create call request', req.body);
  
  // In a real app, validate input and save to database
  const newCall = {
    id: 4, // In real app, this would be assigned by the database
    userId: req.user.id,
    userLeadId: req.body.userLeadId,
    callDate: req.body.callDate || new Date().toISOString(),
    duration: req.body.duration || 0,
    outcome: req.body.outcome || 'completed',
    notes: req.body.notes || '',
    reminderDate: req.body.reminderDate
  };
  
  res.status(201).json({
    success: true,
    data: newCall
  });
});

// Start server
const PORT = 5000;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Enhanced server running on port ${PORT}`);
  console.log(`Server address: ${JSON.stringify(server.address())}`);
  console.log(`Server is ready at http://localhost:${PORT}`);
});

// Handle errors
server.on('error', (error) => {
  console.error('Server error:', error);
});

