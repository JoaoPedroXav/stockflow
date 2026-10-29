import type { ProductInput, ProductUpdateInput, StockMovementInput } from '@/lib/types';

export class InputError extends Error {}

function parseProductDetails(raw: unknown): ProductUpdateInput {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new InputError('Dados do produto inválidos.');
  const value = raw as Record<string, unknown>;
  const name = typeof value.name === 'string' ? value.name.trim() : '';
  const category = typeof value.category === 'string' ? value.category.trim() : '';
  const unitPrice = value.unit_price;
  if (!name || name.length > 120) throw new InputError('Informe um nome com até 120 caracteres.');
  if (!category || category.length > 80) throw new InputError('Informe uma categoria com até 80 caracteres.');
  if (typeof unitPrice !== 'number' || !Number.isFinite(unitPrice) || unitPrice < 0 || unitPrice > 9999999999.99 || Math.abs(Math.round(unitPrice * 100) - unitPrice * 100) > 0.00001) {
    throw new InputError('O preço deve ser não negativo, com até duas casas decimais.');
  }
  return { name, category, unit_price: unitPrice };
}

export function parseProductInput(raw: unknown): ProductInput {
  const details = parseProductDetails(raw);
  const quantity = (raw as Record<string, unknown>).quantity;
  if (typeof quantity !== 'number' || !Number.isSafeInteger(quantity) || quantity < 0 || quantity > 2147483647) {
    throw new InputError('A quantidade deve ser um número inteiro entre 0 e 2147483647.');
  }
  return { ...details, quantity };
}

export function parseProductUpdateInput(raw: unknown): ProductUpdateInput {
  return parseProductDetails(raw);
}

export function parseStockMovementInput(raw: unknown): StockMovementInput {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new InputError('Dados da movimentação inválidos.');
  const value = raw as Record<string, unknown>;
  const productId = value.product_id;
  if (typeof productId !== 'string') throw new InputError('Selecione um produto.');
  validateUuid(productId);
  const type = value.movement_type;
  if (type !== 'in' && type !== 'out') throw new InputError('Selecione entrada ou saída.');
  const quantity = value.quantity;
  if (typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity <= 0 || quantity > 2147483647) {
    throw new InputError('A quantidade deve ser um inteiro maior que zero.');
  }
  const reason = typeof value.reason === 'string' ? value.reason.trim() : '';
  if (!reason || reason.length > 240) throw new InputError('Informe um motivo com até 240 caracteres.');
  return { product_id: productId, movement_type: type, quantity, reason };
}

export function validateUuid(id: string): void {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    throw new InputError('ID do produto inválido.');
  }
}
