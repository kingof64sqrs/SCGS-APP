const KEY = 'scgs.adminKey';

export const getKey = () => localStorage.getItem(KEY) ?? '';
export const setKey = (k: string) => localStorage.setItem(KEY, k);
export const clearKey = () => localStorage.removeItem(KEY);

type Options = { method?: string; body?: unknown };

/** Call the backend admin API (same origin) with the stored admin key. */
export async function api<T = unknown>(path: string, { method = 'GET', body }: Options = {}): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', 'x-admin-key': getKey() },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error((data && (data.error || data.message)) || `HTTP ${res.status}`);
  return data as T;
}

export const LOGO = `${import.meta.env.BASE_URL}scgs-logo.png`;
export const NAVY = '#1E3A8A';
