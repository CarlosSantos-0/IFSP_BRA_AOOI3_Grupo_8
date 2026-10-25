import { useState } from 'react';
import { Button, Dialog } from '@mui/material';
import styles from './Dashboard.module.css';
import CategorySummary from '../../components/CategorySummary/CategorySummary';
import TransactionFormModal from '../../components/TransactionFormModal/TransactionFormModal';
import TransactionViewManager from '../../components/TransactionViewManager/TransactionViewManager';

export default function Dashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleGroup}>
          <h1>Dashboard</h1>
          <p>Acompanhe suas finanças.</p>
        </div>
        <Button
          variant="contained"
          onClick={() => setIsModalOpen(true)}
          disableElevation
          sx={{ borderRadius: '8px', textTransform: 'none' }}
        >
          + Nova movimentação
        </Button>
      </header>

      <main className={styles.content}>
        <CategorySummary />
        <TransactionViewManager />
      </main>

      <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <TransactionFormModal onClose={() => setIsModalOpen(false)} />
      </Dialog>
    </div>
  );
}