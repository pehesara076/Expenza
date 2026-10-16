const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const incomeRoutes = require('./routes/income');
const expenseRoutes = require('./routes/expense');
const budgetRoutes = require('./routes/budget');
const debtRoutes = require('./routes/debt');
const todoRoutes = require('./routes/todo');

const app = express();

// 1. Dynamic CORS Configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.CLIENT_URL
].filter(Boolean); // removes undefined values

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, curl, or serverless internal triggers)
      if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
        callback(null, true);
      } else {
        callback(null, true); // production deploy test kirima sandaha temporary allow kirima
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  })
);

app.use(express.json());
app.use(cookieParser());

// 2. Database Connection Middleware (Vercel Serverless Optimisation)
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('Database connection error:', err);
    res.status(500).json({ message: 'Database connection failed' });
  }
});

// 3. API Routes Definition
const routeMappings = [
  ['/auth', authRoutes],
  ['/income', incomeRoutes],
  ['/expenses', expenseRoutes],
  ['/budget', budgetRoutes],
  ['/debts', debtRoutes],
  ['/todos', todoRoutes],
];

routeMappings.forEach(([path, router]) => {
  app.use(`/api${path}`, router);
  app.use(path, router);
});

// Health check endpoint
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// Serve frontend build in production (Render / single-service deploy)
if (process.env.NODE_ENV === 'production') {
  const frontendDistPath = path.join(__dirname, '..', 'frontend', 'dist');
  const frontendIndexPath = path.join(frontendDistPath, 'index.html');

  if (fs.existsSync(frontendDistPath)) {
    const frontendIndexHtml = fs.existsSync(frontendIndexPath)
      ? fs.readFileSync(frontendIndexPath, 'utf8')
      : null;

    app.use(express.static(frontendDistPath));

    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) return next();
      if (!frontendIndexHtml) {
        return res.status(500).send('Frontend build not found');
      }
      return res.type('html').send(frontendIndexHtml);
    });
  }
}

// 4. Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
});

// For local dev only
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
