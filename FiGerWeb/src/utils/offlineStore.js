// Dados guardados no aparelho para o app funcionar sem internet.
//
// - Listas (categorias, formas de pagamento): a última versão que veio da API,
//   usada para preencher o formulário quando não há conexão.
// - Fila de pendentes: movimentações salvas offline, enviadas à API
//   quando a internet volta (ver useOfflineSync.js).
//
// Tudo fica no localStorage, separado por usuário.

import { readSession } from './api.js';

const LIST_PREFIX = 'figer:offline:';
const QUEUE_KEY = 'figer:pendentes';

export const QUEUE_CHANGED_EVENT = 'figer:pendentes-mudou';

function currentUserId() {
  return readSession()?.user?.id ?? null;
}

function readJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // armazenamento cheio ou bloqueado: segue sem cache
  }
}

// O fetch só lança erro (TypeError) quando não chega a falar com o servidor:
// sem internet, servidor fora do ar, etc. Respostas 4xx/5xx não caem aqui.
export function isNetworkError(error) {
  return error instanceof TypeError;
}

// ---------------------------------------------------------------------------
// Listas guardadas (categorias, formas de pagamento)
// ---------------------------------------------------------------------------
export function saveOfflineList(name, items) {
  const userId = currentUserId();
  if (userId == null) return;
  writeJson(`${LIST_PREFIX}${name}:${userId}`, items);
}

export function readOfflineList(name) {
  const userId = currentUserId();
  if (userId == null) return null;
  return readJson(`${LIST_PREFIX}${name}:${userId}`, null);
}

// Busca na API e guarda o resultado; sem internet, devolve o que estava guardado.
export async function fetchWithOfflineFallback(name, fetcher) {
  try {
    const items = await fetcher();
    saveOfflineList(name, items);
    return items;
  } catch (error) {
    const saved = isNetworkError(error) ? readOfflineList(name) : null;
    if (saved) return saved;
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Fila de movimentações pendentes
// ---------------------------------------------------------------------------
function readQueue() {
  const queue = readJson(QUEUE_KEY, []);
  return Array.isArray(queue) ? queue : [];
}

function writeQueue(queue) {
  writeJson(QUEUE_KEY, queue);
  window.dispatchEvent(new Event(QUEUE_CHANGED_EVENT));
}

export function getPendingTransactions() {
  const userId = currentUserId();
  return readQueue().filter((item) => item.userId === userId);
}

export function addPendingTransaction(payload, extra = {}) {
  const item = {
    localId: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    userId: currentUserId(),
    createdAt: new Date().toISOString(),
    payload,
    ...extra, // ex.: nome da categoria, só para exibir na lista
  };
  writeQueue([...readQueue(), item]);
  return item;
}

export function removePendingTransaction(localId) {
  writeQueue(readQueue().filter((item) => item.localId !== localId));
}

export function markPendingError(localId, message) {
  writeQueue(
    readQueue().map((item) => (item.localId === localId ? { ...item, erro: message } : item)),
  );
}
