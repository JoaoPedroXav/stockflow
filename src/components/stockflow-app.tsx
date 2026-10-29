'use client';

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, ArrowRight, Boxes, ChartNoAxesCombined, Check, CircleAlert, Clock3, LayoutDashboard, Layers3, Menu, Package, Pencil, Plus, RefreshCw, Search, Trash2, Wallet, X } from './icons';
import { PerformanceView } from './performance-view';
import type { CacheObservation, DashboardMetrics, Product, ProductInput } from '@/lib/types';

type View = 'dashboard' | 'products' | 'cache';
type StatusData = { lastQuery: CacheObservation | null; hits: number; misses: number; ttlSeconds: number | null; key: string };
type Toast = { text: string; type: 'success' | 'error' };

const brl = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
const integer = (value: number) => new Intl.NumberFormat('pt-BR').format(value);
const dateTime = (value: string) => new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, { ...init, cache: 'no-store', headers: { ...(init?.body ? { 'Content-Type': 'application/json' } : {}), ...init?.headers } });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || `Erro HTTP ${response.status}`);
  return data as T;
}

export function StockFlowApp({ view }: { view: View }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [observation, setObservation] = useState<CacheObservation | null>(null);
  const [cacheError, setCacheError] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [status, setStatus] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [modal, setModal] = useState<Product | 'new' | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Todas as categorias');

  const notify = useCallback((text: string, type: Toast['type'] = 'success') => {
    setToast({ text, type });
    window.setTimeout(() => setToast(null), 5500);
  }, []);

  const loadDashboard = useCallback(async () => {
    setBusy(true);
    try {
      const data = await api<{ metrics: DashboardMetrics; cache: CacheObservation; cacheError: string | null }>('/api/dashboard');
      setMetrics(data.metrics); setObservation(data.cache); setCacheError(data.cacheError);
      if (data.cacheError) notify('Os indicadores podem demorar um pouco para atualizar.', 'error');
    } catch { notify('Não foi possível carregar os indicadores. Tente novamente.', 'error'); }
    finally { setLoading(false); setBusy(false); }
  }, [notify]);

  const loadProducts = useCallback(async () => {
    setBusy(true);
    try { const data = await api<{ products: Product[] }>('/api/products'); setProducts(data.products); }
    catch { notify('Não foi possível carregar os produtos. Tente novamente.', 'error'); }
    finally { setLoading(false); setBusy(false); }
  }, [notify]);

  const loadStatus = useCallback(async () => {
    setBusy(true);
    try { setStatus(await api<StatusData>('/api/cache/status')); }
    catch { notify('Não foi possível consultar o desempenho agora.', 'error'); }
    finally { setLoading(false); setBusy(false); }
  }, [notify]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (view === 'dashboard') void loadDashboard();
      if (view === 'products') void loadProducts();
      if (view === 'cache') void loadStatus();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [view, loadDashboard, loadProducts, loadStatus]);

  const categories = useMemo(() => ['Todas as categorias', ...new Set(products.map((p) => p.category))], [products]);
  const filtered = useMemo(() => products.filter((p) => p.name.toLocaleLowerCase('pt-BR').includes(search.toLocaleLowerCase('pt-BR')) && (category === 'Todas as categorias' || p.category === category)), [products, search, category]);

  async function saveProduct(input: ProductInput) {
    setBusy(true);
    try {
      const editing = modal && modal !== 'new' ? modal : null;
      const data = await api<{ product: Product; cacheWarning: string | null }>(editing ? `/api/products/${editing.id}` : '/api/products', { method: editing ? 'PUT' : 'POST', body: JSON.stringify(input) });
      setModal(null);
      notify(editing ? 'Produto atualizado com sucesso.' : 'Produto cadastrado com sucesso.');
      if (data.cacheWarning) notify('Produto salvo. Os indicadores podem demorar um pouco para atualizar.', 'error');
      if (view === 'dashboard') await loadDashboard();
      else await loadProducts();
    } catch { notify('Não foi possível salvar o produto. Tente novamente.', 'error'); }
    finally { setBusy(false); }
  }

  async function removeProduct() {
    if (!deleteTarget) return;
    setBusy(true);
    try {
      const data = await api<{ deleted: boolean; cacheWarning: string | null }>(`/api/products/${deleteTarget.id}`, { method: 'DELETE' });
      setDeleteTarget(null);
      notify('Produto excluído com sucesso.');
      if (data.cacheWarning) notify('Produto excluído. Os indicadores podem demorar um pouco para atualizar.', 'error');
      await loadProducts();
    } catch { notify('Não foi possível excluir o produto. Tente novamente.', 'error'); }
    finally { setBusy(false); }
  }

  async function queryFromCachePage() {
    setBusy(true);
    try {
      const data = await api<{ cache: CacheObservation; cacheError: string | null }>('/api/dashboard');
      setObservation(data.cache);
      setCacheError(data.cacheError);
      await loadStatus();
      if (data.cacheError) notify('Os indicadores podem demorar um pouco para atualizar.', 'error');
    } catch { notify('Não foi possível atualizar os indicadores.', 'error'); }
    finally { setBusy(false); }
  }

  async function clearCache() {
    setBusy(true);
    try {
      await api('/api/cache/dashboard', { method: 'DELETE' });
      const data = await api<{ cache: CacheObservation; cacheError: string | null }>('/api/dashboard');
      setObservation(data.cache);
      setCacheError(data.cacheError);
      await loadStatus();
      notify('Indicadores recalculados.');
    } catch { notify('Não foi possível recalcular os indicadores.', 'error'); }
    finally { setBusy(false); }
  }

  const title = view === 'dashboard' ? 'Visão geral' : view === 'products' ? 'Produtos' : 'Desempenho';
  const subtitle = view === 'dashboard' ? 'Tudo o que importa sobre o seu estoque, em um só lugar.' : view === 'products' ? 'Organize, consulte e atualize os itens do seu estoque.' : 'Acompanhe a velocidade e a atualização dos seus indicadores.';
  const nav = [
    { href: '/', label: 'Visão geral', icon: LayoutDashboard },
    { href: '/products', label: 'Produtos', icon: Package },
    { href: '/cache', label: 'Desempenho', icon: Activity },
  ];

  return <div className="app-shell">
    <aside className={`sidebar ${menuOpen ? 'sidebar-open' : ''}`}>
      <Link href="/" className="brand" onClick={() => setMenuOpen(false)}><span className="brand-mark"><Layers3 size={23} /></span><strong>StockFlow</strong></Link>
      <nav className="nav-list">{nav.map(({ href, label, icon: Icon }) => <Link key={href} href={href} onClick={() => setMenuOpen(false)} className={`nav-link ${pathname === href ? 'active' : ''}`}><Icon size={19} /><span>{label}</span>{pathname === href && <span className="nav-active-dot" />}</Link>)}</nav>
      <div className="sidebar-bottom"><div className="workspace-card"><span className="workspace-icon"><Package size={18} /></span><span><strong>Meu estoque</strong><small>Espaço de trabalho</small></span></div></div>
    </aside>
    {menuOpen && <button className="mobile-backdrop" aria-label="Fechar menu" onClick={() => setMenuOpen(false)} />}
    <main className="main-area">
      <header className="topbar"><button className="mobile-menu icon-button" onClick={() => setMenuOpen(true)} aria-label="Abrir menu"><Menu size={22} /></button><div className="breadcrumb">Meu estoque <span>/</span> <strong>{title}</strong></div><div className="topbar-right"><span className="topbar-context">Visão do seu negócio</span><span className="avatar" aria-hidden="true">S</span></div></header>
      <div className="page-content"><div className="page-heading"><div><h1>{title}</h1><p>{subtitle}</p></div>{view === 'products' ? <button className="button button-primary" onClick={() => setModal('new')}><Plus size={18} /> Novo produto</button> : view === 'dashboard' ? <button className="button button-secondary" onClick={() => void loadDashboard()} disabled={busy}><RefreshCw size={17} className={busy ? 'spin' : ''} /> Atualizar</button> : null}</div>
      {view === 'dashboard' && <DashboardView metrics={metrics} observation={observation} cacheError={cacheError} loading={loading} onAdd={() => setModal('new')} />}
      {view === 'products' && <ProductsView products={filtered} total={products.length} loading={loading} search={search} onSearch={setSearch} category={category} categories={categories} onCategory={setCategory} onAdd={() => setModal('new')} onEdit={setModal} onDelete={setDeleteTarget} />}
      {view === 'cache' && <PerformanceView status={status} current={observation} cacheError={cacheError} loading={loading} busy={busy} onQuery={() => void queryFromCachePage()} onClear={() => void clearCache()} onRefresh={() => void loadStatus()} />}
      <footer className="page-footer"><span>StockFlow</span><span>Seu estoque, sempre em ordem.</span></footer></div>
    </main>
    {modal && <ProductModal product={modal === 'new' ? null : modal} busy={busy} onClose={() => setModal(null)} onSave={(input) => void saveProduct(input)} />}
    {deleteTarget && <div className="modal-overlay" role="presentation" onMouseDown={() => setDeleteTarget(null)}><div className="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="delete-title" onMouseDown={(event) => event.stopPropagation()}><div className="danger-icon"><Trash2 size={23} /></div><h2 id="delete-title">Excluir produto?</h2><p>Você está prestes a excluir <strong>{deleteTarget.name}</strong>. Esta ação não pode ser desfeita.</p><div className="modal-actions"><button className="button button-secondary" onClick={() => setDeleteTarget(null)}>Cancelar</button><button className="button button-danger" onClick={() => void removeProduct()} disabled={busy}>{busy ? 'Excluindo...' : 'Excluir produto'}</button></div></div></div>}
    {toast && <div className={`toast ${toast.type}`} role="status">{toast.type === 'success' ? <Check size={18} /> : <CircleAlert size={18} />}<span>{toast.text}</span><button aria-label="Fechar aviso" onClick={() => setToast(null)}><X size={16} /></button></div>}
  </div>;
}

function DashboardView({ metrics, observation, cacheError, loading, onAdd }: { metrics: DashboardMetrics | null; observation: CacheObservation | null; cacheError: string | null; loading: boolean; onAdd: () => void }) {
  if (loading) return <Loading />;
  if (!metrics) return <ErrorState />;
  const cards = [
    { label: 'Produtos', value: integer(metrics.totalProducts), icon: Package, tone: 'blue', note: 'Itens cadastrados' },
    { label: 'Unidades disponíveis', value: integer(metrics.totalUnits), icon: Boxes, tone: 'violet', note: 'Em todo o estoque' },
    { label: 'Valor em estoque', value: brl(metrics.stockValue), icon: Wallet, tone: 'green', note: 'Valor total dos itens' },
    { label: 'Precisam de atenção', value: integer(metrics.lowStockCount), icon: CircleAlert, tone: 'orange', note: 'Com 5 unidades ou menos' },
  ];
  return <>
    {cacheError && <div className="notice-error"><CircleAlert size={18} /> Os indicadores podem levar mais tempo para atualizar. Seus produtos continuam disponíveis.</div>}
    <div className="section-heading"><div><h2>Resumo do estoque</h2><p>Uma visão clara para decidir o que fazer em seguida.</p></div></div>
    <div className="stats-grid">{cards.map(({ label, value, icon: Icon, tone, note }) => <div className="stat-card" key={label}><div className="stat-top"><span>{label}</span><div className={`stat-icon ${tone}`}><Icon size={21} /></div></div><strong>{value}</strong><div className="stat-note">{note}</div></div>)}</div>
    <div className="dashboard-grid"><section className="surface low-stock-panel"><div className="panel-heading"><div><h2>Estoque baixo</h2><p>Produtos que podem precisar de reposição.</p></div><Link href="/products" className="text-link">Ver produtos <ArrowRight size={17} /></Link></div>{metrics.lowStockProducts.length ? <div className="table-wrap"><table><thead><tr><th>Produto</th><th>Categoria</th><th>Disponível</th><th>Preço unitário</th></tr></thead><tbody>{metrics.lowStockProducts.slice(0, 6).map((product) => <tr key={product.id}><td><span className="product-cell"><span className="product-avatar">{product.name.slice(0, 1).toUpperCase()}</span><strong>{product.name}</strong></span></td><td><span className="category-chip">{product.category}</span></td><td><span className="quantity-low"><span /> {product.quantity} un.</span></td><td>{brl(product.unit_price)}</td></tr>)}</tbody></table></div> : <div className="empty-compact"><div><Check size={24} /></div><strong>{metrics.totalProducts ? 'Tudo em ordem por aqui' : 'Seu estoque começa aqui'}</strong><p>{metrics.totalProducts ? 'Nenhum produto precisa de reposição agora.' : 'Cadastre o primeiro produto para acompanhar quantidades e valores.'}</p>{!metrics.totalProducts && <button onClick={onAdd} className="button button-primary"><Plus size={17} /> Cadastrar produto</button>}</div>}</section><aside className="surface insight-panel"><div className="panel-heading"><div><h2>Em foco</h2><p>O que merece a sua atenção agora.</p></div><ChartNoAxesCombined size={21} /></div><div className="insight-item"><span className="insight-icon orange"><CircleAlert size={19} /></span><div><strong>Para repor</strong><p>{metrics.lowStockCount ? `${integer(metrics.lowStockCount)} produto${metrics.lowStockCount === 1 ? '' : 's'} com estoque baixo` : 'Nenhum produto no momento'}</p></div></div><div className="insight-item"><span className="insight-icon blue"><Package size={19} /></span><div><strong>Catálogo</strong><p>{integer(metrics.totalProducts)} produto{metrics.totalProducts === 1 ? '' : 's'} cadastrado{metrics.totalProducts === 1 ? '' : 's'}</p></div></div><div className="insight-item"><span className="insight-icon violet"><Clock3 size={19} /></span><div><strong>Última atualização</strong><p>{observation ? dateTime(observation.queriedAt) : 'Ainda não realizada'}</p></div></div><Link href="/products" className="insight-link">Gerenciar produtos <ArrowRight size={17} /></Link></aside></div>
  </>;
}

function ProductsView({ products, total, loading, search, onSearch, category, categories, onCategory, onAdd, onEdit, onDelete }: { products: Product[]; total: number; loading: boolean; search: string; onSearch: (v: string) => void; category: string; categories: string[]; onCategory: (v: string) => void; onAdd: () => void; onEdit: (p: Product) => void; onDelete: (p: Product) => void }) {
  if (loading) return <Loading />;
  return <><section className="surface products-panel"><div className="products-toolbar"><div><h2>Catálogo <span className="count-badge">{integer(total)}</span></h2><p>Todos os produtos do seu estoque.</p></div><div className="filters"><label className="search-box"><Search size={18} /><input type="search" placeholder="Buscar produto" value={search} onChange={(e) => onSearch(e.target.value)} aria-label="Buscar por nome" /></label><select value={category} onChange={(e) => onCategory(e.target.value)} aria-label="Filtrar por categoria">{categories.map((c) => <option key={c}>{c}</option>)}</select></div></div>{products.length ? <div className="table-wrap"><table className="products-table"><thead><tr><th>Produto</th><th>Categoria</th><th>Quantidade</th><th>Preço unitário</th><th>Valor total</th><th>Atualizado em</th><th>Ações</th></tr></thead><tbody>{products.map((product) => <tr key={product.id}><td><span className="product-cell"><span className="product-avatar">{product.name.slice(0, 1).toUpperCase()}</span><strong>{product.name}</strong></span></td><td><span className="category-chip">{product.category}</span></td><td><span className={product.quantity <= 5 ? 'quantity-low' : 'quantity-ok'}><span /> {product.quantity} un.</span></td><td>{brl(product.unit_price)}</td><td className="semibold">{brl(product.quantity * product.unit_price)}</td><td className="muted-cell">{dateTime(product.updated_at)}</td><td><div className="row-actions"><button title="Editar produto" aria-label={`Editar ${product.name}`} onClick={() => onEdit(product)}><Pencil size={17} /></button><button title="Excluir produto" aria-label={`Excluir ${product.name}`} className="delete-action" onClick={() => onDelete(product)}><Trash2 size={17} /></button></div></td></tr>)}</tbody></table></div> : <div className="empty-state"><div className="empty-art"><Package size={31} /></div><h3>{total ? 'Nenhum resultado encontrado' : 'Seu estoque começa aqui'}</h3><p>{total ? 'Tente outra busca ou selecione uma categoria diferente.' : 'Cadastre o primeiro produto para acompanhar quantidades, valores e alertas de estoque.'}</p>{!total && <button className="button button-primary" onClick={onAdd}><Plus size={17} /> Cadastrar produto</button>}</div>}</section><p className="table-caption">{products.length} de {total} produtos exibidos · Produtos com 5 unidades ou menos aparecem como estoque baixo.</p></>;
}

function ProductModal({ product, busy, onClose, onSave }: { product: Product | null; busy: boolean; onClose: () => void; onSave: (input: ProductInput) => void }) {
  const [name, setName] = useState(product?.name ?? '');
  const [category, setCategory] = useState(product?.category ?? '');
  const [quantity, setQuantity] = useState(product?.quantity.toString() ?? '0');
  const [price, setPrice] = useState(product?.unit_price.toFixed(2) ?? '0.00');
  const [error, setError] = useState<string | null>(null);
  function submit(event: FormEvent) {
    event.preventDefault();
    const q = Number(quantity); const p = Number(price.replace(',', '.'));
    if (!name.trim() || name.trim().length > 120) return setError('Informe um nome com até 120 caracteres.');
    if (!category.trim() || category.trim().length > 80) return setError('Informe uma categoria com até 80 caracteres.');
    if (!Number.isSafeInteger(q) || q < 0) return setError('A quantidade deve ser um inteiro não negativo.');
    if (!Number.isFinite(p) || p < 0 || p > 9999999999.99 || Math.abs(Math.round(p * 100) - p * 100) > 0.00001) return setError('Informe um preço não negativo, com até duas casas decimais.');
    setError(null); onSave({ name: name.trim(), category: category.trim(), quantity: q, unit_price: p });
  }
  return <div className="modal-overlay" role="presentation" onMouseDown={onClose}><div className="product-modal" role="dialog" aria-modal="true" aria-labelledby="product-modal-title" onMouseDown={(event) => event.stopPropagation()}><div className="modal-header"><div><h2 id="product-modal-title">{product ? 'Editar produto' : 'Novo produto'}</h2><p>{product ? 'Atualize as informações do produto.' : 'Preencha os dados para adicionar ao estoque.'}</p></div><button className="icon-button" aria-label="Fechar" onClick={onClose}><X size={20} /></button></div><form onSubmit={submit}><div className="form-grid"><label className="field field-full"><span>Nome do produto <b>*</b></span><input autoFocus value={name} maxLength={120} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Notebook Dell Inspiron" required /></label><label className="field field-full"><span>Categoria <b>*</b></span><input value={category} maxLength={80} onChange={(e) => setCategory(e.target.value)} placeholder="Ex.: Eletrônicos" required /></label><label className="field"><span>Quantidade <b>*</b></span><input type="number" min="0" step="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} required /></label><label className="field"><span>Preço unitário (R$) <b>*</b></span><input type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required /></label></div>{error && <div className="form-error"><CircleAlert size={16} /> {error}</div>}<div className="modal-actions"><button type="button" className="button button-secondary" onClick={onClose}>Cancelar</button><button className="button button-primary" type="submit" disabled={busy}>{busy ? 'Salvando...' : product ? 'Salvar alterações' : 'Cadastrar produto'}</button></div></form></div></div>;
}

function Loading() { return <div className="loading-state"><RefreshCw size={25} className="spin" /><strong>Carregando dados...</strong><span>Organizando as informações para você</span></div>; }
function ErrorState() { return <div className="empty-state surface"><div className="empty-art"><CircleAlert size={29} /></div><h3>Não foi possível carregar os dados</h3><p>Tente atualizar a página em alguns instantes.</p></div>; }
