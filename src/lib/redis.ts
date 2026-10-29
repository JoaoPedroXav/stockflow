import 'server-only';
import { Redis } from '@upstash/redis';
import type { CacheObservation, DashboardMetrics } from '@/lib/types';

export const DASHBOARD_KEY = 'stockflow:dashboard:v1';
export const HIT_KEY = 'stockflow:cache:hits';
export const MISS_KEY = 'stockflow:cache:misses';
export const LAST_QUERY_KEY = 'stockflow:cache:last-query';
export const DASHBOARD_TTL = 120;

let client: Redis | null = null;

export function redis(): Redis {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) throw new Error('Configure UPSTASH_REDIS_REST_URL e UPSTASH_REDIS_REST_TOKEN em .env.local.');
  if (!client) client = new Redis({ url, token });
  return client;
}

export async function getCachedDashboard(): Promise<DashboardMetrics | null> {
  return await redis().get<DashboardMetrics>(DASHBOARD_KEY);
}

export async function setCachedDashboard(metrics: DashboardMetrics): Promise<void> {
  await redis().set(DASHBOARD_KEY, metrics, { ex: DASHBOARD_TTL });
}

export async function invalidateDashboard(): Promise<number> {
  return await redis().del(DASHBOARD_KEY);
}

export async function recordQuery(observation: CacheObservation): Promise<void> {
  await redis().incr(observation.status === 'HIT' ? HIT_KEY : MISS_KEY);
  await redis().set(LAST_QUERY_KEY, observation);
}

export async function readCacheStatus() {
  const store = redis();
  const [lastQuery, hits, misses, ttlSeconds] = await Promise.all([
    store.get<CacheObservation>(LAST_QUERY_KEY),
    store.get<number>(HIT_KEY),
    store.get<number>(MISS_KEY),
    store.ttl(DASHBOARD_KEY),
  ]);
  return { lastQuery, hits: hits ?? 0, misses: misses ?? 0, ttlSeconds: ttlSeconds < 0 ? null : ttlSeconds, key: DASHBOARD_KEY };
}
