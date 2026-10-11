import express from 'express';
import { authController } from '../controllers/authController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/login', authRateLimiter, authController.login);
router.post('/logout', authController.logout);
router.get('/me', authenticate, authController.me);
router.post('/activate-account', authRateLimiter, authController.activateAccount);
router.post('/forgot-password', authRateLimiter, authController.forgotPassword);
router.post('/reset-password', authRateLimiter, authController.resetPassword);
router.get('/outbox', authController.getOutbox);

export default router;
