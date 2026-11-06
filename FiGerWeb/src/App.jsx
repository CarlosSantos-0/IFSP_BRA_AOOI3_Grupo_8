import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './layouts/AppLayout/AppLayout.jsx';
import Dashboard from './pages/Dashboard/Dashboard.jsx';
import Categories from './pages/Categories/Categories.jsx';
import Reports from './pages/Reports/Reports.jsx';
import Account from './pages/Account/Account.jsx';
import Login from './pages/Login/Login.jsx';

export default function App() {
  return (
    <Routes>
      {/* Sem barra lateral */}
      <Route path="/login" element={<Login />} />

      {/* Páginas internas: todas dentro do AppLayout (barra lateral + <Outlet />) */}
      <Route element={<AppLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="categorias" element={<Categories />} />
        <Route path="relatorios" element={<Reports />} />
        <Route path="conta" element={<Account />} />
      </Route>

      {/* Qualquer endereço desconhecido volta para o Dashboard */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}