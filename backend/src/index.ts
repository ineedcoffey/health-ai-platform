import './types/express';
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

// Security middleware
import { generalLimiter } from './middleware/rateLimiter';

// Route imports
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import postRoutes from './routes/postRoutes';
import meetingRoutes from './routes/meetingRoutes';
import adminRoutes from './routes/adminRoutes';

// Background jobs
import { initCronJobs } from './jobs/cronJobs';

const app = express();
app.set('trust proxy', 1); // Enable trust proxy for cloud services like Render

// ============================================================================
// Security Middleware
// ============================================================================

// Helmet.js — Sets secure HTTP headers (XSS protection, HSTS, no-sniff, etc.)
app.use(helmet());

// CORS — Allow frontend origin
app.use(cors());

// Body parsing
app.use(express.json());

// General rate limiter — 100 requests per 15 minutes per IP (applied to all routes)
app.use(generalLimiter);

// ============================================================================
// API Routes
// ============================================================================
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/admin', adminRoutes);

// ============================================================================
// Start Server & Initialize Background Jobs
// ============================================================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  initCronJobs();
});