import { Redis } from '@upstash/redis'

if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
  throw new Error('Redis environment variables are not properly configured')
}

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

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