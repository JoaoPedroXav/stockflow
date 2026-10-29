'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { ArrowUpRight, Boxes, Check, Plus, RefreshCw, Search, X } from './icons';
import type { Product, StockMovement, StockMovementInput } from '@/lib/types';

type MovementType = StockMovement['movement_type'];

const integer = (value: number) => new Intl.NumberFormat('pt-BR').format(value);
const dateTime = (value: string) => new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));

export function MovementsView({
  products, movements, loading, error, onRetry, onNew,
}: {
  products: Product[];
  movements: StockMovement[];
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  onNew: (type: MovementType) => void;
}) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | MovementType>('all');
  const filtered = useMemo(() => movements.filter((movement) =>
    (typeFilter === 'all' || movement.movement_type === typeFilter) &&
    movement.product_name.toLocaleLowerCase('pt-BR').includes(search.toLocaleLowerCase('pt-BR')),
  ), [movements, search, typeFilter]);

  if (loading) return <div className="loading-state"><RefreshCw size={25} className="spin" /><strong>Carregando movimentações...</strong></div>;
  if (error) return <div className="empty-state surface"><div className="empty-art"><Boxes size={30} /></div><h3>Não foi possível carregar as movimentações</h3><p>Tente novamente em alguns instantes.</p><button className="button button-primary" onClick={onRetry}><RefreshCw size={17} /> Tentar novamente</button></div>;

  return <>
    <section className="surface movement-intro">
      <span className="movement-intro-icon"><Boxes size={24} /></span>
      <div><h2>Controle cada entrada e saída.</h2><p>Atualize o saldo dos produtos e mantenha um histórico claro do que aconteceu.</p></div>
      <div className="movement-intro-actions">
        <button className="button button-secondary" onClick={() => onNew('out')} disabled={!products.length}>Registrar saída</button>
        <button className="button button-primary" onClick={() => onNew('in')} disabled={!products.length}><Plus size={17} /> Registrar entrada</button>
      </div>
    </section>

    <section className="surface movements-panel">
      <div className="products-toolbar movement-toolbar">
        <div><h2>Histórico <span className="count-badge">{integer(movements.length)}</span></h2><p>Últimas movimentações registradas no estoque.</p></div>
        <div className="filters">
          <label className="search-box"><Search size={18} /><input type="search" placeholder="Buscar produto" value={search} onChange={(event) => setSearch(event.target.value)} aria-label="Buscar movimentações por produto" /></label>
          <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as 'all' | MovementType)} aria-label="Filtrar tipo de movimentação">
            <option value="all">Todas</option><option value="in">Entradas</option><option value="out">Saídas</option>
          </select>
        </div>
      </div>
      {filtered.length ? <div className="table-wrap"><table className="movements-table"><thead><tr><th>Data</th><th>Produto</th><th>Tipo</th><th>Quantidade</th><th>Saldo anterior</th><th>Novo saldo</th><th>Motivo</th></tr></thead><tbody>
        {filtered.map((movement) => <tr key={movement.id}>
          <td>{dateTime(movement.created_at)}</td>
          <td><span className="product-cell"><span className="product-avatar">{movement.product_name.slice(0, 1).toUpperCase()}</span><strong>{movement.product_name}</strong></span></td>
          <td><span className={`movement-badge ${movement.movement_type === 'in' ? 'movement-in' : 'movement-out'}`}>{movement.movement_type === 'in' ? 'Entrada' : 'Saída'}</span></td>
          <td className="semibold">{movement.movement_type === 'in' ? '+' : '-'}{integer(movement.quantity)} un.</td>
          <td>{integer(movement.quantity_before)} un.</td>
          <td className="semibold">{integer(movement.quantity_after)} un.</td>
          <td className="movement-reason" title={movement.reason}>{movement.reason}</td>
        </tr>)}
      </tbody></table></div> : <div className="empty-state"><div className="empty-art"><ArrowUpRight size={30} /></div><h3>{movements.length ? 'Nenhuma movimentação encontrada' : 'Seu histórico começa aqui'}</h3><p>{movements.length ? 'Tente outra busca ou selecione um tipo diferente.' : products.length ? 'Registre uma entrada ou saída para acompanhar as mudanças no estoque.' : 'Cadastre um produto antes de registrar entradas e saídas.'}</p></div>}
    </section>
    <p className="table-caption">{filtered.length} de {movements.length} movimentações exibidas · O histórico mostra os 200 registros mais recentes.</p>
  </>;
}

