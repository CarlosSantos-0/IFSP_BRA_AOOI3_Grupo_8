import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { TextField, MenuItem, Select, Button, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import styles from './TransactionFormModal.module.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const today = new Date();
const DEFAULT_DATE = new Date(
  today.getTime() - today.getTimezoneOffset() * 60_000,
).toISOString().slice(0, 10);

export default function TransactionFormModal({ onClose }) {
  const queryClient = useQueryClient();

  const [tipo, setTipo] = useState('saida');
  const [valor, setValor] = useState('');
  const [data, setData] = useState(DEFAULT_DATE);
  const [descricao, setDescricao] = useState('');
  const [categoria, setCategoria] = useState('');

  const createTransaction = useMutation({
    mutationFn: async (novaMovimentacao) => {
      const response = await fetch(`${API_BASE_URL}/api/movimentacoes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novaMovimentacao),
      });
      if (!response.ok) {
        throw new Error('Não foi possível salvar a movimentação.');
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
    createTransaction.mutate({
      tipo,
      valor: Number(valor.replace(',', '.')),
      data,
      descricao: descricao.trim(),
      categoria,
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
          value={categoria} onChange={(e) => setCategoria(e.target.value)}
          required
        >
          <MenuItem value="" disabled>Selecione</MenuItem>
          <MenuItem value="comida">Comida</MenuItem>
          <MenuItem value="transporte">Transporte</MenuItem>
          <MenuItem value="moradia">Moradia</MenuItem>
        </Select>
      </div>

      {createTransaction.isError && (
        <p className={styles.error} role="alert">
          {createTransaction.error.message}
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