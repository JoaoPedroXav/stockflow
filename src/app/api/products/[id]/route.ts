import { deleteProduct, updateProduct } from '@/lib/supabase';
import { invalidateDashboard } from '@/lib/redis';
import { handleError, json } from '@/lib/http';
import { parseProductUpdateInput, validateUuid } from '@/lib/validation';

export const dynamic = 'force-dynamic';
type Context = { params: Promise<{ id: string }> };

async function clearCache(): Promise<string | null> {
  try { await invalidateDashboard(); return null; }
  catch (error) { return `Alteração salva, mas não foi possível invalidar o cache: ${error instanceof Error ? error.message : String(error)}`; }
}

export async function PUT(request: Request, context: Context) {
  try {
    const { id } = await context.params;
    validateUuid(id);
    const input = parseProductUpdateInput(await request.json());
    const product = await updateProduct(id, input);
    if (!product) return json({ error: 'Produto não encontrado.' }, 404);
    return json({ product, cacheWarning: await clearCache() });
  } catch (error) { return handleError(error); }
}

export async function DELETE(_request: Request, context: Context) {
  try {
    const { id } = await context.params;
    validateUuid(id);
    const deleted = await deleteProduct(id);
    if (!deleted) return json({ error: 'Produto não encontrado.' }, 404);
    return json({ deleted: true, cacheWarning: await clearCache() });
  } catch (error) { return handleError(error); }
}
