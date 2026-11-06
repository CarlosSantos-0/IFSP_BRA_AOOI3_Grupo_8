import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthProvider.jsx';
import { useAuth } from './contexts/useAuth.js';
import AppLayout from './layouts/AppLayout/AppLayout.jsx';
import Dashboard from './pages/Dashboard/Dashboard.jsx';
import Categories from './pages/Categories/Categories.jsx';
import Reports from './pages/Reports/Reports.jsx';
import Account from './pages/Account/Account.jsx';
import Login from './pages/Login/Login.jsx';

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

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

        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="categorias" element={<Categories />} />
          <Route path="relatorios" element={<Reports />} />
          <Route path="conta" element={<Account />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}