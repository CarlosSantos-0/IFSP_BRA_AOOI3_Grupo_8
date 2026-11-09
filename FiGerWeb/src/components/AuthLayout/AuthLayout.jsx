import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import ArrowOutwardIcon from '@mui/icons-material/ArrowOutward';
import BarChartIcon from '@mui/icons-material/BarChart';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import styles from './AuthLayout.module.css';

// Moldura de Login e Cadastro: painel verde à esquerda, formulário à direita.
// Os estilos do formulário (.form, .field, .submit...) também vêm de AuthLayout.module.css.
export default function AuthLayout({ children }) {
  return (
    <div className={styles.page}>
      <aside className={styles.brandPanel}>
        <div className={styles.brand}>
          <span className={styles.logo} aria-hidden="true">
            <AccountBalanceWalletOutlinedIcon fontSize="small" />
          </span>
          <span>FiGer</span>
        </div>

        <div className={styles.pitch}>
          <span className={styles.pitchEyebrow}>CONTROLE SIMPLES. DECISÕES MELHORES.</span>
          <h2>Organize seu mês sem planilha.</h2>
          <p>Suas finanças pessoais em um só lugar.</p>
        </div>

        <div className={styles.tiles} aria-hidden="true">
          <span className={styles.tile}><ArrowOutwardIcon fontSize="small" /></span>
          <span className={styles.tile}><BarChartIcon fontSize="small" /></span>
          <span className={styles.tile}><AttachMoneyIcon fontSize="small" /></span>
        </div>
      </aside>

      <main className={styles.formPanel}>
        <div className={styles.formWrap}>
          <div className={styles.mobileBrand}>
            <span className={styles.mobileLogo} aria-hidden="true">
              <AccountBalanceWalletOutlinedIcon fontSize="small" />
            </span>
            <span>FiGer</span>
          </div>

          {children}

          <p className={styles.legal}>© {new Date().getFullYear()} FiGer</p>
        </div>
      </main>
    </div>
  );
}
