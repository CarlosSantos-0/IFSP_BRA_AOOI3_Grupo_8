import { formatCurrency, formatDate, getCategoryColor } from '../../utils/formatters';
import styles from './KanbanView.module.css';

export default function KanbanView({ movimentacoes = [], agruparPor = 'categoria' }) {
  const columns = movimentacoes.reduce((groups, transaction) => {
    const name = transaction[agruparPor] || 'outros';
    groups[name] ??= [];
    groups[name].push(transaction);
    return groups;
  }, {});

  return (
    <div className={styles.kanbanContainer}>
      {Object.entries(columns).map(([name, transactions]) => {
        const total = transactions.reduce(
          (sum, transaction) => sum + Number(transaction.valor || 0),
          0,
        );

        return (
          <section className={styles.column} key={name} aria-label={name}>
            <header className={styles.columnHeader}>
              <div className={styles.columnTitle}>
                <span
                  className={styles.indicator}
                  style={{ backgroundColor: getCategoryColor(name) }}
                  aria-hidden="true"
                />
                <h3>{name}</h3>
              </div>
              <span className={styles.count}>{transactions.length}</span>
            </header>
            <p className={styles.columnTotal}>{formatCurrency(total)}</p>
            <div className={styles.cardList}>
              {transactions.map((transaction, index) => (
                <article
                  className={styles.card}
                  key={transaction.id ?? `${transaction.data}-${transaction.descricao}-${index}`}
                >
                  <span
                    className={`${styles.type} ${
                      transaction.tipo === 'entrada' ? styles.income : styles.expense
                    }`}
                  >
                    {transaction.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                  </span>
                  <h4>{transaction.descricao || 'Sem descrição'}</h4>
                  <div className={styles.cardBottom}>
                    <span
                      className={
                        transaction.tipo === 'entrada' ? styles.incomeAmount : styles.expenseAmount
                      }
                    >
                      {formatCurrency(transaction.valor)}
                    </span>
                    <time dateTime={transaction.data}>{formatDate(transaction.data)}</time>
                  </div>
                </article>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
