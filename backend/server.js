import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import { config } from './config/index.js';
import { initializeSchema } from './database/schema.js';
import { seedDatabase } from './database/seed.js';
import { UPLOADS_DIR } from './middleware/uploadMiddleware.js';

import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import verificationRoutes from './routes/verificationRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { apiRateLimiter } from './middleware/rateLimiter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// 1. Security Headers via Helmet
app.use(
  helmet({
    contentSecurityPolicy: false, // Allows flexible media embeds in development/demo
    crossOriginEmbedderPolicy: false
  })
);

// 2. CORS configuration with credentials support
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5000',
  'http://127.0.0.1:5000',
  config.appUrl
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // Permissive in dev, or origin check
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  })
);

// 3. Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// 4. Rate Limiting for general API
app.use('/api/', apiRateLimiter);

// 5. Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    platform: 'Nexus LMS Enterprise'
  });
});

// 6. API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/verify-certificate', verificationRoutes);

// 6b. Serve uploaded course materials (videos / PDFs) statically
app.use(
  '/uploads',
  express.static(UPLOADS_DIR, {
    maxAge: '7d',
    setHeaders: (res) => {
      // Allow the frontend (different dev origin) to embed/stream these files.
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
  })
);

// 7. Serve Static Frontend in Production / Built mode
const clientDistPath = path.resolve(__dirname, '../frontend/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('{*splat}', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// 8. 404 Handler for API
app.use('/api', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint ${req.method} ${req.originalUrl} not found.`,
    code: 'ROUTE_NOT_FOUND'
  });
});

// 9. Centralized Error Handler
app.use(errorHandler);

// 10. Startup and Database Initialization
async function startServer() {
  try {
    console.log('[NEXUS-LMS] Connecting to Supabase PostgreSQL & verifying schema...');
    await initializeSchema();
    await seedDatabase();
    console.log('[NEXUS-LMS] Database verified and seeded.');

    app.listen(config.port, () => {
      console.log(`\x1b[32m[NEXUS-LMS] Backend Server running on port ${config.port}\x1b[0m`);
      console.log(`[NEXUS-LMS] Health check: http://localhost:${config.port}/api/health`);
    });
  } catch (error) {
    console.error('[NEXUS-LMS] Fatal startup error:', error);
    process.exit(1);
  }
}

startServer();

export default app;
