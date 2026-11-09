import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { TextField, MenuItem, Select, Button, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import { useCategories, useFormasPagamento } from '../../hooks/useCategories';
import { apiFetch, readApiError } from '../../utils/api.js';
import styles from './TransactionFormModal.module.css';

const today = new Date();
const DEFAULT_DATE = new Date(
  today.getTime() - today.getTimezoneOffset() * 60_000,
).toISOString().slice(0, 10);

export default function TransactionFormModal({ onClose }) {
  const queryClient = useQueryClient();
  const { data: categories = [] } = useCategories();
  const { data: paymentMethods = [] } = useFormasPagamento();

  const categoryOptions =
    categories.length > 0
      ? categories.map((item) => ({ value: item.id, label: item.nome }))
      : [];

  const [tipo, setTipo] = useState('saida');
  const [valor, setValor] = useState('');
  const [data, setData] = useState(DEFAULT_DATE);
  const [descricao, setDescricao] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [formaId, setFormaId] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (categoryOptions.length > 0 && !categoriaId) {
      setCategoriaId(String(categoryOptions[0].value));
    }
  }, [categoryOptions, categoriaId]);

  const createTransaction = useMutation({
    mutationFn: async (novaMovimentacao) => {
      const response = await apiFetch('/api/movimentacoes', {
        method: 'POST',
        body: JSON.stringify(novaMovimentacao),
      });

      if (!response.ok) {
        throw new Error(await readApiError(response, 'Não foi possível salvar a movimentação.'));
      }

      return response.json().catch(() => null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resumo-categorias'] });
      queryClient.invalidateQueries({ queryKey: ['movimentacoes'] });
      onClose();
    },
  });

  const handleSalvar = (event) => {
    event.preventDefault();
    setFormError('');

    const numericValue = Number.parseFloat(String(valor).replace(',', '.'));
    if (!Number.isFinite(numericValue) || numericValue <= 0) {
      setFormError('Informe um valor maior que zero.');
      return;
    }

    createTransaction.mutate({
      tipo,
      valor: numericValue,
      data,
      descricao: descricao.trim(),
      id_categoria: Number(categoriaId),
      id_formpag: formaId ? Number(formaId) : null,
    });
  };

  return (
    <form className={styles.modalContainer} onSubmit={handleSalvar}>
      <header className={styles.header}>
        <div>
          <span className={styles.subtitle}>NOVO REGISTRO</span>
          <h2 className={styles.title}>Nova movimentação</h2>
        </div>
        <IconButton onClick={onClose} size="small" className={styles.closeBtn}>
          <CloseIcon />
        </IconButton>
      </header>

      <div className={styles.typeToggle}>
        <button
          type="button"
          className={`${styles.toggleBtn} ${tipo === 'entrada' ? styles.activeEntrada : ''}`}
          onClick={() => setTipo('entrada')}
        >
          <ArrowDownwardIcon fontSize="small" /> Entrada
        </button>
        <button
          type="button"
          className={`${styles.toggleBtn} ${tipo === 'saida' ? styles.activeSaida : ''}`}
          onClick={() => setTipo('saida')}
        >
          <ArrowUpwardIcon fontSize="small" /> Saída
        </button>
      </div>

      <div className={styles.formGrid}>
        <div className={styles.fieldGroup}>
          <label>Valor</label>
          <TextField
            fullWidth size="small" placeholder="0,00"
            value={valor} onChange={(e) => setValor(e.target.value)}
            type="number" inputProps={{ min: '0.01', step: '0.01' }}
            required
            InputProps={{ startAdornment: <span className={styles.currencyPrefix}>R$</span> }}
          />
        </div>
        
        <div className={styles.fieldGroup}>
          <label>Data</label>
          <TextField
            type="date" fullWidth size="small"
            value={data} onChange={(e) => setData(e.target.value)}
            required
          />
        </div>
      </div>

      <div className={styles.fieldGroupFull}>
        <label>Descrição</label>
        <TextField
          fullWidth size="small" placeholder="Ex.: Supermercado"
          value={descricao} onChange={(e) => setDescricao(e.target.value)}
          required
        />
      </div>

      <div className={styles.fieldGroupFull}>
        <label>Categoria</label>
        <Select
          fullWidth size="small" displayEmpty
          value={categoriaId}
          onChange={(event) => setCategoriaId(event.target.value)}
          required
        >
          <MenuItem value="" disabled>Selecione</MenuItem>
          {categoryOptions.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
      </div>

      <div className={styles.fieldGroupFull}>
        <label>Forma de pagamento</label>
        <Select
          fullWidth size="small" displayEmpty
          value={formaId}
          onChange={(event) => setFormaId(event.target.value)}
        >
          <MenuItem value="">Não informar</MenuItem>
          {paymentMethods.map((method) => (
            <MenuItem key={method.id} value={method.id}>
              {method.nome}
            </MenuItem>
          ))}
        </Select>
      </div>

      {(formError || createTransaction.isError) && (
        <p className={styles.error} role="alert">
          {formError || createTransaction.error?.message}
        </p>
      )}

      <footer className={styles.footer}>
        <Button type="button" onClick={onClose} sx={{ color: '#555', textTransform: 'none' }}>
          Cancelar
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={createTransaction.isPending}
          sx={{ backgroundColor: '#1A7A64', '&:hover': { backgroundColor: '#135c4b' }, textTransform: 'none' }}
        >
          {createTransaction.isPending ? 'Salvando...' : 'Salvar'}
        </Button>
      </footer>
    </form>
  );
}