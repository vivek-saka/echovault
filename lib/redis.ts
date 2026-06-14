import Redis from "ioredis";

declare global {
  // eslint-disable-next-line no-var
  var __redis: Redis | undefined;
}

function createRedis() {
  const url = process.env.REDIS_URL;
  if (!url) {
    throw new Error("REDIS_URL environment variable is not set");
  }

  const client = new Redis(url, {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    // Graceful reconnect
    retryStrategy(times) {
      if (times > 5) return null; // Stop retrying after 5 attempts
      return Math.min(times * 200, 2000);
    },
  });

  client.on("error", (err) => {
    // Don't crash on Redis errors — log and continue
    if (process.env.NODE_ENV === "development") {
      console.warn("[Redis] Connection error:", err.message);
    }
  });

  return client;
}

export const redis = globalThis.__redis ?? createRedis();

if (process.env.NODE_ENV !== "production") {
  globalThis.__redis = redis;
}

// ─── Rate Limiting Helper ─────────────────────────────────────────────────────

/**
 * Simple sliding-window rate limiter using Redis.
 * Returns { allowed, remaining, resetAt }
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const now      = Date.now();
  const windowMs = windowSeconds * 1000;
  const redisKey = `rate_limit:${key}`;

  try {
    const pipeline = redis.pipeline();
    pipeline.zremrangebyscore(redisKey, 0, now - windowMs);
    pipeline.zadd(redisKey, now, `${now}-${Math.random()}`);
    pipeline.zcard(redisKey);
    pipeline.expire(redisKey, windowSeconds + 1);
    const results = await pipeline.exec();

    const count = (results?.[2]?.[1] as number) ?? 0;
    const allowed   = count <= limit;
    const remaining = Math.max(0, limit - count);
    const resetAt   = now + windowMs;

    return { allowed, remaining, resetAt };
  } catch {
    // If Redis is unavailable, allow the request
    return { allowed: true, remaining: limit, resetAt: now + windowMs };
  }
}

// ─── Cache Helpers ────────────────────────────────────────────────────────────

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const value = await redis.get(key);
    return value ? (JSON.parse(value) as T) : null;
  } catch {
    return null;
  }
}

export async function cacheSet(
  key: string,
  value: unknown,
  ttlSeconds = 300
): Promise<void> {
  try {
    await redis.setex(key, ttlSeconds, JSON.stringify(value));
  } catch {
    // Silently fail — cache is best-effort
  }
}

export async function cacheDel(key: string): Promise<void> {
  try {
    await redis.del(key);
  } catch {
    // Silently fail
  }
}
