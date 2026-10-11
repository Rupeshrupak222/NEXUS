import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Uploaded course materials live under backend/uploads and are served statically.
export const UPLOADS_DIR = path.resolve(__dirname, '..', 'uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Whitelisted content types for lesson materials.
const ALLOWED_MIME = new Set([
  // Video
  'video/mp4',
  'video/webm',
  'video/ogg',
  'video/quicktime',
  // Documents
  'application/pdf'
]);

const ALLOWED_EXT = new Set(['.mp4', '.webm', '.ogg', '.mov', '.pdf']);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const base = path
      .basename(file.originalname, ext)
      .replace(/[^a-z0-9]+/gi, '-')
      .replace(/(^-|-$)/g, '')
      .slice(0, 40)
      .toLowerCase() || 'material';
    const unique = crypto.randomBytes(8).toString('hex');
    cb(null, `${base}-${Date.now()}-${unique}${ext}`);
  }
});

function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_MIME.has(file.mimetype) && ALLOWED_EXT.has(ext)) {
    return cb(null, true);
  }
  const err = new Error('Unsupported file type. Upload an MP4/WebM/OGG/MOV video or a PDF document.');
  err.status = 400;
  err.code = 'UNSUPPORTED_FILE_TYPE';
  return cb(err);
}

// Single-file upload under field name "file". 500MB cap for long video lectures.
export const uploadLessonMaterial = multer({
  storage,
  fileFilter,
  limits: { fileSize: 500 * 1024 * 1024 }
}).single('file');
