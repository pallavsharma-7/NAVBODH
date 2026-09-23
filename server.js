const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const { initDatabase, getDb } = require('./db');
const { seedDatabase } = require('./seed');
const { attachUser } = require('./middleware/auth');

const authRoutes = require('./routes-auth');
const coreRoutes = require('./routes-core');
const intelligenceRoutes = require('./routes-intelligence');
const learningRoutes = require('./routes-learning');
const gamificationRoutes = require('./routes-gamification');
const adminRoutes = require('./routes-admin');
const integrationsRoutes = require('./routes-integrations');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize database schema and seed if empty
const db = initDatabase();
const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
if (userCount === 0) {
  console.log('[Server] Database is empty. Seeding initial data...');
  seedDatabase();
}

// Global Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(attachUser);

// Serve static frontend files from /public
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api', coreRoutes);
app.use('/api', learningRoutes);
app.use('/api', intelligenceRoutes);
app.use('/api', gamificationRoutes);
app.use('/api/intelligence', intelligenceRoutes);
app.use('/api/learning', learningRoutes);
app.use('/api/gamification', gamificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/integrations', integrationsRoutes);

// Catch-all 404 handler for unknown API routes
app.use('/api', (req, res) => {
  return res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `API endpoint '${req.method} /api${req.path}' was not found.`
    }
  });
});

// SPA fallback for non-API routes
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Global Error Handler
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_JSON',
        message: 'Malformed JSON payload in request body.'
      }
    });
  }

  console.error('[Server Error]', err);
  const status = (typeof err.status === 'number' && err.status >= 400 && err.status < 600) ? err.status : 500;
  return res.status(status).json({
    success: false,
    error: {
      code: err.code || (status === 400 ? 'INVALID_REQUEST' : (status === 404 ? 'NOT_FOUND' : 'INTERNAL_ERROR')),
      message: process.env.NODE_ENV === 'production'
        ? 'An unexpected server error occurred.'
        : (err.message || 'An unexpected server error occurred.')
    }
  });
});

// Start Server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`  NAVBODH Core Server is running at http://localhost:${PORT}`);
    console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`=======================================================`);
  });
}

module.exports = app;
