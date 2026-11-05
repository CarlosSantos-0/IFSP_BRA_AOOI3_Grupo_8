import { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
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

// Quantidade de movimentações da categoria, se a API enviar. Senão, retorna undefined
// e a linha "N movimentações no período" simplesmente não aparece.
function getTransactionCount(category) {
  const raw = category.quantidade ?? category.qtd ?? category.count ?? category.movimentacoes;
  if (typeof raw === 'number') return raw;
  if (Array.isArray(raw)) return raw.length;
  return undefined;
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

  const carouselRef = useRef(null);
  const [scrollState, setScrollState] = useState({ canPrev: false, canNext: false });

  const updateScrollState = useCallback(() => {
    const element = carouselRef.current;
    if (!element) return;

    const canPrev = element.scrollLeft > 0;
    const canNext = element.scrollLeft + element.clientWidth < element.scrollWidth - 1;

    setScrollState((current) =>
      current.canPrev === canPrev && current.canNext === canNext
        ? current
        : { canPrev, canNext },
    );
  }, []);

  useEffect(() => {
    updateScrollState();
    window.addEventListener('resize', updateScrollState);
    return () => window.removeEventListener('resize', updateScrollState);
  }, [isPending, isError, categories.length, updateScrollState]);

  const scrollCarousel = (direction) => {
    const element = carouselRef.current;
    if (!element) return;
    element.scrollBy({ left: direction * element.clientWidth * 0.8, behavior: 'smooth' });
  };

  const items = categories.map((category) => ({
    name: category.categoria ?? category.category ?? 'Outros',
    total: Number(category.total ?? category.valor ?? 0) || 0,
    count: getTransactionCount(category),
  }));
  const grandTotal = items.reduce((sum, item) => sum + item.total, 0);

  return (
    <section className={styles.section} aria-labelledby="category-summary-title">
      <div className={styles.heading}>
        <div>
          <span className={styles.eyebrow}>VISÃO PRINCIPAL</span>
          <h2 id="category-summary-title">Gastos por categoria</h2>
          <p className={styles.subtitle}>Veja rapidamente onde seu dinheiro foi usado neste mês.</p>
        </div>

        <div className={styles.nav}>
          <button
            type="button"
            className={styles.navButton}
            onClick={() => scrollCarousel(-1)}
            disabled={!scrollState.canPrev}
            aria-label="Ver categorias anteriores"
          >
            <ArrowBackIcon fontSize="small" />
          </button>
          <button
            type="button"
            className={styles.navButton}
            onClick={() => scrollCarousel(1)}
            disabled={!scrollState.canNext}
            aria-label="Ver próximas categorias"
          >
            <ArrowForwardIcon fontSize="small" />
          </button>
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
        <div
          className={styles.carousel}
          ref={carouselRef}
          onScroll={updateScrollState}
          aria-label="Totais por categoria"
        >
          {items.map(({ name, total, count }) => {
            const share = grandTotal > 0 ? (total / grandTotal) * 100 : 0;
            const percent = Math.round(share);

            return (
              <article
                className={styles.card}
                key={name}
                style={{ '--category-color': getCategoryColor(name) }}
              >
                <span className={styles.stripe} aria-hidden="true" />

                <div className={styles.cardTop}>
                  <span className={styles.iconTile} aria-hidden="true">
                    <LocalOfferOutlinedIcon fontSize="small" />
                  </span>
                  <span className={styles.share}>{percent}% dos gastos</span>
                </div>

                <h3 className={styles.name}>{name}</h3>
                <p className={styles.amount}>{formatCurrency(total)}</p>

                <div
                  className={styles.track}
                  role="progressbar"
                  aria-label={`${name}: ${percent}% dos gastos`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={percent}
                >
                  <span className={styles.fill} style={{ width: `${share}%` }} />
                </div>

                {count !== undefined && (
                  <p className={styles.count}>
                    {count} {count === 1 ? 'movimentação' : 'movimentações'} no período
                  </p>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}