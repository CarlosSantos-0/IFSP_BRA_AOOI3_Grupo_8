import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import KanbanView from '../KanbanView/KanbanView';
import TableView from '../TableView/TableView';
import styles from './TransactionViewManager.module.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

async function fetchTransactions() {
  const response = await fetch(`${API_BASE_URL}/api/movimentacoes`);
  if (!response.ok) {
    throw new Error('Não foi possível carregar as movimentações.');
  }

  const data = await response.json();
  const transactions = Array.isArray(data) ? data : data.movimentacoes;

  if (!Array.isArray(transactions)) {
    throw new Error('As movimentações recebidas da API têm um formato inválido.');
  }

  return transactions;
}

export default function TransactionViewManager() {
  const [view, setView] = useState('table');
  const [typeFilter, setTypeFilter] = useState('todos');
  const [categoryFilter, setCategoryFilter] = useState('todas');
  const [search, setSearch] = useState('');
  const [groupBy, setGroupBy] = useState('categoria');

  const {
    data: transactions = [],
    isPending,
    isError,
    error,
  } = useQuery({
    queryKey: ['movimentacoes'],
    queryFn: fetchTransactions,
  });

  const categories = useMemo(
    () =>
      [...new Set(transactions.map((transaction) => transaction.categoria).filter(Boolean))],
    [transactions],
  );

  const filteredTransactions = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase('pt-BR');

    return transactions.filter((transaction) => {
      const matchesType = typeFilter === 'todos' || transaction.tipo === typeFilter;
      const matchesCategory =
        categoryFilter === 'todas' || transaction.categoria === categoryFilter;
      const matchesSearch =
        !normalizedSearch ||
        String(transaction.descricao ?? '')
          .toLocaleLowerCase('pt-BR')
          .includes(normalizedSearch);

      return matchesType && matchesCategory && matchesSearch;
    });
  }, [categoryFilter, search, transactions, typeFilter]);

  return (
    <section className={styles.section} aria-labelledby="transactions-title">
      <div className={styles.heading}>
        <div>
          <span className={styles.eyebrow}>MOVIMENTAÇÕES</span>
          <h2 id="transactions-title">Suas movimentações</h2>
        </div>
        <div className={styles.viewToggle} aria-label="Modo de visualização">
          <button
            type="button"
            className={view === 'table' ? styles.activeView : ''}
            aria-pressed={view === 'table'}
            onClick={() => setView('table')}
          >
            Tabela
          </button>
          <button
            type="button"
            className={view === 'kanban' ? styles.activeView : ''}
            aria-pressed={view === 'kanban'}
            onClick={() => setView('kanban')}
          >
            Kanban
          </button>
        </div>
      </div>

      <div className={styles.filters}>
        <label className={styles.searchField}>
          <span>Buscar</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Descrição da movimentação"
          />
        </label>
        <label>
          <span>Tipo</span>
          <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
            <option value="todos">Todos os tipos</option>
            <option value="entrada">Entradas</option>
            <option value="saida">Saídas</option>
          </select>
        </label>
        <label>
          <span>Categoria</span>
          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
          >
            <option value="todas">Todas as categorias</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>
        {view === 'kanban' && (
          <label>
            <span>Agrupar por</span>
            <select value={groupBy} onChange={(event) => setGroupBy(event.target.value)}>
              <option value="categoria">Categoria</option>
              <option value="tipo">Tipo</option>
            </select>
          </label>
        )}
      </div>

      {isPending && <p className={styles.message}>Carregando movimentações...</p>}
      {isError && (
        <p className={styles.error} role="alert">
          {error.message}
        </p>
      )}
      {!isPending && !isError && filteredTransactions.length === 0 && (
        <p className={styles.message}>Nenhuma movimentação encontrada para esses filtros.</p>
      )}
      {!isPending && !isError && filteredTransactions.length > 0 && (
        view === 'table' ? (
          <TableView movimentacoes={filteredTransactions} />
        ) : (
          <KanbanView movimentacoes={filteredTransactions} agruparPor={groupBy} />
        )
      )}
    </section>
  );
}
