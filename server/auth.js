const { scrypt, randomBytes, timingSafeEqual } = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const { storage } = require('./storage');
const config = require('./config');

const scryptAsync = promisify(scrypt);
const { JWT_SECRET, JWT_EXPIRES_IN } = config;

// Hash password
async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString('hex')}.${salt}`;
}

// Compare passwords
async function comparePasswords(supplied, stored) {
  const [hashed, salt] = stored.split('.');
  const hashedBuf = Buffer.from(hashed, 'hex');
  const suppliedBuf = await scryptAsync(supplied, salt, 64);
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// Generate JWT token
function generateToken(user) {
  const { password, ...userWithoutPassword } = user;
  return jwt.sign({ user: userWithoutPassword }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// Middleware to verify JWT token
function authenticateJWT(req, res, next) {
  // Check for token in Authorization header
  const authHeader = req.headers.authorization;
  // Check for token in cookies
  const cookieToken = req.cookies && req.cookies.auth_token;
  
  // Use token from header or cookie
  const token = authHeader ? authHeader.split(' ')[1] : cookieToken;
  
  console.log('Auth check - Token present:', !!token, 'JWT_SECRET:', JWT_SECRET.substring(0, 5) + '...');
  
  if (token) {
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        console.error('Token verification failed in auth.js:', err.message);
        return res.status(401).json({ success: false, message: 'Invalid or expired token' });
      }
      
      // Make sure decoded.user exists
      if (!decoded || !decoded.user) {
        console.error('Invalid token format - missing user object');
        return res.status(401).json({ success: false, message: 'Invalid token format' });
      }
      
      console.log('Token verified successfully - user:', decoded.user.username);
      req.user = decoded.user;
      next();
    });
  } else {
    res.status(401).json({ success: false, message: 'Authentication token is required' });
  }
}

// Set up authentication
function setupAuth(app) {
  // No session middleware needed with JWT

  // Register endpoint
  app.post('/api/register', async (req, res) => {
    try {
      const { username, password, email, fullName, companyName, role = 'user' } = req.body;
      
      console.log('Registration attempt', req.body);
      
      // Validate required fields
      if (!username || !password || !email || !fullName) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
      }
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'Username already exists' });
      }
      
      // Check if email already exists
      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ success: false, message: 'Email already exists' });
      }
      
      // Create user with hashed password
      const hashedPassword = await hashPassword(password);
      const isFirstUser = await storage.isFirstUser();
      
      const user = await storage.createUser({
        username,
        password: hashedPassword,
        email,
        fullName,
        companyName,
        role: isFirstUser ? 'admin' : role, // First user is always admin
        hasCompletedSetup: false,
        // No isAdmin field - we use role to determine admin status
      });
      
      // Generate JWT token
      const token = generateToken(user);
      
      // Set token as a cookie (secure in production)
      res.cookie('auth_token', token, {
        httpOnly: true, // Prevents JavaScript access
        // secure: process.env.NODE_ENV === 'production', // Enable in production for HTTPS
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      });
      
      // Don't return the password
      const { password: _, ...userWithoutPassword } = user;
      
      res.status(201).json({
        success: true,
        user: userWithoutPassword,
        token
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ success: false, message: 'Failed to register user' });
    }
  });

  // Login endpoint
  app.post('/api/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      
      console.log('Login attempt', { username });
      
      if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Username and password are required' });
      }
      
      // Find user by username
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }
      
      // Verify password
      const isPasswordValid = await comparePasswords(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }
      
      // Generate JWT token
      const token = generateToken(user);
      
      // Set token as a cookie (secure in production)
      res.cookie('auth_token', token, {
        httpOnly: true, // Prevents JavaScript access
        // secure: process.env.NODE_ENV === 'production', // Enable in production for HTTPS
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      });
      
      // Don't return the password
      const { password: _, ...userWithoutPassword } = user;
      
      res.status(200).json({
        success: true,
        user: userWithoutPassword,
        token
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ success: false, message: 'Login failed' });
    }
  });

  // Logout endpoint
  app.post('/api/logout', (req, res) => {
    // Clear auth cookie
    res.clearCookie('auth_token');
    
    // Respond with success message
    res.status(200).json({ success: true, message: 'Logout successful' });
  });

  // Refresh token endpoint
  app.post('/api/refresh', authenticateJWT, (req, res) => {
    // Generate a new token with updated expiration
    const token = generateToken(req.user);
    
    // Set updated token as a cookie
    res.cookie('auth_token', token, {
      httpOnly: true,
      // secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });
    
    res.json({ success: true, token });
  });

  // Current user endpoint
  app.get('/api/user', authenticateJWT, (req, res) => {
    console.log('User profile request');
    res.json({ success: true, user: req.user });
  });
}

module.exports = { setupAuth, authenticateJWT, generateToken };
