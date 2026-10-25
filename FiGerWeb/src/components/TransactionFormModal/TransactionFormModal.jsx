import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { TextField, MenuItem, Select, Button, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import styles from './TransactionFormModal.module.css';

export default function TransactionFormModal({ onClose }) {
  const queryClient = useQueryClient();

  // Estados dos campos do formulário baseados no protótipo
  const [tipo, setTipo] = useState('saida');
  const [valor, setValor] = useState('');
  const [data, setData] = useState('2026-10-24'); // Data default do protótipo
  const [descricao, setDescricao] = useState('');
  const [categoria, setCategoria] = useState('');

  // Configuração do POST com TanStack Query
  const createTransaction = useMutation({
    mutationFn: async (novaMovimentacao) => {
      const response = await fetch('http://localhost:5000/api/movimentacoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novaMovimentacao),
      });
      if (!response.ok) throw new Error('Erro ao salvar');
      return response.json();
    },
    onSuccess: () => {
      // Invalida os caches dos GETs, forçando os widgets do Dashboard a recarregarem sozinhos
      queryClient.invalidateQueries({ queryKey: ['resumo-categorias'] });
      queryClient.invalidateQueries({ queryKey: ['movimentacoes'] });
      onClose(); // Fecha o pop-up
    },
  });

  const handleSalvar = () => {
    createTransaction.mutate({ tipo, valor, data, descricao, categoria });
  };

  return (
    <div className={styles.modalContainer}>
      <header className={styles.header}>
        <div>
          <span className={styles.subtitle}>NOVO REGISTRO</span>
          <h2 className={styles.title}>Nova movimentação</h2>
        </div>
        <IconButton onClick={onClose} size="small" className={styles.closeBtn}>
          <CloseIcon />
        </IconButton>
      </header>

      {/* Botões de Toggle: Entrada e Saída */}
      <div className={styles.typeToggle}>
        <button 
          className={`${styles.toggleBtn} ${tipo === 'entrada' ? styles.activeEntrada : ''}`}
          onClick={() => setTipo('entrada')}
        >
          <ArrowDownwardIcon fontSize="small" /> Entrada
        </button>
        <button 
          className={`${styles.toggleBtn} ${tipo === 'saida' ? styles.activeSaida : ''}`}
          onClick={() => setTipo('saida')}
        >
          <ArrowUpwardIcon fontSize="small" /> Saída
        </button>
      </div>

      {/* Formulário */}
      <div className={styles.formGrid}>
        <div className={styles.fieldGroup}>
          <label>Valor</label>
          <TextField 
            fullWidth size="small" placeholder="0,00"
            value={valor} onChange={(e) => setValor(e.target.value)}
            InputProps={{ startAdornment: <span className={styles.currencyPrefix}>R$</span> }}
          />
        </div>
        
        <div className={styles.fieldGroup}>
          <label>Data</label>
          <TextField 
            type="date" fullWidth size="small"
            value={data} onChange={(e) => setData(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.fieldGroupFull}>
        <label>Descrição</label>
        <TextField 
          fullWidth size="small" placeholder="Ex.: Supermercado"
          value={descricao} onChange={(e) => setDescricao(e.target.value)}
        />
      </div>

      <div className={styles.fieldGroupFull}>
        <label>Categoria</label>
        <Select 
          fullWidth size="small" displayEmpty
          value={categoria} onChange={(e) => setCategoria(e.target.value)}
        >
          <MenuItem value="" disabled>Selecione</MenuItem>
          <MenuItem value="comida">Comida</MenuItem>
          <MenuItem value="transporte">Transporte</MenuItem>
          <MenuItem value="moradia">Moradia</MenuItem>
        </Select>
      </div>

      {/* Footer */}
      <footer className={styles.footer}>
        <Button onClick={onClose} sx={{ color: '#555', textTransform: 'none' }}>
          Cancelar
        </Button>
        <Button 
          variant="contained" 
          onClick={handleSalvar}
          disabled={createTransaction.isLoading}
          sx={{ backgroundColor: '#1A7A64', '&:hover': { backgroundColor: '#135c4b' }, textTransform: 'none' }}
        >
          Salvar
        </Button>
      </footer>
    </div>
  );
}