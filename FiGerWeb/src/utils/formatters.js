export const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value));
};

export const formatDate = (dateString) => {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('T')[0].split('-');
  return `${day}/${month}`;
};

export const CATEGORY_PRESET_COLORS = [
  '#2563eb',
  '#7c3aed',
  '#db2777',
  '#ea580c',
  '#0891b2',
  '#65a30d',
];

export const getCategoryColor = (categoryName) => {
  const colors = {
    renda: '#2563eb',
    comida: '#7c3aed',
    transporte: '#db2777',
    moradia: '#ea580c',
    lazer: '#0891b2',
    outros: '#65a30d',
  };
  return colors[categoryName?.toLowerCase().trim()] || '#94a3b8';
};