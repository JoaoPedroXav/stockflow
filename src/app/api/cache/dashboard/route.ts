import { invalidateDashboard } from '@/lib/redis';
import { handleError, json } from '@/lib/http';

export const dynamic = 'force-dynamic';
export async function DELETE() {
  try { return json({ deleted: await invalidateDashboard() }); }
  catch (error) { return handleError(error); }
}
