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
  windowMs: 1 * 60 * 1000,    // DEV: 1 minute (production: 15 min)
  max: 10000,                  // DEV: effectively unlimited (production: 100)
  standardHeaders: true,       // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false,        // Disable `X-RateLimit-*` headers
  message: {
    message: 'Too many requests from this IP address. Please try again later.',
  },
});

/**
 * Strict Auth Rate Limiter
 * Applies to login and register endpoints only.
 */
export const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,    // DEV: 1 minute (production: 15 min)
  max: 10000,                  // DEV: effectively unlimited (production: 5)
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many authentication attempts. Please try again later.',
  },
  skipSuccessfulRequests: false,
});
