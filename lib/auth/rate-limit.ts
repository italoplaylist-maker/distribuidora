const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;
/** Hard cap so a flood of distinct keys (e.g. spoofed IPs) can't grow this unbounded in memory. */
const MAX_TRACKED_KEYS = 5000;

interface Bucket {
  count: number;
  resetAt: number;
}

/**
 * In-memory login attempt tracker. This only protects a single Node
 * process — a multi-instance deployment would need a shared store (Redis)
 * for this to hold across instances. Good enough as a first line of
 * defense against credential-stuffing/brute-force against this app's
 * current single-instance deployment model.
 */
const buckets = new Map<string, Bucket>();

export function isRateLimited(key: string): boolean {
  const bucket = buckets.get(key);
  if (!bucket) return false;
  if (Date.now() > bucket.resetAt) {
    buckets.delete(key);
    return false;
  }
  return bucket.count >= MAX_ATTEMPTS;
}

export function recordFailedAttempt(key: string): void {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    if (buckets.size >= MAX_TRACKED_KEYS) {
      const oldestKey = buckets.keys().next().value;
      if (oldestKey !== undefined) buckets.delete(oldestKey);
    }
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return;
  }
  bucket.count += 1;
}

export function clearAttempts(key: string): void {
  buckets.delete(key);
}