export function MovementModal({
  products, initialProduct, initialType, busy, onClose, onSave,
}: {
  products: Product[];
  initialProduct: Product | null;
  initialType: MovementType;
  busy: boolean;
  onClose: () => void;
  onSave: (input: StockMovementInput) => void;
}) {
  const [type, setType] = useState<MovementType>(initialType);
  const [productId, setProductId] = useState(initialProduct?.id ?? products[0]?.id ?? '');
  const [quantity, setQuantity] = useState('1');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const product = products.find((item) => item.id === productId);
  const amount = Number(quantity);
  const projected = product && Number.isSafeInteger(amount) ? product.quantity + (type === 'in' ? amount : -amount) : null;

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!product) return setError('Selecione um produto.');
    if (!Number.isSafeInteger(amount) || amount <= 0 || amount > 2147483647) return setError('Informe uma quantidade inteira maior que zero.');
    if (type === 'out' && amount > product.quantity) return setError('A quantidade de saída supera o saldo disponível.');
    if (type === 'in' && product.quantity + amount > 2147483647) return setError('O novo saldo ultrapassaria o limite permitido.');
    if (!reason.trim() || reason.trim().length > 240) return setError('Informe um motivo com até 240 caracteres.');
    setError(null);
    onSave({ product_id: product.id, movement_type: type, quantity: amount, reason: reason.trim() });
  }

  return <div className="modal-overlay" role="presentation" onMouseDown={onClose}><div className="product-modal movement-modal" role="dialog" aria-modal="true" aria-labelledby="movement-modal-title" onMouseDown={(event) => event.stopPropagation()}>
    <div className="modal-header"><div><h2 id="movement-modal-title">Nova movimentação</h2><p>Registre o motivo e confira o saldo antes de salvar.</p></div><button className="icon-button" aria-label="Fechar" onClick={onClose}><X size={20} /></button></div>
    <form onSubmit={submit}>
      <div className="movement-type-selector" role="group" aria-label="Tipo de movimentação">
        <button type="button" className={type === 'in' ? 'selected' : ''} onClick={() => { setType('in'); setError(null); }} aria-pressed={type === 'in'}>Entrada</button>
        <button type="button" className={type === 'out' ? 'selected' : ''} onClick={() => { setType('out'); setError(null); }} aria-pressed={type === 'out'}>Saída</button>
      </div>
      <div className="form-grid">
        <label className="field field-full"><span>Produto <b>*</b></span><select value={productId} onChange={(event) => { setProductId(event.target.value); setError(null); }} required>{products.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label>
        <label className="field field-full"><span>Quantidade <b>*</b></span><input autoFocus type="number" min="1" step="1" value={quantity} onChange={(event) => setQuantity(event.target.value)} required /></label>
        <label className="field field-full"><span>Motivo <b>*</b></span><textarea value={reason} maxLength={240} onChange={(event) => setReason(event.target.value)} placeholder={type === 'in' ? 'Ex.: Compra de mercadoria' : 'Ex.: Venda ou consumo'} required /></label>
      </div>
      {product && <div className="movement-balance"><span>Saldo atual <strong>{integer(product.quantity)} un.</strong></span><ArrowUpRight size={17} /><span>Após movimentação <strong className={projected !== null && projected < 0 ? 'balance-invalid' : ''}>{projected === null ? '—' : `${integer(projected)} un.`}</strong></span></div>}
      {error && <div className="form-error">{error}</div>}
      <div className="modal-actions"><button type="button" className="button button-secondary" onClick={onClose}>Cancelar</button><button className="button button-primary" type="submit" disabled={busy}>{busy ? 'Registrando...' : <><Check size={17} /> Registrar {type === 'in' ? 'entrada' : 'saída'}</>}</button></div>
    </form>
  </div></div>;
}
