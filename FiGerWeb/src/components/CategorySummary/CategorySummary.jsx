import { useQuery } from '@tanstack/react-query';
import { formatCurrency, getCategoryColor } from '../../utils/formatters';
import styles from './CategorySummary.module.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

async function fetchCategorySummary() {
  const response = await fetch(`${API_BASE_URL}/api/resumo-categorias`);
  if (!response.ok) {
    throw new Error('Não foi possível carregar o resumo por categoria.');
  }

  const data = await response.json();
  const categories = Array.isArray(data) ? data : data.categorias;

  if (!Array.isArray(categories)) {
    throw new Error('O resumo recebido da API tem um formato inválido.');
  }

  return categories;
}

export default function CategorySummary() {
  const {
    data: categories = [],
    isPending,
    isError,
    error,
  } = useQuery({
    queryKey: ['resumo-categorias'],
    queryFn: fetchCategorySummary,
  });

  return (
    <section className={styles.section} aria-labelledby="category-summary-title">
      <div className={styles.heading}>
        <div>
          <span className={styles.eyebrow}>VISÃO GERAL</span>
          <h2 id="category-summary-title">Resumo por categoria</h2>
        </div>
      </div>

      {isPending && <p className={styles.message}>Carregando categorias...</p>}
      {isError && (
        <p className={styles.error} role="alert">
          {error.message}
        </p>
      )}
      {!isPending && !isError && categories.length === 0 && (
        <p className={styles.message}>Nenhuma categoria encontrada.</p>
      )}

      {!isPending && !isError && categories.length > 0 && (
        <div className={styles.carousel} aria-label="Totais por categoria">
          {categories.map((category) => {
            const name = category.categoria ?? category.category ?? 'Outros';
            const total = category.total ?? category.valor ?? 0;

            return (
              <article className={styles.card} key={name}>
                <span
                  className={styles.indicator}
                  style={{ backgroundColor: getCategoryColor(name) }}
                  aria-hidden="true"
                />
                <div className={styles.cardText}>
                  <h3>{name}</h3>
                  <p>{formatCurrency(total)}</p>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
