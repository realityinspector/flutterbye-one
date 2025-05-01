const passport = require('passport');
const { Strategy: LocalStrategy } = require('passport-local');
const session = require('express-session');
const { scrypt, randomBytes, timingSafeEqual } = require('crypto');
const { promisify } = require('util');
const { storage } = require('./storage');

const scryptAsync = promisify(scrypt);

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

// Set up authentication
function setupAuth(app) {
  const sessionSettings = {
    secret: process.env.SESSION_SECRET || 'walktalk-development-secret',
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
    },
  };

  app.set('trust proxy', 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Local strategy for username/password auth
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false, { message: 'Incorrect username or password' });
        }
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }),
  );

  // Serialize and deserialize user
  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Register endpoint
  app.post('/api/register', async (req, res, next) => {
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
      });
      
      // Log in the user
      req.login(user, (err) => {
        if (err) return next(err);
        
        // Don't return the password
        const { password, ...userWithoutPassword } = user;
        
        res.status(201).json({
          success: true,
          user: userWithoutPassword,
          token: 'jwt-token-placeholder' // In a real app, generate JWT here
        });
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ success: false, message: 'Failed to register user' });
    }
  });

  // Login endpoint
  app.post('/api/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ success: false, message: info?.message || 'Invalid credentials' });
      }
      
      req.login(user, (loginErr) => {
        if (loginErr) return next(loginErr);
        
        // Don't return the password
        const { password, ...userWithoutPassword } = user;
        
        res.status(200).json({
          success: true,
          user: userWithoutPassword,
          token: 'jwt-token-placeholder' // In a real app, generate JWT here
        });
      });
    })(req, res, next);
  });

  // Logout endpoint
  app.post('/api/logout', (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  // Current user endpoint
  app.get('/api/user', (req, res) => {
    console.log('User profile request');
    if (!req.isAuthenticated()) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    
    // Don't return the password
    const { password, ...userWithoutPassword } = req.user;
    
    res.json({ success: true, user: userWithoutPassword });
  });
}

module.exports = { setupAuth };
