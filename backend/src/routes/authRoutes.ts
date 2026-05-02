import { Router } from 'express';
import { register, login, verifyEmail, resendVerification } from '../controllers/authController';
import { forgotPassword, resetPassword } from '../controllers/passwordController';
import { authLimiter } from '../middleware/rateLimiter';

const router = Router();

// ── Authentication (strict rate limiting — 5 attempts / 15 min) ───────────────
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);

// ── Email Verification ────────────────────────────────────────────────────────
router.get('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerification);

// ── Password Reset ────────────────────────────────────────────────────────────
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router;