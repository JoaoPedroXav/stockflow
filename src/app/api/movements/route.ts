import { listStockMovements, registerStockMovement } from '@/lib/supabase';
import { invalidateDashboard } from '@/lib/redis';
import { handleError, json } from '@/lib/http';
import { parseStockMovementInput } from '@/lib/validation';

export const dynamic = 'force-dynamic';

export async function GET() {
  try { return json({ movements: await listStockMovements() }); }
  catch (error) { return handleError(error); }
}

export async function POST(request: Request) {
  try {
    const input = parseStockMovementInput(await request.json());
    const movement = await registerStockMovement(input);
    let cacheWarning: string | null = null;
    try { await invalidateDashboard(); }
    catch { cacheWarning = 'Movimentação registrada, mas os indicadores podem levar até dois minutos para atualizar.'; }
    return json({ movement, cacheWarning }, 201);
  } catch (error) { return handleError(error); }
}
