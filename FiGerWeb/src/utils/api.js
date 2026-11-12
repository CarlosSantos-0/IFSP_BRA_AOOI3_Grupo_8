const API_BASE_URL = (
  import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : '')
).replace(/\/+$/, '');
const SESSION_KEY = 'figer:session';

export const SESSION_EXPIRED_EVENT = 'figer:session-expired';

export function readSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY)) ?? null;
  } catch {
    return null;
  }
}

export function saveSession(session) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    // sem armazenamento disponível: ignora silenciosamente
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    // ignora silenciosamente
  }
}

export async function apiFetch(path, options = {}) {
  if (!API_BASE_URL) {
    throw new Error('Configure VITE_API_URL com a URL pública da API.');
  }

  const session = readSession();
  const headers = {
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(options.headers ?? {}),
  };

  if (session?.token) {
    headers.Authorization = `Bearer ${session.token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401 && !path.startsWith('/api/auth/')) {
    clearSession();
    window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
  }

  return response;
}

export async function readApiError(response, fallback) {
  try {
    const body = await response.json();
    return body.erro ?? body.error ?? body.mensagem ?? body.message ?? fallback;
  } catch {
    return fallback;
  }
}
