import { NavLink, useNavigate } from 'react-router-dom';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import GridViewOutlinedIcon from '@mui/icons-material/GridViewOutlined';
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined';
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import styles from './Sidebar.module.css';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: GridViewOutlinedIcon, end: true },
  { to: '/categorias', label: 'Categorias', icon: LocalOfferOutlinedIcon },
  { to: '/relatorios', label: 'Relatórios', icon: BarChartOutlinedIcon },
  { to: '/conta', label: 'Minha conta', icon: PersonOutlineOutlinedIcon },
];

const DEFAULT_USER = { name: 'Gabriela Alves', email: 'gabriela@email.com' };

function getInitials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return `${first}${last}`.toUpperCase();
}

export default function Sidebar({ user = DEFAULT_USER }) {
  const navigate = useNavigate();

  const handleLogout = () => {
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

      <div className={styles.user}>
        <span className={styles.avatar} aria-hidden="true">
          {getInitials(user.name)}
        </span>
        <div className={styles.userInfo}>
          <strong className={styles.userName}>{user.name}</strong>
          <span className={styles.userEmail}>{user.email}</span>
        </div>
        <button type="button" className={styles.logout} onClick={handleLogout} aria-label="Sair">
          <LogoutOutlinedIcon fontSize="small" />
        </button>
      </div>
    </aside>
  );
}
