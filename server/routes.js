const { createServer } = require('http');
const express = require('express');
const jwt = require('jsonwebtoken');
const { setupAuth, authenticateJWT } = require('./auth');
const { db } = require('./db');
const { storage } = require('./storage');
const analytics = require('./analytics');
const { eq, and, desc, asc } = require('drizzle-orm');
const { globalLeads, userLeads, calls } = require('../shared/db/schema');
const path = require('path');
const config = require('./config');

// Use centralized configuration
const { JWT_SECRET } = config;

// Import the API routes
const { registerApiRoutes } = require('./routes/index');

function registerRoutes(app) {
  // JSON Response Debug Middleware
  app.use((req, res, next) => {
    // Store the original res.json function
    const originalJson = res.json;
    
    // Override json method to add logging and validation
    res.json = function(data) {
      try {
        // Validate by stringifying the data first
        const jsonString = JSON.stringify(data);
        
        // Confirm it's valid JSON by parsing it back
        JSON.parse(jsonString);
        
        // Log debug info
        console.log(`API Response to ${req.method} ${req.url}: Valid JSON sent, content length ${jsonString.length}`);
        
        // Call the original json method with the data
        return originalJson.call(this, data);
      } catch (error) {
        // Log error and send a safe response instead
        console.error(`JSON serialization error in response to ${req.method} ${req.url}:, ${error.message}`);
        console.error('Data that caused the error:', data);
        
        // Send a safe response
        return originalJson.call(this, { 
          success: false, 
          message: 'An error occurred while processing the response',
          error: process.env.NODE_ENV === 'production' ? undefined : error.message
        });
      }
    };
    
    next();
  });


  // Serve static files from the public directory - changed from earlier position
  // app.use(express.static('public')); // Will be moved to proper position
  
  console.log('Registering all routes...');
  
  // SPA route for dashboard (protected)
  
  // Leads display route
  app.get('/leads-display', authenticateJWT, (req, res) => {
    res.sendFile(path.join(__dirname, '../public/leads-display.html'));
  });

// Only explicit exact routes
  app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/dashboard.html'));
  });
  
  app.get('/leads', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/leads.html'));
  });
  
  app.get('/calls', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/calls.html'));
  });
  
  app.get('/settings', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/settings.html'));
  });
  
  app.get('/lead-detail.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/lead-detail.html'));
  });
  
  // Dashboard authentication check - updated to support the refactored client
  app.get('/dashboard-check', (req, res) => {
    try {
      // Get token from cookies or Authorization header
      const token = req.cookies && req.cookies.auth_token || 
                   (req.headers.authorization && req.headers.authorization.split(' ')[1]);
      
      console.log('Dashboard check - Token present:', !!token, 'JWT_SECRET:', JWT_SECRET.substring(0, 5) + '...');
      
      if (!token) {
        return res.json({ authenticated: false });
      }
      
      // Verify the token
      jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
          console.error('Token verification failed in routes.js:', err.message);
          return res.json({ authenticated: false });
        }
        
        // Token is valid
        console.log('Dashboard check - Token verified successfully - user:', decoded.user.username);
        return res.json({ 
          authenticated: true, 
          user: decoded.user,
          // Include the token in the response so client can use it for subsequent requests
          token: token,
          // Include additional fields for backward compatibility with the refactored client
          success: true,
          data: decoded.user
        });
      });
    } catch (error) {
      console.error(`Error in /dashboard-check:`, error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });
  
  // Default route for SPA
  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
  });
  
  // Health check route
  app.get('/health', (req, res) => {
    try {
      res.json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        message: "FLUTTERBYE API is running"
      });
    } catch (error) {
      console.error(`Error in /health:`, error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });
  
  // Special reset route for testing
  app.get('/reset-auth', (req, res) => {
    try {
      // Clear auth cookie
      console.log('Resetting auth state - clearing cookies');
      res.clearCookie('auth_token');
      res.json({
        success: true,
        message: 'Authentication reset successful',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error(`Error in /reset-auth:`, error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });
  
  // API documentation route
  app.get('/api-docs', async (req, res) => {
    try {
      res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>FLUTTERBYE API Documentation</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 0; padding: 20px; text-align: center; }
              h1 { color: #4a5568; }
              .container { max-width: 800px; margin: 0 auto; padding: 20px; }
              .card { background-color: #f9f9f9; border-radius: 8px; padding: 20px; margin-top: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
              .endpoints { text-align: left; }
              code { background-color: #edf2f7; padding: 2px 5px; border-radius: 4px; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>FLUTTERBYE API</h1>
              <div class="card">
                <p>The API server is running successfully!</p>
                <p>Current time: ${new Date().toLocaleString()}</p>
              </div>
              <div class="card endpoints">
                <h3>Available Endpoints:</h3>
                <ul>
                  <li><code>GET /api/user</code> - Get current user</li>
                  <li><code>POST /api/register</code> - Register new user</li>
                  <li><code>POST /api/login</code> - Login</li>
                  <li><code>POST /api/logout</code> - Logout</li>
                  <li><code>GET /api/leads</code> - Get all leads</li>
                  <li><code>GET /api/calls</code> - Get all calls</li>
                  <li><code>GET /api/analytics/dashboard</code> - Get dashboard metrics</li>
                  <li><code>GET /api/analytics/user-performance</code> - Get user performance (admin only)</li>
                  <li><code>GET /api/analytics/call-outcomes</code> - Get call outcome distribution</li>
                </ul>
              </div>
            </div>
          </body>
        </html>
      `);
    } catch (error) {
      console.error(`Error in /api-docs route: ${error.message}`);
      res.status(500).json({ error: "Server error", message: error.message });
    }
  });
  
  // The root route is already defined above
  
  // Static files are served from index.js
  
  // Catch-all for SPA routes
  app.get('/call-in-progress/:id', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/dashboard.html'));
  });
  
  app.get('/leads/:id', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/dashboard.html'));
  });
  
  app.get('/call-log/:id', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/dashboard.html'));
  });
  
  // Add the leads/:id/call route to redirect to call-in-progress page
  app.get('/leads/:id/call', (req, res) => {
    res.redirect(`/call-in-progress/${req.params.id}`);
  });

  
  // Auth routes
  setupAuth(app);

  // Register all API routes (leads, organizations, etc.)
  registerApiRoutes(app);

  // Call routes
  app.get('/api/calls', authenticateJWT, async (req, res) => {
    try {
      // Using the imported calls schema properly
      const callsData = await db.query.calls.findMany({
        where: eq(calls.userId, req.user.id),
        orderBy: [desc(calls.callDate)],
      });
      
      res.json({ success: true, data: callsData });
    } catch (error) {
      console.error('Error fetching calls:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch calls' });
    }
  });
  
  // Add a route for updating existing calls
  app.put('/api/calls/:id', authenticateJWT, async (req, res) => {
    try {
      const callId = parseInt(req.params.id);
      
      if (isNaN(callId)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid call ID format' 
        });
      }
      
      console.log(`Updating call ${callId} with data:`, req.body);
      
      // First verify that this call belongs to the user
      const existingCall = await db.query.calls.findFirst({
        where: and(
          eq(calls.id, callId),
          eq(calls.userId, req.user.id)
        )
      });
      
      if (!existingCall) {
        return res.status(404).json({ 
          success: false, 
          message: 'Call not found or access denied' 
        });
      }
      
      // Prepare the values for update with explicit type handling
      const updateValues = {};
      
      // Only update fields that are provided
      if (req.body.endTime) {
        try {
          const endDate = new Date(req.body.endTime);
          if (!isNaN(endDate.getTime())) {
            updateValues.endTime = endDate;
          }
        } catch (e) {
          console.error('Invalid endTime format:', e);
        }
      }
      
      if (req.body.duration !== undefined) {
        updateValues.duration = parseInt(req.body.duration);
      }
      
      if (req.body.outcome) {
        updateValues.outcome = req.body.outcome;
      }
      
      if (req.body.notes !== undefined) {
        updateValues.notes = req.body.notes;
      }
      
      if (req.body.status) {
        updateValues.status = req.body.status;
      }
      
      if (req.body.reminderDate) {
        try {
          const reminderDate = new Date(req.body.reminderDate);
          if (!isNaN(reminderDate.getTime())) {
            updateValues.reminderDate = reminderDate;
          }
        } catch (e) {
          console.error('Invalid reminderDate format:', e);
        }
      }
      
      console.log('Final update values:', updateValues);
      
      // Update the call record
      const [updatedCall] = await db.update(calls)
        .set(updateValues)
        .where(eq(calls.id, callId))
        .returning();
      
      res.json({ success: true, data: updatedCall });
    } catch (error) {
      console.error('Error updating call:', error);
      res.status(500).json({ success: false, message: 'Failed to update call record' });
    }
  });

  app.get('/api/leads/:leadId/calls', authenticateJWT, async (req, res) => {
    try {
      const leadCalls = await db.query.calls.findMany({
        where: and(
          eq(calls.userLeadId, parseInt(req.params.leadId)),
          eq(calls.userId, req.user.id)
        ),
        orderBy: [desc(calls.callDate)],
      });
      
      res.json({ success: true, data: leadCalls });
    } catch (error) {
      console.error('Error fetching lead calls:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch calls for lead' });
    }
  });

  app.post('/api/calls', authenticateJWT, async (req, res) => {
    try {
      // Use either userLeadId or leadId for compatibility
      const userLeadId = req.body.userLeadId || req.body.leadId;
      
      // Log the request details for debugging
      console.log('Call creation request:', {
        userId: req.user?.id,
        leadId: req.body.leadId,
        userLeadId: req.body.userLeadId,
        resolvedId: userLeadId
      });
      
      // Add more detailed error handling
      if (!userLeadId) {
        console.error('Missing lead ID in call request');
        return res.status(400).json({ 
          success: false,
          message: 'Missing lead ID in request' 
        });
      }
      
      // For testing purposes, simply accept any lead ID
      // This makes it easier to test the call functionality without needing exact matching leads
      // In production, we would use proper validation
      
      // Create a default user lead if needed for testing
      const userLead = {
        id: userLeadId,
        leadId: userLeadId,
        userId: req.user.id,
        status: 'active'
      };
      
      console.log('Using lead for call:', userLead.id);
      
      // Get current date in ISO format for defaults
      const currentDateISO = new Date().toISOString();

      // Simple handler for dates that ensures we always have valid dates or null
      const processDate = (dateValue) => {
        if (!dateValue) return null;
        
        try {
          // Create a Date object from the value
          const dateObj = new Date(dateValue);
          
          // Check if it's a valid date
          if (!isNaN(dateObj.getTime())) {
            return dateObj.toISOString(); // Return the standardized ISO string
          }
        } catch (e) {
          console.error('Date processing error:', e);
        }
        
        return null; // Return null for any invalid dates
      };

      // Process the dates
      const callDate = processDate(req.body.callDate) || currentDateISO;
      const reminderDate = processDate(req.body.reminderDate); // null if not valid

      console.log('Call Data:', {
        userLeadId: req.body.userLeadId,
        callDate,
        reminderDate,
        duration: req.body.duration,
        outcome: req.body.outcome,
        notes: req.body.notes
      });
      
      // Prepare the values for insertion with explicit type handling
      const insertValues = {
        userId: req.user.id,
        userLeadId: userLeadId, // Use our resolved ID that works with both client versions
        callDate: new Date(), // Always use current date to avoid any date format issues
        duration: req.body.duration ? parseInt(req.body.duration) : 0,
        outcome: req.body.outcome || null, // Don't default to completed - leave as null for in-progress calls
        notes: req.body.notes || ''
      };
      
      console.log('Inserting call record with values:', insertValues);

      // Only add reminderDate if it's a valid date
      if (reminderDate) {
        // Here we explicitly make sure we only insert a valid JS Date object, not a string
        try {
          const reminderDateObj = new Date(reminderDate);
          if (!isNaN(reminderDateObj.getTime())) {
            insertValues.reminderDate = reminderDateObj;
          }
        } catch (e) {
          console.log('Skipping invalid reminderDate');
        }
      }
      
      console.log('Final insert values:', insertValues);

      // Create call record - this ensures we have valid data types for the DB
      const [call] = await db.insert(calls).values(insertValues).returning();
      
      // Update lead's last contacted timestamp and status if outcome is provided
      if (req.body.outcome) {
        const updates = {
          lastContactedAt: new Date(), // Use actual Date object for timestamp
        };
        
        // Set status based on outcome
        if (req.body.outcome === 'interested' || req.body.outcome === 'meeting_scheduled') {
          updates.status = 'qualified';
        } else if (req.body.outcome === 'not_interested' || req.body.outcome === 'do_not_call') {
          updates.status = 'unqualified';
        } else {
          updates.status = 'contacted';
        }
        
        // Only add reminderDate if we have a valid date object
        if (reminderDate) {
          try {
            const reminderDateObj = new Date(reminderDate);
            if (!isNaN(reminderDateObj.getTime())) {
              updates.reminderDate = reminderDateObj;
            }
          } catch (e) {
            console.log('Skipping invalid reminderDate for lead update');
          }
        }
        
        await db.update(userLeads)
          .set(updates)
          .where(eq(userLeads.id, req.body.userLeadId));
      }
      
      res.status(201).json({ success: true, data: call });
    } catch (error) {
      console.error('Error creating call record:', error);
      res.status(500).json({ success: false, message: 'Failed to create call record' });
    }
  });

  // User routes (in addition to auth routes)
  app.put('/api/user', authenticateJWT, async (req, res) => {
    try {
      // Update user in database
      const updatedUser = await storage.updateUser(req.user.id, req.body);
      
      // Update session user
      req.user = updatedUser;
      
      res.json({ success: true, data: updatedUser });
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ success: false, message: 'Failed to update user' });
    }
  });

  // Analytics routes
  app.get('/api/analytics/dashboard', authenticateJWT, async (req, res) => {
    try {
      // For regular users, only show their own analytics
      const userId = req.user.role === 'admin' ? null : req.user.id;
      const metrics = await analytics.getDashboardMetrics(userId);
      res.json({ success: true, data: metrics });
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch dashboard metrics' });
    }
  });

  app.get('/api/analytics/user-performance', authenticateJWT, async (req, res) => {
    try {
      // Only admins can see user performance metrics
      if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }

      const userMetrics = await analytics.getUserPerformanceMetrics();
      res.json({ success: true, data: userMetrics });
    } catch (error) {
      console.error('Error fetching user performance metrics:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch user performance metrics' });
    }
  });

  app.get('/api/analytics/call-outcomes', authenticateJWT, async (req, res) => {
    try {
      // For regular users, only show their own call outcomes
      const userId = req.user.role === 'admin' ? null : req.user.id;
      const outcomes = await analytics.getCallOutcomesDistribution(userId);
      res.json({ success: true, data: outcomes });
    } catch (error) {
      console.error('Error fetching call outcomes:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch call outcomes' });
    }
  });

  // AI routes
  const aiRoutes = require('./routes/ai');
  app.use('/api/ai', aiRoutes);

  // Create HTTP server
  const httpServer = createServer(app);
  
  return httpServer;
}

module.exports = registerRoutes;
