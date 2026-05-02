import rateLimit from 'express-rate-limit';

// ============================================================================
// Rate Limiting Configuration
// SRS NFR-03: Protection against brute-force and DDoS attacks
// ============================================================================

/**
 * General API Rate Limiter
 * Applies to all API routes.
 * Allows 100 requests per 15-minute window per IP.
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,                    // 100 requests per window
  standardHeaders: true,       // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false,        // Disable `X-RateLimit-*` headers
  message: {
    message: 'Too many requests from this IP address. Please try again after 15 minutes.',
  },
});

/**
 * Strict Auth Rate Limiter
 * Applies to login and register endpoints only.
 * Allows 5 attempts per 15-minute window per IP to prevent brute-force attacks.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 5,                     // 5 attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many authentication attempts. Please try again after 15 minutes.',
  },
  // Skip successful requests — only count failed attempts for login
  skipSuccessfulRequests: false,
});
