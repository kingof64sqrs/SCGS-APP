import { API_BASE_URL } from './config';
import type {
  AboutContent,
  DemoAccount,
  Facility,
  GoverningBodyGroup,
  LoginResponse,
  Member,
} from './types';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

type RequestOptions = {
  method?: string;
  body?: unknown;
  token?: string | null;
  signal?: AbortSignal;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, token, signal } = options;
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch {
    throw new ApiError(
      `Could not reach the server at ${API_BASE_URL}. Check that the backend is running.`,
      0,
    );
  }

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const message = (data && (data.error || data.message)) || `Request failed (${res.status})`;
    throw new ApiError(message, res.status);
  }
  return data as T;
}

export const api = {
  login: (email: string, password: string, signal?: AbortSignal) =>
    request<LoginResponse>('/api/auth/login', { method: 'POST', body: { email, password }, signal }),

  getDemoAccounts: (signal?: AbortSignal) =>
    request<DemoAccount[]>('/api/auth/demo-accounts', { signal }),

  getMembers: (token?: string | null, signal?: AbortSignal) =>
    request<Member[]>('/api/members', { token, signal }),

  getMember: (samajId: string, token?: string | null, signal?: AbortSignal) =>
    request<Member>(`/api/members/${samajId}`, { token, signal }),

  getGoverningBody: (token?: string | null, signal?: AbortSignal) =>
    request<GoverningBodyGroup[]>('/api/governing-body', { token, signal }),

  getAbout: (token?: string | null, signal?: AbortSignal) =>
    request<AboutContent>('/api/about', { token, signal }),

  getFacilities: (token?: string | null, signal?: AbortSignal) =>
    request<Facility[]>('/api/facilities', { token, signal }),
};
