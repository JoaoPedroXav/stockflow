import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Product, ProductInput } from '@/lib/types';

let client: SupabaseClient | null = null;

function db(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error('Configure SUPABASE_URL e SUPABASE_SECRET_KEY em .env.local.');
  if (!client) client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return client;
}

export async function listProducts(): Promise<Product[]> {
  const products: Product[] = [];
  const pageSize = 1000;
  for (let start = 0; ; start += pageSize) {
    const { data, error } = await db().from('products').select('*').order('created_at', { ascending: false }).range(start, start + pageSize - 1);
    if (error) throw new Error(`Falha ao consultar produtos no Supabase: ${error.message}`);
    const page = (data ?? []) as Product[];
    products.push(...page);
    if (page.length < pageSize) break;
  }
  return products;
}

export async function createProduct(input: ProductInput): Promise<Product> {
  const { data, error } = await db().from('products').insert(input).select('*').single();
  if (error) throw new Error(`Falha ao cadastrar produto no Supabase: ${error.message}`);
  return data as Product;
}

export async function updateProduct(id: string, input: ProductInput): Promise<Product | null> {
  const { data, error } = await db().from('products').update(input).eq('id', id).select('*').maybeSingle();
  if (error) throw new Error(`Falha ao atualizar produto no Supabase: ${error.message}`);
  return data as Product | null;
}

export async function deleteProduct(id: string): Promise<boolean> {
  const { data, error } = await db().from('products').delete().eq('id', id).select('id').maybeSingle();
  if (error) throw new Error(`Falha ao excluir produto no Supabase: ${error.message}`);
  return Boolean(data);
}
