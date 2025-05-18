/**
 * Authentication Routes
 * Handles authentication-related API endpoints
 */

const express = require('express');
const jwt = require('jsonwebtoken');
const { pool } = require('./db');
const router = express.Router();

// Environment variables and constants
const JWT_SECRET = process.env.JWT_SECRET || 'flutterbyte-dev-secret';
const TOKEN_EXPIRY = '24h';

/**
 * Login route
 * POST /api/auth/login
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log('Login attempt', { username });
    
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }
    
    // Find user by username using direct SQL query
    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1 LIMIT 1',
      [username]
    );
    
    const user = result.rows[0];
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }
    
    // In a real application, we would hash and compare passwords
    // For demo purposes, we're doing a direct comparison
    if (user.password !== password) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id,
        username: user.username,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRY }
    );
    
    // Exclude password from response
    const { password: _, ...userWithoutPassword } = user;
    
    // Set cookie with token
    res.cookie('auth_token', token, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
    
    // Send response
    res.json({
      success: true,
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred during login'
    });
  }
});

/**
 * Register route
 * POST /api/auth/register
 */
router.post('/register', async (req, res) => {
  try {
    const { username, password, email, fullName, companyName } = req.body;
    
    // Validate required fields
    if (!username || !password || !email) {
      return res.status(400).json({
        success: false,
        message: 'Username, password, and email are required'
      });
    }
    
    // Check if username already exists
    const existingUserResult = await pool.query(
      'SELECT id FROM users WHERE username = $1 LIMIT 1',
      [username]
    );
    
    if (existingUserResult.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Username already exists'
      });
    }
    
    // Also check if email already exists
    const existingEmailResult = await pool.query(
      'SELECT id FROM users WHERE email = $1 LIMIT 1',
      [email]
    );
    
    if (existingEmailResult.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Email already exists'
      });
    }
    
    // Create new user
    const createdUserResult = await pool.query(
      `INSERT INTO users 
      (username, password, email, full_name, company_name, role, has_completed_setup, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, username, email, full_name, company_name, role, has_completed_setup, created_at, updated_at`,
      [
        username,
        password, // In a real app, this would be hashed
        email,
        fullName || '',
        companyName || null,
        'user',
        false,
        new Date(),
        new Date()
      ]
    );
    
    const createdUser = createdUserResult.rows[0];
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: createdUser.id,
        username: createdUser.username,
        role: createdUser.role
      },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRY }
    );
    
    // Set cookie with token
    res.cookie('auth_token', token, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
    
    res.status(201).json({
      success: true,
      token,
      user: createdUser
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred during registration',
      error: error.message
    });
  }
});

/**
 * Logout route
 * POST /api/auth/logout
 */
router.post('/logout', (req, res) => {
  // Clear auth cookie
  res.clearCookie('auth_token');
  
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

/**
 * Verify token route
 * GET /api/auth/verify
 */
router.get('/verify', async (req, res) => {
  try {
    // Get token from Authorization header or cookie
    const authHeader = req.headers.authorization;
    const token = authHeader ? authHeader.split(' ')[1] : req.cookies.auth_token;
    
    if (!token) {
      return res.json({
        success: false,
        message: 'Not authenticated'
      });
    }
    
    console.log('Dashboard check - Token present: true JWT_SECRET:', JWT_SECRET.substring(0, 5) + '...');
    
    // Verify token
    jwt.verify(token, JWT_SECRET, async (err, decoded) => {
      if (err) {
        return res.json({
          success: false,
          message: 'Invalid or expired token'
        });
      }
      
      // Get fresh user data from database
      try {
        const userResult = await pool.query(
          'SELECT id, username, email, full_name, company_name, role, has_completed_setup, created_at, updated_at FROM users WHERE id = $1',
          [decoded.userId]
        );
        
        if (userResult.rows.length === 0) {
          return res.json({
            success: false,
            message: 'User not found'
          });
        }
        
        const user = userResult.rows[0];
        console.log('Token verified successfully - user:', user.username);
        
        res.json({
          success: true,
          authenticated: true,
          user: user,
          data: user
        });
      } catch (dbError) {
        console.error('Database error during token verification:', dbError);
        return res.json({
          success: false,
          message: 'Error verifying user'
        });
      }
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred during token verification'
    });
  }
});

/**
 * Check authentication middleware
 * This can be used to protect routes
 */
const checkAuth = async (req, res, next) => {
  try {
    // Get token from Authorization header or cookie
    const authHeader = req.headers.authorization;
    const token = authHeader ? authHeader.split(' ')[1] : req.cookies.auth_token;
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    console.log('Auth check - Token present: true JWT_SECRET:', JWT_SECRET.substring(0, 5) + '...');
    
    // Verify token
    jwt.verify(token, JWT_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(401).json({
          success: false,
          message: 'Invalid or expired token'
        });
      }
      
      try {
        // Get user from database to ensure they still exist and have appropriate permissions
        const userResult = await pool.query(
          'SELECT id, username, email, full_name, company_name, role FROM users WHERE id = $1',
          [decoded.userId]
        );
        
        if (userResult.rows.length === 0) {
          return res.status(401).json({
            success: false,
            message: 'User not found'
          });
        }
        
        const user = userResult.rows[0];
        console.log('Token verified successfully - user:', user.username);
        
        // Add user info to request
        req.user = {
          ...decoded,
          fullName: user.full_name,
          email: user.email,
          companyName: user.company_name,
          dbUser: user // Add the full user object for convenience
        };
        
        next();
      } catch (dbError) {
        console.error('Database error during auth check:', dbError);
        return res.status(500).json({
          success: false,
          message: 'Error verifying user'
        });
      }
    });
  } catch (error) {
    console.error('Auth check error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred during authentication check'
    });
  }
};

module.exports = {
  router,
  checkAuth
};