import { Redis } from '@upstash/redis'

export const redis = Redis.fromEnv()

export async function getFromCache<T>(key: string): Promise<T | null> {
  try {
    return await redis.get(key)
  } catch (error) {
    console.warn('Redis cache get error:', error)
    return null
  }
}

export async function setCache<T>(
  key: string,
  data: T,
  expirationSeconds: number = 3600 // 1 hour default
): Promise<void> {
  try {
    await redis.set(key, data, { ex: expirationSeconds })
  } catch (error) {
    console.warn('Redis cache set error:', error)
  }
}
