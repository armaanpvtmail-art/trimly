import Redis from "ioredis";

/**
 * Redis singleton used for caching (theme + link lookups) and rate limiting.
 * Gracefully degrades: if Redis is unavailable, callers should treat a null
 * client as "cache miss / no limit" rather than crashing.
 */
const globalForRedis = globalThis as unknown as {
  redis: Redis | null | undefined;
};

function createClient(): Redis | null {
  const url = process.env.REDIS_URL;
  if (!url) return null;
  try {
    const client = new Redis(url, {
      maxRetriesPerRequest: 2,
      enableReadyCheck: true,
      lazyConnect: false,
      retryStrategy: (times) => Math.min(times * 200, 2000),
    });
    client.on("error", (err) => {
      // Avoid crashing the process on transient Redis errors.
      if (process.env.NODE_ENV === "development") {
        console.warn("[redis] connection error:", err.message);
      }
    });
    return client;
  } catch {
    return null;
  }
}

export const redis: Redis | null =
  globalForRedis.redis ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForRedis.redis = redis;
}

/** Helper: get JSON value from cache, or null. */
export async function cacheGet<T>(key: string): Promise<T | null> {
  if (!redis) return null;
  try {
    const raw = await redis.get(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

/** Helper: set JSON value with TTL (seconds). */
export async function cacheSet(key: string, value: unknown, ttlSeconds = 300) {
  if (!redis) return;
  try {
    await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch {
    /* ignore cache write failures */
  }
}

/** Helper: delete one or more cache keys. */
export async function cacheDel(...keys: string[]) {
  if (!redis || keys.length === 0) return;
  try {
    await redis.del(...keys);
  } catch {
    /* ignore */
  }
}
