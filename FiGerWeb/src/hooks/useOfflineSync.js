import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { apiFetch, readApiError } from '../utils/api.js';
import {
  QUEUE_CHANGED_EVENT,
  getPendingTransactions,
  isNetworkError,
  markPendingError,
  removePendingTransaction,
} from '../utils/offlineStore.js';

let syncInProgress = null;

// Envia à API as movimentações salvas offline, na ordem em que foram criadas.
// Devolve quantas foram enviadas com sucesso.
export function syncPendingTransactions() {
  // Evita duas sincronizações ao mesmo tempo (o que duplicaria registros)
  if (syncInProgress) return syncInProgress;

  syncInProgress = (async () => {
    let sent = 0;

    for (const item of getPendingTransactions()) {
      if (item.erro) continue; // recusada pela API: espera a pessoa decidir

      let response;
      try {
        response = await apiFetch('/api/movimentacoes', {
          method: 'POST',
          body: JSON.stringify(item.payload),
        });
      } catch (error) {
        if (isNetworkError(error)) break; // ainda sem internet: tenta depois
        throw error;
      }

      if (response.ok) {
        removePendingTransaction(item.localId);
        sent += 1;
      } else if (response.status === 401 || response.status >= 500) {
        break; // sessão expirou ou servidor com problema: tenta depois
      } else {
        // 400 etc.: os dados não são aceitos (ex.: categoria apagada)
        markPendingError(
          item.localId,
          await readApiError(response, 'A API recusou esta movimentação.'),
        );
      }
    }

    return sent;
  })().finally(() => {
    syncInProgress = null;
  });

  return syncInProgress;
}

function subscribeToQueue(callback) {
  window.addEventListener(QUEUE_CHANGED_EVENT, callback);
  window.addEventListener('storage', callback); // mudanças vindas de outra aba
  return () => {
    window.removeEventListener(QUEUE_CHANGED_EVENT, callback);
    window.removeEventListener('storage', callback);
  };
}

let lastSnapshot = [];
function getQueueSnapshot() {
  // useSyncExternalStore exige o mesmo objeto enquanto nada mudou
  const next = getPendingTransactions();
  if (JSON.stringify(next) !== JSON.stringify(lastSnapshot)) lastSnapshot = next;
  return lastSnapshot;
}

function subscribeToOnline(callback) {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

export function useIsOnline() {
  return useSyncExternalStore(subscribeToOnline, () => navigator.onLine);
}

// Lista de pendentes + ação de sincronizar, para mostrar na tela.
export function usePendingTransactions() {
  const queryClient = useQueryClient();
  const pending = useSyncExternalStore(subscribeToQueue, getQueueSnapshot);
  const [isSyncing, setIsSyncing] = useState(false);

  const syncNow = useCallback(async () => {
    setIsSyncing(true);
    try {
      const sent = await syncPendingTransactions();
      if (sent > 0) {
        queryClient.invalidateQueries({ queryKey: ['movimentacoes'] });
        queryClient.invalidateQueries({ queryKey: ['resumo-categorias'] });
        queryClient.invalidateQueries({ queryKey: ['categorias'] });
      }
      return sent;
    } finally {
      setIsSyncing(false);
    }
  }, [queryClient]);

  return { pending, isSyncing, syncNow, discard: removePendingTransaction };
}

// Usado uma vez no App: sincroniza ao abrir e sempre que a internet voltar.
export function useOfflineSync() {
  const { isAuthenticated } = useAuth();
  const { syncNow } = usePendingTransactions();

  useEffect(() => {
    if (!isAuthenticated) return undefined;

    syncNow();
    window.addEventListener('online', syncNow);
    return () => window.removeEventListener('online', syncNow);
  }, [isAuthenticated, syncNow]);
}
