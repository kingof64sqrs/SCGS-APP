import { API_BASE_URL } from './config';
import type {
  AboutContent,
  AuthUser,
  DemoAccount,
  Facility,
  GoverningBodyGroup,
  LoginResponse,
  Member,
  PagedMembers,
} from './types';

type ProfilePatch = Partial<Pick<AuthUser, 'name' | 'phone' | 'address' | 'bloodGroup'>>;

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
  login: (identifier: string, password: string, signal?: AbortSignal) =>
    request<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: { identifier, password },
      signal,
    }),

  changePassword: (
    token: string | null,
    body: { password: string; currentPassword?: string },
    signal?: AbortSignal,
  ) =>
    request<{ ok: boolean }>('/api/me/password', {
      method: 'POST',
      body,
      token,
      signal,
    }),

  getDemoAccounts: (signal?: AbortSignal) =>
    request<DemoAccount[]>('/api/auth/demo-accounts', { signal }),

  getMe: (token: string | null, signal?: AbortSignal) =>
    request<AuthUser>('/api/me', { token, signal }),

  updateProfile: (token: string | null, patch: ProfilePatch, signal?: AbortSignal) =>
    request<AuthUser>('/api/me', { method: 'PUT', body: patch, token, signal }),

  updatePhoto: (
    token: string | null,
    photo: { contentType: string; base64: string },
    signal?: AbortSignal,
  ) => request<{ ok: boolean }>('/api/me/photo', { method: 'PUT', body: photo, token, signal }),

  getMembersPage: (
    opts: { page: number; limit: number; q?: string },
    token?: string | null,
    signal?: AbortSignal,
  ) => {
    const params = new URLSearchParams();
    params.set('page', String(opts.page));
    params.set('limit', String(opts.limit));
    if (opts.q && opts.q.trim()) params.set('q', opts.q.trim());
    return request<PagedMembers>(`/api/members?${params.toString()}`, { token, signal });
  },

  getMember: (samajId: string, token?: string | null, signal?: AbortSignal) =>
    request<Member>(`/api/members/${encodeURIComponent(samajId)}`, { token, signal }),

  getGoverningBody: (token?: string | null, signal?: AbortSignal) =>
    request<GoverningBodyGroup[]>('/api/governing-body', { token, signal }),

  getAbout: (token?: string | null, signal?: AbortSignal) =>
    request<AboutContent>('/api/about', { token, signal }),

  getFacilities: (token?: string | null, signal?: AbortSignal) =>
    request<Facility[]>('/api/facilities', { token, signal }),
};
