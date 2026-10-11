import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendDir = path.resolve(__dirname, '..');
const rootDir = path.resolve(__dirname, '../..');

// Load environment files: .env.local takes precedence over .env
const envFiles = [
  path.join(backendDir, '.env.local'),
  path.join(backendDir, '.env'),
  path.join(rootDir, '.env.local'),
  path.join(rootDir, '.env')
];

for (const envFile of envFiles) {
  if (fs.existsSync(envFile)) {
    dotenv.config({ path: envFile });
  }
}

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  appUrl: process.env.APP_URL || 'http://localhost:5173',
  apiUrl: process.env.API_URL || 'http://localhost:5000',
  jwtSecret: process.env.JWT_SECRET || 'super_secret_jwt_key_education_lms_2026_production_grade',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  sessionSecret: process.env.SESSION_SECRET || 'session_secret_lms_key_secure_2026',
  emailProvider: process.env.EMAIL_PROVIDER || 'simulated',
  emailFrom: process.env.EMAIL_FROM || 'noreply@nexuslms.io',
  emailApiKey: process.env.EMAIL_API_KEY || '',
  sessionJoinWindowMinutes: parseInt(process.env.SESSION_JOIN_WINDOW_MINUTES || '15', 10),
  cookieConfig: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  }
};
