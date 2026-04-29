import { Router } from 'express';
import {
  createPost,
  getAllPosts,
  getMyPosts,
  getPostById,
  updatePost,
  updatePostStatus
} from '../controllers/postController';
import { authenticateJWT } from '../middleware/authMiddleware';

const router = Router();

// Public route — browse active posts (with optional query filters)
router.get('/', getAllPosts);

// Protected routes
router.get('/my-posts', authenticateJWT, getMyPosts);
router.get('/:postId', getPostById);
router.post('/', authenticateJWT, createPost);
router.put('/:postId', authenticateJWT, updatePost);
router.patch('/:postId/status', authenticateJWT, updatePostStatus);

export default router;