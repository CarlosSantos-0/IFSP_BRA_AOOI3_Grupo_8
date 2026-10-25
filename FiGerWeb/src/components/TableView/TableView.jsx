import { formatCurrency, formatDate } from '../../utils/formatters';
import styles from './TableView.module.css';

export default function TableView({ movimentacoes = [] }) {
  return (
    <div className={styles.tableContainer}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th scope="col">Descrição</th>
            <th scope="col">Categoria</th>
            <th scope="col">Data</th>
            <th scope="col">Tipo</th>
            <th scope="col">Valor</th>
          </tr>
        </thead>
        <tbody>
          {movimentacoes.map((transaction, index) => (
            <tr
              key={transaction.id ?? `${transaction.data}-${transaction.descricao}-${index}`}
            >
              <td className={styles.description}>{transaction.descricao || 'Sem descrição'}</td>
              <td className={styles.category}>{transaction.categoria || 'Outros'}</td>
              <td>
                <time dateTime={transaction.data}>{formatDate(transaction.data)}</time>
              </td>
              <td>
                <span
                  className={`${styles.type} ${
                    transaction.tipo === 'entrada' ? styles.income : styles.expense
                  }`}
                >
                  {transaction.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                </span>
              </td>
              <td
                className={
                  transaction.tipo === 'entrada' ? styles.incomeAmount : styles.expenseAmount
                }
              >
                {formatCurrency(transaction.valor)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
