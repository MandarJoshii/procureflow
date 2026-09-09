import rateLimit from "express-rate-limit";

/**
 * Limits repeated attempts on signup/login to slow down brute-force
 * credential guessing. Only failed attempts count toward the limit —
 * a legitimate user logging in successfully multiple times in a session
 * should never be blocked; only repeated wrong-password attempts should be.
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { error: "TOO_MANY_ATTEMPTS", detail: "Too many attempts. Please try again later." },
});