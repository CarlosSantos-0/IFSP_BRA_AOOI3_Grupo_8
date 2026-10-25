export const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', { 
    style: 'currency', 
    currency: 'BRL' 
  }).format(Number(value));
};

export const formatDate = (dateString) => {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('T')[0].split('-');
  return `${day}/${month}`; // Formato abreviado correspondente à tabela
};

export const getCategoryColor = (categoryName) => {
  const colors = {
    renda: '#3b82f6',
    comida: '#a855f7',
    transporte: '#ec4899',
    moradia: '#f97316',
    lazer: '#06b6d4',
  };
  return colors[categoryName?.toLowerCase().trim()] || '#cccccc';
};