/**
 * Main routes handler module
 * Centralizes registration of all API routes
 */

const express = require('express');
const { authenticateJWT } = require('../auth');
const organizationsRoutes = require('./organizations');
const organizationMembersRoutes = require('./organization-members');
const leadsRoutes = require('./leads');
const analytics = require('../analytics');

function registerApiRoutes(app) {
  // Organization routes
  app.use('/api/organizations', organizationsRoutes);
  
  // Organization members routes (mounted under organizations path)
  app.use('/api/organizations', organizationMembersRoutes);
  
  // Leads routes with team sharing capability
  app.use('/api/leads', leadsRoutes);
  
  // Analytics routes
  app.get('/api/analytics/dashboard', authenticateJWT, async (req, res) => {
    try {
      const metrics = await analytics.getDashboardMetrics(req.user.id);
      res.json({ success: true, data: metrics });
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch dashboard metrics' });
    }
  });
  
  app.get('/api/analytics/user-performance', authenticateJWT, async (req, res) => {
    // Only admin can access all user performance metrics
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    
    try {
      const metrics = await analytics.getUserPerformanceMetrics();
      res.json({ success: true, data: metrics });
    } catch (error) {
      console.error('Error fetching user performance metrics:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch user performance metrics' });
    }
  });
  
  app.get('/api/analytics/call-outcomes', authenticateJWT, async (req, res) => {
    try {
      const metrics = await analytics.getCallOutcomesDistribution(req.user.id);
      res.json({ success: true, data: metrics });
    } catch (error) {
      console.error('Error fetching call outcomes:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch call outcomes' });
    }
  });
}

module.exports = { registerApiRoutes };