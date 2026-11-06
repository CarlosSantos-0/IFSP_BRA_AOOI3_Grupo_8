import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const CATEGORIES_QUERY_KEY = ['categorias'];

async function readError(response, fallback) {
  try {
    const body = await response.json();
    return body.erro ?? body.error ?? body.mensagem ?? body.message ?? fallback;
  } catch {
    return fallback;
  }
}

async function fetchCategories() {
  const response = await fetch(`${API_BASE_URL}/api/categorias`);
  if (!response.ok) {
    throw new Error(await readError(response, 'Não foi possível carregar as categorias.'));
  }

  const data = await response.json();
  const categories = Array.isArray(data) ? data : data.categorias;

  if (!Array.isArray(categories)) {
    throw new Error('As categorias recebidas da API têm um formato inválido.');
  }

  return categories;
}

export function useCategories() {
  return useQuery({
    queryKey: CATEGORIES_QUERY_KEY,
    queryFn: fetchCategories,
  });
}

function useRefreshCategoryData() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY });
    queryClient.invalidateQueries({ queryKey: ['resumo-categorias'] });
    queryClient.invalidateQueries({ queryKey: ['movimentacoes'] });
  };
}

export function useCreateCategory() {
  const refresh = useRefreshCategoryData();

  return useMutation({
    mutationFn: async ({ nome, cor }) => {
      const response = await fetch(`${API_BASE_URL}/api/categorias`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, cor }),
      });
      if (!response.ok) {
        throw new Error(await readError(response, 'Não foi possível criar a categoria.'));
      }
      return response.json().catch(() => null);
    },
    onSuccess: refresh,
  });
}

export function useUpdateCategory() {
  const refresh = useRefreshCategoryData();

  return useMutation({
    mutationFn: async ({ id, nome, cor }) => {
      const response = await fetch(`${API_BASE_URL}/api/categorias/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, cor }),
      });
      if (!response.ok) {
        throw new Error(await readError(response, 'Não foi possível salvar a categoria.'));
      }
      return response.json().catch(() => null);
    },
    onSuccess: refresh,
  });
}

export function useDeleteCategory() {
  const refresh = useRefreshCategoryData();

  return useMutation({
    mutationFn: async (id) => {
      const response = await fetch(`${API_BASE_URL}/api/categorias/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error(await readError(response, 'Não foi possível apagar a categoria.'));
      }
    },
    onSuccess: refresh,
  });
}
