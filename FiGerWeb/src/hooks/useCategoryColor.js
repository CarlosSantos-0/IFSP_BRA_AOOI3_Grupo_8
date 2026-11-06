import { useCallback } from 'react';
import { getCategoryColor } from '../utils/formatters';
import { useCategories } from './useCategories';

const normalize = (value = '') => String(value).trim().toLocaleLowerCase('pt-BR');

export function useCategoryColor() {
  const { data: categories = [] } = useCategories();

  return useCallback(
    (name) => {
      const key = normalize(name);
      const match = categories.find((category) => normalize(category.nome) === key);
      return match?.cor || getCategoryColor(name);
    },
    [categories],
  );
}
