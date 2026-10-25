import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import App from './App.jsx';
import './index.css';

// Configuração do TanStack Query para gerenciar o cache das requisições ao Flask
const queryClient = new QueryClient();

// Configuração base do tema do Material UI
const theme = createTheme({
  palette: {
    primary: {
      main: '#a020f0', // Tom roxo do protótipo
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>
);