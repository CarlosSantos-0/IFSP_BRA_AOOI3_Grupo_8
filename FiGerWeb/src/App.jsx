import { Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard/Dashboard.jsx';
import './App.css'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
    </Routes>
  );
}