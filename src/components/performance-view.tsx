'use client';

import type { CacheObservation } from '@/lib/types';
import { Activity, ArrowRight, Check, CircleAlert, Clock3, RefreshCw, Zap } from './icons';

type StatusData = {
  lastQuery: CacheObservation | null;
  hits: number;
  misses: number;
  ttlSeconds: number | null;
  key: string;
};

type Props = {
  status: StatusData | null;
  current: CacheObservation | null;
  cacheError: string | null;
  loading: boolean;
  busy: boolean;
  onQuery: () => void;
  onClear: () => void;
  onRefresh: () => void;
};

const integer = (value: number) => new Intl.NumberFormat('pt-BR').format(value);
const dateTime = (value: string) => new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));

export function PerformanceView({ status, current, cacheError, loading, busy, onQuery, onClear, onRefresh }: Props) {
  if (loading) return <div className="loading-state"><RefreshCw size={25} className="spin" /><strong>Carregando desempenho...</strong><span>Organizando as informações para você</span></div>;
  if (!status) return <div className="empty-state surface"><div className="empty-art"><CircleAlert size={29} /></div><h3>Não foi possível carregar o desempenho</h3><p>Tente atualizar a página em alguns instantes.</p></div>;

  const last = current ?? status.lastQuery;
  const total = status.hits + status.misses;
  const fastRate = total ? Math.round(status.hits / total * 100) : 0;
  const lastLabel = !last ? 'Ainda não há dados' : last.status === 'HIT' ? 'Resposta rápida' : last.status === 'MISS' ? 'Dados atualizados' : 'Temporariamente lento';

  return <>
    <section className="performance-intro surface">
      <span className="performance-intro-icon"><Activity size={24} /></span>
      <div><h2>Uma experiência sempre ágil.</h2><p>Acompanhe a velocidade das consultas e atualize os indicadores quando precisar.</p></div>
      <span className={`health-pill ${cacheError ? 'health-warning' : ''}`}><span className="online-dot" />{cacheError ? 'Atualização limitada' : 'Tudo funcionando'}</span>
    </section>
    {cacheError && <div className="notice-error"><CircleAlert size={18} /> Os indicadores podem demorar um pouco para atualizar. Seus produtos continuam disponíveis.</div>}

    <div className="performance-stats">
      <div className="surface performance-stat"><div className="performance-stat-top"><span>Última consulta</span><span className="stat-icon blue"><Activity size={20} /></span></div><strong>{lastLabel}</strong><p>{last ? dateTime(last.queriedAt) : 'Consulte os indicadores para começar'}</p></div>
      <div className="surface performance-stat"><div className="performance-stat-top"><span>Tempo de resposta</span><span className="stat-icon violet"><Clock3 size={20} /></span></div><strong>{last ? `${last.responseMs.toFixed(0)} ms` : '—'}</strong><p>Tempo da consulta mais recente</p></div>
      <div className="surface performance-stat"><div className="performance-stat-top"><span>Dados prontos por mais</span><span className="stat-icon green"><Zap size={20} /></span></div><strong>{status.ttlSeconds === null ? 'Agora' : `${status.ttlSeconds} s`}</strong><p>{status.ttlSeconds === null ? 'Prontos para uma nova atualização' : 'Antes da próxima atualização completa'}</p></div>
    </div>

    <div className="performance-grid">
      <section className="surface performance-actions"><div className="panel-heading"><div><h2>Indicadores atualizados</h2><p>Consulte os números recentes ou faça um novo cálculo.</p></div></div><div className="performance-actions-body"><p>Os indicadores acompanham as alterações feitas nos produtos e no estoque. Se quiser conferir os dados neste momento, atualize a visão.</p><div className="performance-buttons"><button className="button button-primary" disabled={busy} onClick={onQuery}><RefreshCw size={17} className={busy ? 'spin' : ''} /> Atualizar visão</button><button className="button button-secondary" disabled={busy} onClick={onClear}><Zap size={17} /> Recalcular agora</button></div><span className="performance-note"><Check size={16} /> Ao registrar uma movimentação, o resumo do estoque é renovado.</span></div></section>
      <section className="surface performance-history"><div className="panel-heading"><div><h2>Consultas</h2><p>Como o sistema respondeu até agora.</p></div></div><div className="history-row"><span>Respostas rápidas</span><strong>{integer(status.hits)}</strong></div><div className="history-row"><span>Atualizações completas</span><strong>{integer(status.misses)}</strong></div><div className="progress-track" aria-label={`${fastRate}% de respostas rápidas`}><span style={{ width: `${fastRate}%` }} /></div><div className="history-rate"><span>Respostas rápidas</span><strong>{fastRate}%</strong></div><button className="refresh-status" onClick={onRefresh} disabled={busy}>Atualizar números <ArrowRight size={16} /></button></section>
    </div>
  </>;
}
