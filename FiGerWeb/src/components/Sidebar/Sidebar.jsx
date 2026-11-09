import { Link, NavLink, useNavigate } from 'react-router-dom';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import GridViewOutlinedIcon from '@mui/icons-material/GridViewOutlined';
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined';
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { useAuth } from '../../hooks/useAuth';
import styles from './Sidebar.module.css';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: GridViewOutlinedIcon, end: true },
  { to: '/categorias', label: 'Categorias', icon: LocalOfferOutlinedIcon },
  { to: '/relatorios', label: 'Relatórios', icon: BarChartOutlinedIcon },
  { to: '/conta', label: 'Minha conta', icon: PersonOutlineOutlinedIcon },
];

function getInitials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return `${first}${last}`.toUpperCase();
}

export default function Sidebar() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const displayName = user?.nome ?? user?.name ?? 'Usuário';
  const displayEmail = user?.email ?? 'usuario@exemplo.com';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <span className={styles.logo} aria-hidden="true">
          <AccountBalanceWalletOutlinedIcon fontSize="small" />
        </span>
        <span className={styles.brandName}>FiGer</span>
      </div>

      <nav className={styles.nav} aria-label="Navegação principal">
        <span className={styles.menuLabel}>MENU</span>
        <ul className={styles.list}>
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  isActive ? `${styles.link} ${styles.active}` : styles.link
                }
              >
                <Icon fontSize="small" />
                <span>{label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {isAuthenticated ? (
        <div className={styles.user}>
          <span className={styles.avatar} aria-hidden="true">
            {getInitials(displayName)}
          </span>
          <div className={styles.userInfo}>
            <strong className={styles.userName}>{displayName}</strong>
            <span className={styles.userEmail}>{displayEmail}</span>
          </div>
          <button
            type="button"
            className={styles.logout}
            onClick={handleLogout}
            aria-label="Sair"
          >
            <LogoutOutlinedIcon fontSize="small" />
          </button>
        </div>
      ) : (
        <div className={styles.guest}>
          <div className={styles.guestHeader}>
            <span className={styles.guestIcon} aria-hidden="true">
              <LockOutlinedIcon fontSize="small" />
            </span>
            <div>
              <p className={styles.guestTitle}>Você não está conectado</p>
              <p className={styles.guestText}>Faça login para ver e salvar suas finanças.</p>
            </div>
          </div>
          <Link to="/login" className={styles.guestButton}>
            Fazer login
          </Link>
        </div>
      )}
    </aside>
  );
}