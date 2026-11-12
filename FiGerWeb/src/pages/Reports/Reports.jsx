import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import DownloadIcon from '@mui/icons-material/Download';
import { apiFetch, readApiError } from '../../utils/api.js';
import styles from './Reports.module.css';

const PERIODS = [
  { id: 'semana', label: 'Semana', previousLabel: 'semana anterior' },
  { id: 'mes', label: 'Mês', previousLabel: 'mês anterior' },
  { id: 'ano', label: 'Ano', previousLabel: 'ano anterior' },
];

const CATEGORY_COLORS = [
  '#7c3aed',
  '#db2777',
  '#ea580c',
  '#0891b2',
  '#65a30d',
  '#2563eb',
  '#ca8a04',
  '#475569',
];

const MONTH_LABELS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const WEEKDAY_LABELS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const percent = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/* Mesma query usada em TransactionViewManager: o cache do React Query é compartilhado. */
async function fetchTransactions() {
  const response = await apiFetch('/api/movimentacoes');
  if (!response.ok) {
    throw new Error(await readApiError(response, 'Não foi possível carregar as movimentações.'));
  }

  const data = await response.json();
  const transactions = Array.isArray(data) ? data : data.movimentacoes;

  if (!Array.isArray(transactions)) {
    throw new Error('As movimentações recebidas da API têm um formato inválido.');
  }

  return transactions;
}

/* Lê "AAAA-MM-DD" (com ou sem hora) ou "DD/MM/AAAA" como data local, sem deslocar fuso. */
function parseDate(value) {
  if (!value) return null;
  const text = String(value).trim();

  let match = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));

  match = text.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (match) return new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]));

  return null;
}

function startOfPeriod(date, period) {
  if (period === 'ano') return new Date(date.getFullYear(), 0, 1);
  if (period === 'mes') return new Date(date.getFullYear(), date.getMonth(), 1);

  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return monday;
}

function shiftPeriod(start, period, amount) {
  if (period === 'ano') return new Date(start.getFullYear() + amount, 0, 1);
  if (period === 'mes') return new Date(start.getFullYear(), start.getMonth() + amount, 1);

  const shifted = new Date(start);
  shifted.setDate(shifted.getDate() + amount * 7);
  return shifted;
}

function formatDate(date) {
  return date.toLocaleDateString('pt-BR');
}

function formatPeriodLabel(start, end, period) {
  if (period === 'ano') return String(start.getFullYear());

  if (period === 'mes') {
    const label = start.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    return label.charAt(0).toUpperCase() + label.slice(1);
  }

  const last = new Date(end);
  last.setDate(last.getDate() - 1);
  const short = (date) => date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  return `${short(start)} – ${formatDate(last)}`;
}

function inRange(item, start, end) {
  return item.date >= start && item.date < end;
}

function sumByType(items) {
  return items.reduce(
    (totals, item) => {
      if (item.tipo === 'entrada') totals.entradas += item.valor;
      if (item.tipo === 'saida') totals.saidas += item.valor;
      return totals;
    },
    { entradas: 0, saidas: 0 },
  );
}

function buildBuckets(items, period, start) {
  let labels;
  let indexOf;

  if (period === 'ano') {
    labels = MONTH_LABELS;
    indexOf = (date) => date.getMonth();
  } else if (period === 'semana') {
    labels = WEEKDAY_LABELS;
    indexOf = (date) => (date.getDay() + 6) % 7;
  } else {
    const daysInMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
    const weeks = Math.ceil(daysInMonth / 7);
    labels = Array.from({ length: weeks }, (_, index) => `Sem ${index + 1}`);
    indexOf = (date) => Math.min(Math.floor((date.getDate() - 1) / 7), weeks - 1);
  }

  const buckets = labels.map((label) => ({ label, entradas: 0, saidas: 0 }));

  items.forEach((item) => {
    const bucket = buckets[indexOf(item.date)];
    if (item.tipo === 'entrada') bucket.entradas += item.valor;
    if (item.tipo === 'saida') bucket.saidas += item.valor;
  });

  return buckets;
}

function buildCategoryTotals(items) {
  const totals = new Map();

  items.forEach((item) => {
    if (item.tipo !== 'saida') return;
    const name = item.categoria || 'Sem categoria';
    totals.set(name, (totals.get(name) ?? 0) + item.valor);
  });

  return [...totals.entries()]
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total);
}

