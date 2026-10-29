import { createProduct, listProducts } from '@/lib/supabase';
import { invalidateDashboard } from '@/lib/redis';
import { handleError, json } from '@/lib/http';
import { parseProductInput } from '@/lib/validation';

export const dynamic = 'force-dynamic';

export async function GET() {
  try { return json({ products: await listProducts() }); }
  catch (error) { return handleError(error); }
}

export async function POST(request: Request) {
  try {
    const input = parseProductInput(await request.json());
    const product = await createProduct(input);
    let cacheWarning: string | null = null;
    try { await invalidateDashboard(); }
    catch (error) { cacheWarning = `Produto salvo, mas não foi possível invalidar o cache: ${error instanceof Error ? error.message : String(error)}`; }
    return json({ product, cacheWarning }, 201);
  } catch (error) { return handleError(error); }
}
