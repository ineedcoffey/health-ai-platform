import { Router } from 'express';
import { getProfile, updateProfile, completeProfile, deleteAccount, exportData } from '../controllers/userController';
import { authenticateJWT } from '../middleware/authMiddleware';

const router = Router();

// All routes below require authentication
router.get('/profile', authenticateJWT, getProfile);
router.put('/profile', authenticateJWT, updateProfile);
router.post('/complete-profile', authenticateJWT, completeProfile);

// GDPR Compliance Endpoints
router.delete('/me', authenticateJWT, deleteAccount);       // GDPR: Delete Account
router.get('/me/export', authenticateJWT, exportData);       // GDPR: Export Data

export default router;