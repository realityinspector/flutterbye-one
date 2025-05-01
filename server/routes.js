const { createServer } = require('http');
const express = require('express');
const { setupAuth, authenticateJWT } = require('./auth');
const { db } = require('./db');
const { storage } = require('./storage');
const { eq, and, desc, asc } = require('drizzle-orm');
const { globalLeads, userLeads, calls } = require('../shared/db/schema');
const path = require('path');

function registerRoutes(app) {
  // Serve static files from the public directory
  app.use(express.static('public'));
  
  // Health check route
  app.get('/health', (req, res) => {
    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      message: "Walk N Talk CRM API is running"
    });
  });
  
  // API documentation route
  app.get('/api-docs', (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Walk N Talk CRM API Documentation</title>
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
            <h1>Walk N Talk CRM API</h1>
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
              </ul>
            </div>
          </div>
        </body>
      </html>
    `);
  });
  
  // Serve the web app on all routes that aren't covered by API or specific routes
  app.use((req, res, next) => {
    // Skip if it's an API request
    if (req.path.startsWith('/api/')) {
      return next();
    }
    
    // Skip if it's a health check or API docs
    if (req.path === '/health' || req.path === '/api-docs') {
      return next();
    }
    
    // If this is a static file, let the static middleware handle it
    if (req.path.includes('.')) {
      return next();
    }
    
    // For all other routes, serve the index.html
    res.sendFile('index.html', { root: './public' });
  });
  
  // Auth routes
  setupAuth(app);

  // Lead routes
  app.get('/api/leads', authenticateJWT, async (req, res) => {
    try {
      const leads = await db.query.userLeads.findMany({
        where: eq(userLeads.userId, req.user.id),
        with: {
          globalLead: true,
        },
        orderBy: [desc(userLeads.priority)],
      });
      
      res.json({ success: true, data: leads });
    } catch (error) {
      console.error('Error fetching leads:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch leads' });
    }
  });

  app.get('/api/leads/:id', authenticateJWT, async (req, res) => {
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
      
      res.json({ success: true, data: lead });
    } catch (error) {
      console.error('Error fetching lead:', error);
      res.status(500).json({ message: 'Failed to fetch lead' });
    }
  });

  app.post('/api/leads', authenticateJWT, async (req, res) => {
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
      
      res.status(201).json({ success: true, data: createdLead });
    } catch (error) {
      console.error('Error creating lead:', error);
      res.status(500).json({ success: false, message: 'Failed to create lead' });
    }
  });

  app.put('/api/leads/:id', authenticateJWT, async (req, res) => {
    try {
      // Check if lead belongs to user
      const [userLead] = await db.select().from(userLeads).where(
        and(
          eq(userLeads.id, parseInt(req.params.id)),
          eq(userLeads.userId, req.user.id)
        )
      );
      
      if (!userLead) {
        return res.status(404).json({ message: 'Lead not found' });
      }
      
      // Update global lead data if provided
      if (req.body.companyName || req.body.contactName || req.body.phoneNumber) {
        await db.update(globalLeads)
          .set({
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
          })
          .where(eq(globalLeads.id, userLead.globalLeadId));
      }
      
      // Update user lead data
      const [updatedUserLead] = await db.update(userLeads)
        .set({
          status: req.body.status || userLead.status,
          priority: req.body.priority !== undefined ? req.body.priority : userLead.priority,
          notes: req.body.notes !== undefined ? req.body.notes : userLead.notes,
          reminderDate: req.body.reminderDate || userLead.reminderDate,
        })
        .where(eq(userLeads.id, userLead.id))
        .returning();
      
      // Fetch the updated lead with global data
      const [completeLead] = await db.query.userLeads.findMany({
        where: eq(userLeads.id, updatedUserLead.id),
        with: {
          globalLead: true,
        },
      });
      
      res.json({ success: true, data: completeLead });
    } catch (error) {
      console.error('Error updating lead:', error);
      res.status(500).json({ success: false, message: 'Failed to update lead' });
    }
  });

  app.delete('/api/leads/:id', authenticateJWT, async (req, res) => {
    try {
      // Only delete the user lead, keep the global lead
      const result = await db.delete(userLeads)
        .where(
          and(
            eq(userLeads.id, parseInt(req.params.id)),
            eq(userLeads.userId, req.user.id)
          )
        )
        .returning({ id: userLeads.id });
      
      if (result.length === 0) {
        return res.status(404).json({ message: 'Lead not found' });
      }
      
      res.json({ success: true, data: { id: result[0].id, message: 'Lead deleted successfully' } });
    } catch (error) {
      console.error('Error deleting lead:', error);
      res.status(500).json({ success: false, message: 'Failed to delete lead' });
    }
  });

  // Call routes
  app.get('/api/calls', authenticateJWT, async (req, res) => {
    try {
      const calls = await db.query.calls.findMany({
        where: eq(calls.userId, req.user.id),
        orderBy: [desc(calls.callDate)],
      });
      
      res.json({ success: true, data: calls });
    } catch (error) {
      console.error('Error fetching calls:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch calls' });
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
      // Check if lead belongs to user
      const [userLead] = await db.select().from(userLeads).where(
        and(
          eq(userLeads.id, req.body.userLeadId),
          eq(userLeads.userId, req.user.id)
        )
      );
      
      if (!userLead) {
        return res.status(404).json({ message: 'Lead not found' });
      }
      
      // Create call record
      const [call] = await db.insert(calls).values({
        userId: req.user.id,
        userLeadId: req.body.userLeadId,
        callDate: req.body.callDate || new Date().toISOString(),
        duration: req.body.duration,
        outcome: req.body.outcome,
        notes: req.body.notes,
        reminderDate: req.body.reminderDate,
      }).returning();
      
      // Update lead's last contacted timestamp and status if outcome is provided
      if (req.body.outcome) {
        const updates = {
          lastContactedAt: new Date().toISOString(),
        };
        
        // Set status based on outcome
        if (req.body.outcome === 'interested' || req.body.outcome === 'meeting_scheduled') {
          updates.status = 'qualified';
        } else if (req.body.outcome === 'not_interested' || req.body.outcome === 'do_not_call') {
          updates.status = 'unqualified';
        } else {
          updates.status = 'contacted';
        }
        
        // Update reminder date if provided
        if (req.body.reminderDate) {
          updates.reminderDate = req.body.reminderDate;
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

  // Create HTTP server
  const httpServer = createServer(app);
  
  return httpServer;
}

module.exports = registerRoutes;
