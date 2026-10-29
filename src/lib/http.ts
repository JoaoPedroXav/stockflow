import { NextResponse } from 'next/server';
import { InputError } from '@/lib/validation';

export const noStoreHeaders = { 'Cache-Control': 'no-store, max-age=0' };

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: noStoreHeaders });
}

export function handleError(error: unknown) {
  const message = error instanceof Error ? error.message : 'Erro inesperado no servidor.';
  return json({ error: message }, error instanceof InputError || error instanceof SyntaxError ? 400 : 500);
}
