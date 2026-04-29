import { Router } from 'express';
import {
  getStats,
  getAllPostsAdmin,
  removePost,
  getAllUsersAdmin,
  suspendUser,
  getAuditLogs,
  downloadLogsCSV
} from '../controllers/adminController';
import { authenticateJWT, authorizeRoles } from '../middleware/authMiddleware';

const router = Router();

// All admin routes require authentication + ADMIN role
router.use(authenticateJWT);
router.use(authorizeRoles('ADMIN'));

// Overview Statistics
router.get('/stats', getStats);

// Post Moderation
router.get('/posts', getAllPostsAdmin);
router.patch('/posts/:postId/remove', removePost);

// User Management
router.get('/users', getAllUsersAdmin);
router.patch('/users/:userId/suspend', suspendUser);

// Audit Logs
router.get('/logs', getAuditLogs);
router.get('/logs/csv', downloadLogsCSV);

export default router;
