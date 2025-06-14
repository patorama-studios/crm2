const express = require('express');
const cors = require('cors');
const compression = require('compression');
const dotenv = require('dotenv');
const path = require('path');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const db = require('./config/database');
const { hashPassword, comparePassword } = require('./utils/auth');
const { authenticate, authorize } = require('./middleware/auth');

dotenv.config();

const app = express();

// Middleware
app.use(compression());
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (React frontend)
app.use(express.static(path.join(__dirname, 'public')));

// =====================================================
// AUTHENTICATION ROUTES
// =====================================================

// Login endpoint
app.post('/api/auth/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    const [users] = await db.query(
      'SELECT * FROM users WHERE email = ? AND status = ?',
      [email, 'active']
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = users[0];
    const isValidPassword = comparePassword(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current user
app.get('/api/auth/me', authenticate, (req, res) => {
  res.json(req.user);
});

// Logout
app.post('/api/auth/logout', authenticate, (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

// =====================================================
// DASHBOARD / STATS ROUTES
// =====================================================

app.get('/api/dashboard/stats', authenticate, async (req, res) => {
  try {
    // Get basic stats for dashboard
    const [[jobStats]] = await db.query(
      'SELECT COUNT(*) as active_jobs FROM jobs WHERE status IN ("scheduled", "in_progress", "editing")'
    );
    
    const [[customerStats]] = await db.query(
      'SELECT COUNT(*) as total_customers FROM customers'
    );
    
    const [[uploadStats]] = await db.query(
      'SELECT COUNT(*) as pending_uploads FROM uploads WHERE is_final = FALSE'
    );
    
    const [[invoiceStats]] = await db.query(
      'SELECT COUNT(*) as unpaid_invoices FROM invoices WHERE status IN ("draft", "sent")'
    );

    res.json({
      active_jobs: jobStats.active_jobs || 0,
      total_customers: customerStats.total_customers || 0,
      pending_uploads: uploadStats.pending_uploads || 0,
      unpaid_invoices: invoiceStats.unpaid_invoices || 0
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// =====================================================
// JOBS ROUTES
// =====================================================

// Get jobs (filtered by role)
app.get('/api/jobs', authenticate, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT j.*, c.agency_name, c.contact_name,
             u1.name as creator_name, u2.name as editor_name
      FROM jobs j
      LEFT JOIN customers c ON j.customer_id = c.id
      LEFT JOIN users u1 ON j.assigned_creator_id = u1.id
      LEFT JOIN users u2 ON j.assigned_editor_id = u2.id
      WHERE 1=1
    `;
    
    const params = [];

    // Filter by role
    if (req.user.role === 'content_creator') {
      query += ' AND j.assigned_creator_id = ?';
      params.push(req.user.id);
    } else if (req.user.role === 'editor') {
      query += ' AND j.assigned_editor_id = ?';
      params.push(req.user.id);
    }

    if (status) {
      query += ' AND j.status = ?';
      params.push(status);
    }

    query += ' ORDER BY j.date DESC, j.time DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [jobs] = await db.query(query, params);
    res.json({ jobs });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

// Get job by ID
app.get('/api/jobs/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    const [[job]] = await db.query(
      `SELECT j.*, c.agency_name, c.contact_name, c.email as customer_email,
              u1.name as creator_name, u2.name as editor_name
       FROM jobs j
       LEFT JOIN customers c ON j.customer_id = c.id
       LEFT JOIN users u1 ON j.assigned_creator_id = u1.id
       LEFT JOIN users u2 ON j.assigned_editor_id = u2.id
       WHERE j.id = ?`,
      [id]
    );

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Check role-based access
    if (req.user.role === 'content_creator' && job.assigned_creator_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    if (req.user.role === 'editor' && job.assigned_editor_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(job);
  } catch (error) {
    console.error('Error fetching job:', error);
    res.status(500).json({ error: 'Failed to fetch job' });
  }
});

// =====================================================
// CUSTOMERS ROUTES
// =====================================================

app.get('/api/customers', authenticate, async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    let query = 'SELECT * FROM customers WHERE 1=1';
    const params = [];

    if (search) {
      query += ' AND (agency_name LIKE ? OR contact_name LIKE ? OR email LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [customers] = await db.query(query, params);
    res.json({ customers });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// =====================================================
// HEALTH CHECK
// =====================================================

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV
  });
});

// =====================================================
// SERVE REACT APP
// =====================================================

// Catch-all handler for React routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// =====================================================
// ERROR HANDLING
// =====================================================

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// =====================================================
// START SERVER
// =====================================================

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Patorama CRM Server running on port ${PORT}`);
  console.log(`📱 Environment: ${process.env.NODE_ENV}`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL}`);
  console.log(`💾 Database: ${process.env.DB_NAME}`);
});