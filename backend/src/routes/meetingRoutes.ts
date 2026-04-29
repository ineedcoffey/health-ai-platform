import { Router } from 'express';
import {
  createMeetingRequest,
  updateMeetingStatus,
  getMyRequests,
  cancelMeetingRequest
} from '../controllers/meetingController';
import { authenticateJWT } from '../middleware/authMiddleware';

const router = Router();

// Static routes must be defined before parameterized routes
router.get('/my-requests', authenticateJWT, getMyRequests);

router.post('/', authenticateJWT, createMeetingRequest);
router.patch('/:requestId/status', authenticateJWT, updateMeetingStatus);
router.put('/:requestId/cancel', authenticateJWT, cancelMeetingRequest);

export default router;