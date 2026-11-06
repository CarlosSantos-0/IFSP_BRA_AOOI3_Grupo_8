import { useState } from 'react';
import { Dialog } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import CategoryFormModal from '../../components/CategoryFormModal/CategoryFormModal';
import { useCategories, useDeleteCategory } from '../../hooks/useCategories';
import { getCategoryColor } from '../../utils/formatters';
import styles from './Categories.module.css';

// Quantidade de movimentações no mês, se a API enviar. Senão a linha não aparece.
function getMonthlyCount(category) {
  const raw = category.movimentacoes_mes ?? category.quantidade_mes ?? category.quantidade;
  return typeof raw === 'number' ? raw : undefined;
}

export default function Categories() {
  const { data: categories = [], isPending, isError, error } = useCategories();
  const deleteCategory = useDeleteCategory();
  const [modal, setModal] = useState({ open: false, category: null });

  const openNew = () => setModal({ open: true, category: null });
  const openEdit = (category) => setModal({ open: true, category });
  // Mantém a categoria no estado para o conteúdo não sumir durante a animação de fechar
  const closeModal = () => setModal((current) => ({ ...current, open: false }));

  const handleDelete = (category) => {
    const confirmed = window.confirm(
      `Apagar a categoria "${category.nome}"? Essa ação não pode ser desfeita.`,
    );
    if (confirmed) deleteCategory.mutate(category.id);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleGroup}>
          <h1>Categorias</h1>
          <p>Organize suas movimentações do seu jeito.</p>
        </div>
        <button type="button" className={styles.newButton} onClick={openNew}>
          <AddIcon fontSize="small" />
          Nova categoria
        </button>
      </header>

      {isPending && <p className={styles.message}>Carregando categorias...</p>}
      {isError && (
        <p className={styles.error} role="alert">
          {error.message}
        </p>
      )}
      {deleteCategory.isError && (
        <p className={styles.error} role="alert">
          {deleteCategory.error.message}
        </p>
      )}
      {!isPending && !isError && categories.length === 0 && (
        <p className={styles.message}>
          Você ainda não tem categorias. Clique em "Nova categoria" para criar a primeira.
        </p>
      )}

      {categories.length > 0 && (
        <ul className={styles.grid}>
          {categories.map((category) => {
            const count = getMonthlyCount(category);
            const color = category.cor || getCategoryColor(category.nome);

            return (
              <li key={category.id ?? category.nome}>
                <article className={styles.card} style={{ '--category-color': color }}>
                  <div className={styles.cardMain}>
                    <span className={styles.iconTile} aria-hidden="true">
                      <LocalOfferOutlinedIcon fontSize="small" />
                    </span>
                    <div className={styles.cardText}>
                      <h2>{category.nome}</h2>
                      {count !== undefined && (
                        <p>
                          {count} {count === 1 ? 'movimentação' : 'movimentações'} este mês
                        </p>
                      )}
                    </div>
                  </div>

                  <div className={styles.cardActions}>
                    <button
                      type="button"
                      className={styles.editButton}
                      onClick={() => openEdit(category)}
                      aria-label={`Editar categoria ${category.nome}`}
                    >
                      <EditOutlinedIcon fontSize="small" />
                      Editar
                    </button>
                    <button
                      type="button"
                      className={styles.deleteButton}
                      onClick={() => handleDelete(category)}
                      disabled={deleteCategory.isPending}
                      aria-label={`Apagar categoria ${category.nome}`}
                    >
                      <DeleteOutlineOutlinedIcon fontSize="small" />
                    </button>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      )}

      <Dialog className={styles.dialog} open={modal.open} onClose={closeModal}>
        <CategoryFormModal
          key={modal.category?.id ?? 'nova'}
          category={modal.category}
          categories={categories}
          onClose={closeModal}
        />
      </Dialog>
    </div>
  );
}