/**
 * Fix Dashboard Endpoint
 * 
 * This script fixes the API endpoint URL in the dashboard.html file
 * to use the correct analytics endpoint.
 */

const fs = require('fs');
const path = require('path');

// Path to the dashboard HTML file
const dashboardPath = path.join(__dirname, '../public/dashboard.html');

// Fix the dashboard HTML
console.log('Reading dashboard.html...');
let dashboardHtml = fs.readFileSync(dashboardPath, 'utf8');

// Fix the API endpoint URL
console.log('Fixing API endpoint URL...');
dashboardHtml = dashboardHtml.replace(/\/api\/dashboard/g, '/api/analytics/dashboard');
dashboardHtml = dashboardHtml.replace(/fetchDashboardData\(\)/g, 
  `fetchDashboardData() {
    console.log('Fetching dashboard data from analytics endpoint');
    
    fetch('/api/analytics/dashboard', {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      credentials: 'include'
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(data => {
      console.log('Dashboard data loaded successfully:', data);
      // Process data safely
      displayDashboardData(data);
    })
    .catch(error => {
      console.error('Error loading dashboard data:', error);
      showNotification('Error', 'Failed to load dashboard data. Please try again.', 'error');
    });
  }
  
  function displayDashboardData(data) {
    console.log('Displaying dashboard data');
    // Simple display of basic metrics
    const statsContainer = document.querySelector('.dashboard-stats');
    if (statsContainer) {
      statsContainer.innerHTML = '';
      
      if (data && data.metrics) {
        const metrics = data.metrics;
        
        // Create stat cards
        const createStatCard = (label, value, icon) => {
          const card = document.createElement('div');
          card.className = 'stat-card';
          card.innerHTML = \`
            <div class="stat-icon"><i class="fas fa-\${icon}"></i></div>
            <div class="stat-content">
              <div class="stat-value">\${value}</div>
              <div class="stat-label">\${label}</div>
            </div>
          \`;
          return card;
        };
        
        // Add some sample metrics
        statsContainer.appendChild(createStatCard('Total Leads', metrics.totalLeads || 0, 'users'));
        statsContainer.appendChild(createStatCard('Active Calls', metrics.activeCalls || 0, 'phone'));
        statsContainer.appendChild(createStatCard('Conversion Rate', (metrics.conversionRate || 0) + '%', 'chart-line'));
      } else {
        statsContainer.innerHTML = '<div class="no-data">No dashboard data available</div>';
      }
    }
    
    // Display leads if available
    if (data && data.recentLeads) {
      displayLeads(data.recentLeads);
    }
  }`);

// Also fix calls endpoint
dashboardHtml = dashboardHtml.replace(/\/api\/call/g, '/api/calls');

// Write the fixed content back to the file
fs.writeFileSync(dashboardPath, dashboardHtml);
console.log('Fixed dashboard.html - updated API endpoint URLs');

// Now, let's also ensure the API routes are properly defined
const routesPath = path.join(__dirname, '../server/routes.js');

// Check if the routes file exists
if (fs.existsSync(routesPath)) {
  console.log('Checking routes.js for analytics/dashboard endpoint...');
  const routesContent = fs.readFileSync(routesPath, 'utf8');
  
  // Check if the analytics/dashboard endpoint is missing
  if (!routesContent.includes('/api/analytics/dashboard')) {
    console.log('Adding analytics/dashboard endpoint to routes.js');
    
    // Find a good insertion point - after another API route
    const insertPoint = routesContent.indexOf('app.get(\'/api/leads');
    
    if (insertPoint !== -1) {
      // Prepare the new route
      const analyticsRoute = `

  // Dashboard analytics endpoint
  app.get('/api/analytics/dashboard', authenticateJWT, async (req, res) => {
    try {
      // Get user ID from JWT
      const userId = req.user.id;
      
      // Fetch basic dashboard metrics
      const totalLeads = await db
        .select({ count: count() })
        .from(userLeads)
        .where(eq(userLeads.userId, userId));
      
      const activeCallsCount = await db
        .select({ count: count() })
        .from(calls)
        .where(
          and(
            eq(calls.userId, userId),
            isNull(calls.endTime)
          )
        );
      
      const recentCalls = await db.query.calls.findMany({
        where: eq(calls.userId, userId),
        orderBy: [desc(calls.callDate)],
        limit: 5,
      });
      
      // Get recent leads
      const recentLeads = await db.query.userLeads.findMany({
        where: eq(userLeads.userId, userId),
        with: {
          globalLead: true
        },
        orderBy: [desc(userLeads.createdAt)],
        limit: 5,
      });
      
      // Calculate conversion rate (simplified)
      const convertedLeads = await db
        .select({ count: count() })
        .from(userLeads)
        .where(
          and(
            eq(userLeads.userId, userId),
            eq(userLeads.status, 'converted')
          )
        );
      
      const conversionRate = totalLeads[0].count > 0 
        ? Math.round((convertedLeads[0].count / totalLeads[0].count) * 100) 
        : 0;
      
      // Prepare and send response
      res.json({
        success: true,
        metrics: {
          totalLeads: totalLeads[0].count,
          activeCalls: activeCallsCount[0].count,
          conversionRate: conversionRate,
        },
        recentCalls,
        recentLeads
      });
    } catch (error) {
      console.error('Error fetching dashboard analytics:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error fetching dashboard analytics',
        error: error.message
      });
    }
  });

  // Analytics endpoints for call outcomes
  app.get('/api/analytics/call-outcomes', authenticateJWT, async (req, res) => {
    try {
      // Get user ID from JWT
      const userId = req.user.id;
      
      // Get call outcomes distribution
      const outcomes = await db
        .select({
          outcome: calls.outcome,
          count: count()
        })
        .from(calls)
        .where(eq(calls.userId, userId))
        .groupBy(calls.outcome);
      
      res.json({
        success: true,
        outcomes
      });
    } catch (error) {
      console.error('Error fetching call outcomes:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error fetching call outcomes',
        error: error.message
      });
    }
  });`;
      
      // Insert the new routes
      const updatedRoutesContent = 
        routesContent.substring(0, insertPoint) + 
        analyticsRoute + 
        routesContent.substring(insertPoint);
      
      // Write the updated content back to the file
      fs.writeFileSync(routesPath, updatedRoutesContent);
      console.log('Added analytics endpoints to routes.js');
    } else {
      console.log('Could not find a good insertion point in routes.js');
    }
  } else {
    console.log('The analytics/dashboard endpoint already exists in routes.js');
  }
} else {
  console.log('routes.js file not found');
}

console.log('Dashboard endpoint fix completed');