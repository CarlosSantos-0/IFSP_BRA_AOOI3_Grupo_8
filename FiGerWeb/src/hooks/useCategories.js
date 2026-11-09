import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch, readApiError } from '../utils/api.js';

export const CATEGORIES_QUERY_KEY = ['categorias'];
export const PAYMENT_METHODS_QUERY_KEY = ['formas-pagamento'];

async function fetchCategories() {
  const response = await apiFetch('/api/categorias');
  if (!response.ok) {
    throw new Error(await readApiError(response, 'Não foi possível carregar as categorias.'));
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

export function useFormasPagamento() {
  return useQuery({
    queryKey: PAYMENT_METHODS_QUERY_KEY,
    queryFn: async () => {
      const response = await apiFetch('/api/formas-pagamento');

      if (response.status === 404) {
        return [];
      }

      if (!response.ok) {
        throw new Error(
          await readApiError(response, 'Não foi possível carregar as formas de pagamento.'),
        );
      }

      const data = await response.json();
      const methods = Array.isArray(data) ? data : data.formas;

      if (!Array.isArray(methods)) {
        throw new Error('As formas de pagamento recebidas da API têm um formato inválido.');
      }

      return methods;
    },
    staleTime: Infinity,
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
      const response = await apiFetch('/api/categorias', {
        method: 'POST',
        body: JSON.stringify({ nome, cor }),
      });
      if (!response.ok) {
        throw new Error(await readApiError(response, 'Não foi possível criar a categoria.'));
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
      const response = await apiFetch(`/api/categorias/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ nome, cor }),
      });
      if (!response.ok) {
        throw new Error(await readApiError(response, 'Não foi possível salvar a categoria.'));
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
      const response = await apiFetch(`/api/categorias/${id}`, { method: 'DELETE' });
      if (!response.ok) {
        throw new Error(await readApiError(response, 'Não foi possível apagar a categoria.'));
      }
    },
    onSuccess: refresh,
  });
}
