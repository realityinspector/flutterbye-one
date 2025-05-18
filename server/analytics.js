/**
 * Analytics service for call metrics
 * Implements super-lean analytics for Task #12
 */

const { pool } = require('./db');

/**
 * Get dashboard analytics metrics
 * @returns {Promise<Object>} Object containing analytics metrics
 */
async function getDashboardMetrics(userId = null) {
  try {
    // Build query conditions based on whether a specific user is requested
    const userCondition = userId ? 'AND c.user_id = $1' : '';
    const queryParams = userId ? [userId] : [];

    // Get call metrics using raw SQL for optimal performance
    const query = `
      SELECT
        COUNT(*) AS total_calls,
        COUNT(CASE WHEN c.call_date >= NOW() - INTERVAL '7 days' THEN 1 END) AS calls_last_week,
        COUNT(CASE WHEN c.call_date >= NOW() - INTERVAL '30 days' THEN 1 END) AS calls_last_month,
        AVG(c.duration) AS avg_duration,
        COUNT(DISTINCT c.user_lead_id) AS unique_leads_called,
        COUNT(CASE WHEN c.reminder_date IS NOT NULL AND c.reminder_date > NOW() THEN 1 END) AS pending_followups
      FROM calls c
      WHERE 1=1 ${userCondition}
    `;

    const result = await pool.query(query, queryParams);
    
    // Format the results
    const metrics = result.rows[0];
    
    // Also get recent leads for this user
    let recentLeads = [];
    if (userId) {
      const leadsQuery = `
        SELECT ul.id, ul.status, ul.priority, ul.is_shared, gl.company_name, gl.contact_name, gl.phone_number
        FROM user_leads ul
        JOIN global_leads gl ON ul.global_lead_id = gl.id
        WHERE ul.user_id = $1
        ORDER BY ul.created_at DESC
        LIMIT 5
      `;
      
      const leadsResult = await pool.query(leadsQuery, [userId]);
      recentLeads = leadsResult.rows.map(row => ({
        id: row.id,
        status: row.status,
        priority: row.priority,
        isShared: row.is_shared,
        companyName: row.company_name,
        contactName: row.contact_name,
        phoneNumber: row.phone_number
      }));
    }
    
    return {
      totalCalls: parseInt(metrics.total_calls) || 0,
      callsLastWeek: parseInt(metrics.calls_last_week) || 0,
      callsLastMonth: parseInt(metrics.calls_last_month) || 0,
      avgDuration: Math.round(parseFloat(metrics.avg_duration) || 0),
      uniqueLeadsCalled: parseInt(metrics.unique_leads_called) || 0,
      pendingFollowups: parseInt(metrics.pending_followups) || 0,
      recentLeads: recentLeads
    };
  } catch (error) {
    console.error('Error getting dashboard metrics:', error);
    throw error;
  }
}

/**
 * Get user performance metrics
 * @returns {Promise<Array>} Array of user performance metrics
 */
async function getUserPerformanceMetrics() {
  try {
    const query = `
      SELECT
        u.id AS user_id,
        u.username,
        u.full_name,
        COUNT(DISTINCT c.id) AS total_calls,
        COUNT(DISTINCT c.user_lead_id) AS unique_leads,
        COUNT(CASE WHEN c.call_date >= NOW() - INTERVAL '7 days' THEN 1 END) AS calls_this_week,
        AVG(c.duration) AS avg_call_duration
      FROM users u
      LEFT JOIN calls c ON u.id = c.user_id
      GROUP BY u.id, u.username, u.full_name
      ORDER BY total_calls DESC
    `;

    const result = await pool.query(query);
    
    return result.rows.map(row => ({
      userId: row.user_id,
      username: row.username,
      fullName: row.full_name,
      totalCalls: parseInt(row.total_calls) || 0,
      uniqueLeads: parseInt(row.unique_leads) || 0,
      callsThisWeek: parseInt(row.calls_this_week) || 0,
      avgCallDuration: Math.round(parseFloat(row.avg_call_duration) || 0)
    }));
  } catch (error) {
    console.error('Error getting user performance metrics:', error);
    throw error;
  }
}

/**
 * Get call outcomes distribution
 * @returns {Promise<Array>} Array of call outcome distribution
 */
async function getCallOutcomesDistribution(userId = null) {
  try {
    // Build query conditions based on whether a specific user is requested
    const userCondition = userId ? 'AND user_id = $1' : '';
    const queryParams = userId ? [userId] : [];

    const query = `
      SELECT
        COALESCE(outcome, 'Not Specified') AS outcome,
        COUNT(*) AS count
      FROM calls
      WHERE 1=1 ${userCondition}
      GROUP BY outcome
      ORDER BY count DESC
    `;

    const result = await pool.query(query, queryParams);
    
    return result.rows.map(row => ({
      outcome: row.outcome,
      count: parseInt(row.count)
    }));
  } catch (error) {
    console.error('Error getting call outcomes distribution:', error);
    throw error;
  }
}

module.exports = {
  getDashboardMetrics,
  getUserPerformanceMetrics,
  getCallOutcomesDistribution
};
