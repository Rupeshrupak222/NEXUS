import express from 'express';
import { verificationController } from '../controllers/verificationController.js';

const router = express.Router();

// Public certificate verification
router.get('/:certificateNumber', verificationController.verifyCertificate);

export default router;
