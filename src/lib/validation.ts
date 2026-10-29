import type { ProductInput } from '@/lib/types';

export class InputError extends Error {}

export function parseProductInput(raw: unknown): ProductInput {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new InputError('Dados do produto inválidos.');
  const value = raw as Record<string, unknown>;
  const name = typeof value.name === 'string' ? value.name.trim() : '';
  const category = typeof value.category === 'string' ? value.category.trim() : '';
  const quantity = value.quantity;
  const unitPrice = value.unit_price;
  if (!name || name.length > 120) throw new InputError('Informe um nome com até 120 caracteres.');
  if (!category || category.length > 80) throw new InputError('Informe uma categoria com até 80 caracteres.');
  if (typeof quantity !== 'number' || !Number.isSafeInteger(quantity) || quantity < 0) {
    throw new InputError('A quantidade deve ser um número inteiro não negativo.');
  }
  if (typeof unitPrice !== 'number' || !Number.isFinite(unitPrice) || unitPrice < 0 || unitPrice > 9999999999.99 || Math.abs(Math.round(unitPrice * 100) - unitPrice * 100) > 0.00001) {
    throw new InputError('O preço deve ser não negativo, com até duas casas decimais.');
  }
  return { name, category, quantity, unit_price: unitPrice };
}

export function validateUuid(id: string): void {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    throw new InputError('ID do produto inválido.');
  }
}
