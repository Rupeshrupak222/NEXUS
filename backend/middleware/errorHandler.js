import { config } from '../config/index.js';

export function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  const message = err.message || 'An internal server error occurred.';
  const code = err.code || 'SERVER_ERROR';

  if (config.isProduction) {
    console.error(`[ERROR] ${req.method} ${req.originalUrl}:`, message);
  } else {
    console.error(`[ERROR] ${req.method} ${req.originalUrl}:`, err);
  }

  res.status(status).json({
    success: false,
    message,
    code,
    ...(config.nodeEnv === 'development' && err.stack ? { stack: err.stack } : {})
  });
}
