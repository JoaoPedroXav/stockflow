import { readCacheStatus } from '@/lib/redis';
import { handleError, json } from '@/lib/http';

export const dynamic = 'force-dynamic';
export async function GET() {
  try { return json(await readCacheStatus()); }
  catch (error) { return handleError(error); }
}