/* Evita que o Excel interprete texto digitado pelo usuário como fórmula. */
function csvCell(value) {
  let text = String(value ?? '');
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

function exportCsv(items, filename) {
  const header = ['Data', 'Descrição', 'Categoria', 'Tipo', 'Valor'];
  const rows = [...items]
    .sort((a, b) => a.date - b.date)
    .map((item) => [
      formatDate(item.date),
      item.descricao,
      item.categoria,
      item.tipo === 'entrada' ? 'Entrada' : 'Saída',
      item.valor.toFixed(2).replace('.', ','),
    ]);

  const csv = [header, ...rows].map((row) => row.map(csvCell).join(';')).join('\r\n');
  const blob = new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function Comparison({ current, previous, previousLabel, higherIsBetter }) {
  if (!previous) {
    return <p className={styles.note}>Sem dados no {previousLabel}</p>;
  }

  const change = ((current - previous) / previous) * 100;
  const sign = change > 0 ? '+' : change < 0 ? '−' : '';
  const isGood = change === 0 ? null : higherIsBetter ? change > 0 : change < 0;
  const tone = isGood === null ? '' : isGood ? styles.noteGood : styles.noteBad;

  return (
    <p className={`${styles.note} ${tone}`}>
      {sign}
      {percent.format(Math.abs(change))}% vs. {previousLabel}
    </p>
  );
}

export default function Reports() {
  const [period, setPeriod] = useState('mes');
  const [reference, setReference] = useState(() => new Date());

  const {
    data: rawTransactions = [],
    isPending,
    isError,
    error,
  } = useQuery({
    queryKey: ['movimentacoes'],
    queryFn: fetchTransactions,
  });

  const transactions = useMemo(
    () =>
      rawTransactions
        .map((transaction) => ({
          descricao: String(transaction.descricao ?? ''),
          categoria: transaction.categoria ?? '',
          tipo: transaction.tipo,
          valor: Math.abs(Number(transaction.valor)),
          date: parseDate(transaction.data),
        }))
        .filter((item) => item.date && Number.isFinite(item.valor)),
    [rawTransactions],
  );

  const periodConfig = PERIODS.find((item) => item.id === period);
  const start = startOfPeriod(reference, period);
  const end = shiftPeriod(start, period, 1);
  const previousStart = shiftPeriod(start, period, -1);
  const periodLabel = formatPeriodLabel(start, end, period);

  const currentItems = useMemo(
    () => transactions.filter((item) => inRange(item, start, end)),
    // start/end mudam apenas quando reference ou period mudam
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [transactions, period, reference],
  );

  const previousItems = useMemo(
    () => transactions.filter((item) => inRange(item, previousStart, start)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [transactions, period, reference],
  );

  const current = sumByType(currentItems);
  const previous = sumByType(previousItems);
  const balance = current.entradas - current.saidas;

  const buckets = buildBuckets(currentItems, period, start);
  const maxBucket = Math.max(0, ...buckets.flatMap((bucket) => [bucket.entradas, bucket.saidas]));
  const categories = buildCategoryTotals(currentItems);

  const goTo = (amount) => setReference(shiftPeriod(start, period, amount));

  const handleExport = () => {
    const slug = periodLabel.toLowerCase().replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '');
    exportCsv(currentItems, `figer-relatorio-${period}-${slug}.csv`);
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Relatórios</h1>
          <p className={styles.subtitle}>Entenda para onde seu dinheiro está indo.</p>
        </div>
        <button
          type="button"
          className={styles.exportButton}
          onClick={handleExport}
          disabled={currentItems.length === 0}
        >
          <DownloadIcon fontSize="small" />
          Exportar CSV
        </button>
      </header>

      <div className={styles.toolbar}>
        <div className={styles.segmented} role="group" aria-label="Período do relatório">
          {PERIODS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={item.id === period ? styles.segmentActive : ''}
              aria-pressed={item.id === period}
              onClick={() => setPeriod(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className={styles.periodNav}>
          <button type="button" onClick={() => goTo(-1)} aria-label="Período anterior">
            <ChevronLeftIcon fontSize="small" />
          </button>
          <span className={styles.periodLabel} aria-live="polite">
            {periodLabel}
          </span>
          <button type="button" onClick={() => goTo(1)} aria-label="Próximo período">
            <ChevronRightIcon fontSize="small" />
          </button>
        </div>
      </div>

      {isPending && <p className={styles.message}>Carregando relatórios...</p>}
      {isError && (
        <p className={styles.error} role="alert">
          {error.message}
        </p>
      )}

      {!isPending && !isError && (
        <>
          <section className={styles.kpis} aria-label="Resumo do período">
            <article className={`${styles.card} ${styles.cardBalance}`}>
              <span className={styles.label}>Saldo do período</span>
              <strong className={`${styles.value} ${balance < 0 ? styles.expense : styles.neutral}`}>
                {currency.format(balance)}
              </strong>
              <p className={styles.note}>Entradas menos saídas em {periodLabel}</p>
            </article>

            <article className={`${styles.card} ${styles.cardIncome}`}>
              <span className={styles.label}>Entradas</span>
              <strong className={`${styles.value} ${styles.income}`}>
                {currency.format(current.entradas)}
              </strong>
              <Comparison
                current={current.entradas}
                previous={previous.entradas}
                previousLabel={periodConfig.previousLabel}
                higherIsBetter
              />
            </article>

            <article className={`${styles.card} ${styles.cardExpense}`}>
              <span className={styles.label}>Saídas</span>
              <strong className={`${styles.value} ${styles.expense}`}>
                {currency.format(current.saidas)}
              </strong>
              <Comparison
                current={current.saidas}
                previous={previous.saidas}
                previousLabel={periodConfig.previousLabel}
                higherIsBetter={false}
              />
            </article>
          </section>

          {currentItems.length === 0 ? (
            <p className={styles.message}>Nenhuma movimentação neste período.</p>
          ) : (
            <div className={styles.grid}>
              <section className={styles.chartCard} aria-labelledby="chart-flow-title">
                <div className={styles.chartHeader}>
                  <div>
                    <h2 id="chart-flow-title" className={styles.chartTitle}>
                      Entradas e saídas
                    </h2>
                    <p className={styles.chartSubtitle}>
                      Comparativo por {period === 'ano' ? 'mês' : period === 'semana' ? 'dia' : 'semana'}
                    </p>
                  </div>
                  <ul className={styles.legend}>
                    <li>
                      <span className={`${styles.dot} ${styles.dotIncome}`} /> Entradas
                    </li>
                    <li>
                      <span className={`${styles.dot} ${styles.dotExpense}`} /> Saídas
                    </li>
                  </ul>
                </div>

                <div className={styles.chart}>
                  {buckets.map((bucket) => (
                    <div key={bucket.label} className={styles.group}>
                      <div className={styles.bars}>
                        <span
                          className={`${styles.bar} ${styles.barIncome}`}
                          style={{ height: `${maxBucket ? (bucket.entradas / maxBucket) * 100 : 0}%` }}
                          title={`Entradas: ${currency.format(bucket.entradas)}`}
                          role="img"
                          aria-label={`${bucket.label}, entradas ${currency.format(bucket.entradas)}`}
                        />
                        <span
                          className={`${styles.bar} ${styles.barExpense}`}
                          style={{ height: `${maxBucket ? (bucket.saidas / maxBucket) * 100 : 0}%` }}
                          title={`Saídas: ${currency.format(bucket.saidas)}`}
                          role="img"
                          aria-label={`${bucket.label}, saídas ${currency.format(bucket.saidas)}`}
                        />
                      </div>
                      <span className={styles.groupLabel}>{bucket.label}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section className={styles.chartCard} aria-labelledby="chart-category-title">
                <h2 id="chart-category-title" className={styles.chartTitle}>
                  Gastos por categoria
                </h2>
                <p className={styles.chartSubtitle}>Total de {currency.format(current.saidas)}</p>

                {categories.length === 0 ? (
                  <p className={styles.message}>Nenhuma saída neste período.</p>
                ) : (
                  <ul className={styles.categoryList}>
                    {categories.map((category, index) => {
                      const share = current.saidas ? (category.total / current.saidas) * 100 : 0;
                      const color = CATEGORY_COLORS[index % CATEGORY_COLORS.length];

                      return (
                        <li key={category.name} className={styles.categoryItem}>
                          <div className={styles.categoryTop}>
                            <span className={styles.categoryName}>
                              <span className={styles.dot} style={{ background: color }} />
                              {category.name}
                            </span>
                            <span className={styles.categoryValue}>
                              {currency.format(category.total)} · {percent.format(share)}%
                            </span>
                          </div>
                          <div className={styles.track}>
                            <span
                              className={styles.fill}
                              style={{ width: `${share}%`, background: color }}
                            />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            </div>
          )}
        </>
      )}
    </div>
  );
}