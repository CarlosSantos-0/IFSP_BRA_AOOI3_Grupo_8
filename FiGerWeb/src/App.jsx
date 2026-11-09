import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthProvider.jsx';
import { useAuth } from './contexts/useAuth.js';
import AppLayout from './layouts/AppLayout/AppLayout.jsx';
import Dashboard from './pages/Dashboard/Dashboard.jsx';
import Categories from './pages/Categories/Categories.jsx';
import Reports from './pages/Reports/Reports.jsx';
import Account from './pages/Account/Account.jsx';
import Login from './pages/Login/Login.jsx';
import Register from './pages/Register/Register.jsx';
import ProtectedRoute from './routes/ProtectedRoute.jsx';

function PublicRoute({ children }) {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/cadastro" element={<PublicRoute><Register /></PublicRoute>} />
        

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="categorias" element={<Categories />} />
            <Route path="relatorios" element={<Reports />} />
            <Route path="conta" element={<Account />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}