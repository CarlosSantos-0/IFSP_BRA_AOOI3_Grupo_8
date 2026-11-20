import { useState } from 'react';
import { Link } from 'react-router-dom';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import GridViewOutlinedIcon from '@mui/icons-material/GridViewOutlined';
import CloudOffOutlinedIcon from '@mui/icons-material/CloudOffOutlined';
import CloudDoneOutlinedIcon from '@mui/icons-material/CloudDoneOutlined';
import SyncIcon from '@mui/icons-material/Sync';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import TransactionFormModal from '../../components/TransactionFormModal/TransactionFormModal';
import InstallAppButton from '../../components/InstallAppButton/InstallAppButton';
import { useIsOnline, usePendingTransactions } from '../../hooks/useOfflineSync';
import { formatCurrency } from '../../utils/formatters';
import styles from './QuickAdd.module.css';

// Tela de abertura do app instalado (start_url do manifest): só o formulário
// de nova movimentação, pensado para registrar algo em poucos segundos.
// Funciona sem internet: o que for salvo offline aparece em "Aguardando envio".
export default function QuickAdd() {
  const isOnline = useIsOnline();
  const { pending, isSyncing, syncNow, discard } = usePendingTransactions();
  const [formKey, setFormKey] = useState(0);
  const [feedback, setFeedback] = useState('');

  const handleSaved = ({ offline }) => {
    setFeedback(
      offline
        ? 'Salvo no aparelho. Será enviado quando a internet voltar.'
        : 'Movimentação registrada!',
    );
    setFormKey((key) => key + 1); // remonta o formulário limpo para o próximo registro
  };

  return (
    <div className={styles.page}>
      <header className={styles.topbar}>
        <div className={styles.brand}>
          <span className={styles.logo} aria-hidden="true">
            <AccountBalanceWalletOutlinedIcon fontSize="small" />
          </span>
          <span>FiGer</span>
        </div>

        <span className={`${styles.status} ${isOnline ? styles.online : styles.offline}`}>
          {isOnline ? <CloudDoneOutlinedIcon fontSize="inherit" /> : <CloudOffOutlinedIcon fontSize="inherit" />}
          {isOnline ? 'Online' : 'Offline'}
        </span>

        <Link to="/" className={styles.dashboardLink}>
          <GridViewOutlinedIcon fontSize="small" />
          <span>Painel</span>
        </Link>
      </header>

      <main className={styles.main}>
        {feedback && (
          <p className={styles.feedback} role="status">
            {feedback}
          </p>
        )}

        <div className={styles.card}>
          <TransactionFormModal key={formKey} onSaved={handleSaved} />
        </div>

        {pending.length > 0 && (
          <section className={styles.pending} aria-label="Aguardando envio">
            <div className={styles.pendingHeader}>
              <h2>Aguardando envio ({pending.length})</h2>
              <button
                type="button"
                className={styles.syncButton}
                onClick={syncNow}
                disabled={!isOnline || isSyncing}
              >
                <SyncIcon fontSize="small" className={isSyncing ? styles.spinning : ''} />
                {isSyncing ? 'Enviando...' : 'Enviar agora'}
              </button>
            </div>

            <ul className={styles.pendingList}>
              {pending.map((item) => (
                <li key={item.localId} className={styles.pendingItem}>
                  <div className={styles.pendingInfo}>
                    <strong>{item.payload.descricao || 'Sem descrição'}</strong>
                    <span>
                      {item.categoriaNome ?? 'Categoria'} ·{' '}
                      {item.payload.data.split('-').reverse().join('/')}
                    </span>
                    {item.erro && <span className={styles.pendingError}>{item.erro}</span>}
                  </div>
                  <span
                    className={item.payload.tipo === 'entrada' ? styles.income : styles.expense}
                  >
                    {item.payload.tipo === 'entrada' ? '+' : '−'}
                    {formatCurrency(item.payload.valor)}
                  </span>
                  {item.erro && (
                    <button
                      type="button"
                      className={styles.discard}
                      onClick={() => discard(item.localId)}
                      aria-label="Descartar"
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
            {!isOnline && (
              <p className={styles.pendingHint}>
                Assim que o aparelho se conectar, o FiGer envia tudo automaticamente.
              </p>
            )}
          </section>
        )}

        <InstallAppButton className={styles.install} />
      </main>
    </div>
  );
}
