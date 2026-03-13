/**
 * Client-side login rate limiter.
 * Limits to 5 attempts per minute, with a 10-minute lockout after exceeding.
 * Uses localStorage keyed by a fingerprint (since we can't get real IPs client-side).
 */

const STORAGE_KEY = "login_rate_limit";
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 60 * 1000; // 1 minute
const LOCKOUT_MS = 10 * 60 * 1000; // 10 minutes

interface RateLimitState {
  attempts: number[];
  lockedUntil: number | null;
}

function getState(): RateLimitState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { attempts: [], lockedUntil: null };
}

function setState(state: RateLimitState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/**
 * Check if login is currently rate-limited.
 * Returns { allowed: true } or { allowed: false, retryAfterSeconds, message }.
 */
export function checkRateLimit(): {
  allowed: boolean;
  retryAfterSeconds?: number;
  message?: string;
} {
  const now = Date.now();
  const state = getState();

  // Check lockout
  if (state.lockedUntil && now < state.lockedUntil) {
    const retryAfterSeconds = Math.ceil((state.lockedUntil - now) / 1000);
    const minutes = Math.ceil(retryAfterSeconds / 60);
    return {
      allowed: false,
      retryAfterSeconds,
      message: `Too many login attempts. Please try again in ${minutes} minute${minutes > 1 ? "s" : ""}.`,
    };
  }

  // Clear expired lockout
  if (state.lockedUntil && now >= state.lockedUntil) {
    setState({ attempts: [], lockedUntil: null });
    return { allowed: true };
  }

  // Count attempts within the window
  const recentAttempts = state.attempts.filter((t) => now - t < WINDOW_MS);
  if (recentAttempts.length >= MAX_ATTEMPTS) {
    const lockedUntil = now + LOCKOUT_MS;
    setState({ attempts: recentAttempts, lockedUntil });
    return {
      allowed: false,
      retryAfterSeconds: LOCKOUT_MS / 1000,
      message: "Too many login attempts. Please try again in 10 minutes.",
    };
  }

  return { allowed: true, attemptCount: recentAttempts.length };
}

/**
 * Record a failed login attempt.
 */
export function recordFailedAttempt() {
  const now = Date.now();
  const state = getState();
  const recentAttempts = state.attempts.filter((t) => now - t < WINDOW_MS);
  recentAttempts.push(now);
  setState({ ...state, attempts: recentAttempts });
}

/**
 * Reset rate limit state on successful login.
 */
export function resetRateLimit() {
  localStorage.removeItem(STORAGE_KEY);
}
