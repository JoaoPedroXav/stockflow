import { calculateDashboard } from '@/lib/dashboard';
import { listProducts } from '@/lib/supabase';
import { DASHBOARD_KEY, getCachedDashboard, recordQuery, redis, setCachedDashboard } from '@/lib/redis';
import { handleError, json } from '@/lib/http';
import type { CacheObservation, DashboardMetrics } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  const start = performance.now();
  try {
    let cached: DashboardMetrics | null = null;
    let cacheError: string | null = null;
    try { cached = await getCachedDashboard(); }
    catch (error) {
      cacheError = error instanceof Error ? error.message : String(error);
    }

    const metrics = cached ?? calculateDashboard(await listProducts());
    let status: CacheObservation['status'] = cacheError ? 'UNAVAILABLE' : cached ? 'HIT' : 'MISS';
    if (status === 'MISS') {
      try { await setCachedDashboard(metrics); }
      catch (error) {
        cacheError = error instanceof Error ? error.message : String(error);
        status = 'UNAVAILABLE';
      }
    }

    const observation: CacheObservation = {
      status,
      responseMs: Math.round((performance.now() - start) * 100) / 100,
      key: DASHBOARD_KEY,
      queriedAt: new Date().toISOString(),
      ttlSeconds: null,
    };
    if (status !== 'UNAVAILABLE') {
      try {
        const ttl = await redis().ttl(DASHBOARD_KEY);
        observation.ttlSeconds = ttl < 0 ? null : ttl;
        observation.responseMs = Math.round((performance.now() - start) * 100) / 100;
        await recordQuery(observation);
      } catch (error) {
        cacheError = error instanceof Error ? error.message : String(error);
        observation.status = 'UNAVAILABLE';
        observation.ttlSeconds = null;
      }
    }
    return json({ metrics, cache: observation, cacheError });
  } catch (error) { return handleError(error); }
}
