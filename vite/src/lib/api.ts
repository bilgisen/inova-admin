const API_BASE = '/api';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'API Error');
  }
  return data;
}

export const api = {
  login: (username: string, password: string) =>
    request<{ token: string; user: { username: string } }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  me: () => request<{ user: { username: string } }>('/auth/me'),

  dashboard: () => request<{
    stats: { projects: number; media: number; posts: number; pages: number };
    recentProjects: unknown[];
    categoryBreakdown: unknown[];
  }>('/admin/dashboard'),

  projects: {
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return request<{ data: unknown[]; total: number; page: number; limit: number; totalPages: number }>(`/admin/projects${qs}`);
    },
    get: (id: number) => request<Record<string, unknown>>(`/admin/projects/${id}`),
    create: (data: Record<string, unknown>) =>
      request<Record<string, unknown>>('/admin/projects', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: Record<string, unknown>) =>
      request<Record<string, unknown>>(`/admin/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) =>
      request<{ success: boolean }>(`/admin/projects/${id}`, { method: 'DELETE' }),
    reorder: (items: { id: number; sort_order: number }[]) =>
      request<{ success: boolean }>('/admin/projects/reorder', { method: 'POST', body: JSON.stringify({ items }) }),
  },

  categories: {
    list: (type?: string) =>
      request<unknown[]>(`/admin/categories${type ? `?type=${type}` : ''}`),
    create: (data: Record<string, unknown>) =>
      request<Record<string, unknown>>('/admin/categories', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: Record<string, unknown>) =>
      request<Record<string, unknown>>(`/admin/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) =>
      request<{ success: boolean }>(`/admin/categories/${id}`, { method: 'DELETE' }),
  },

  tags: {
    list: () => request<unknown[]>('/admin/tags'),
    create: (data: Record<string, unknown>) =>
      request<Record<string, unknown>>('/admin/tags', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: Record<string, unknown>) =>
      request<Record<string, unknown>>(`/admin/tags/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) =>
      request<{ success: boolean }>(`/admin/tags/${id}`, { method: 'DELETE' }),
  },

  media: {
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return request<{ data: unknown[]; total: number; page: number; limit: number }>(`/admin/media${qs}`);
    },
    get: (id: number) => request<Record<string, unknown>>(`/admin/media/${id}`),
    create: (data: Record<string, unknown>) =>
      request<Record<string, unknown>>('/admin/media', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: Record<string, unknown>) =>
      request<Record<string, unknown>>(`/admin/media/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) =>
      request<{ success: boolean }>(`/admin/media/${id}`, { method: 'DELETE' }),
    reorder: (items: { id: number; sort_order: number }[]) =>
      request<{ success: boolean }>('/admin/media/reorder', { method: 'POST', body: JSON.stringify({ items }) }),
    signature: () =>
      request<{ cloud_name: string; api_key: string; timestamp: number; signature: string; folder: string }>('/admin/media/signature'),
  },

  posts: {
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return request<{ data: unknown[]; total: number; page: number; limit: number; totalPages: number }>(`/admin/posts${qs}`);
    },
    get: (id: number) => request<Record<string, unknown>>(`/admin/posts/${id}`),
    create: (data: Record<string, unknown>) =>
      request<Record<string, unknown>>('/admin/posts', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: Record<string, unknown>) =>
      request<Record<string, unknown>>(`/admin/posts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) =>
      request<{ success: boolean }>(`/admin/posts/${id}`, { method: 'DELETE' }),
  },

  pages: {
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return request<{ data: unknown[]; total: number; page: number; limit: number; totalPages: number }>(`/admin/pages${qs}`);
    },
    get: (id: number) => request<Record<string, unknown>>(`/admin/pages/${id}`),
    create: (data: Record<string, unknown>) =>
      request<Record<string, unknown>>('/admin/pages', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: Record<string, unknown>) =>
      request<Record<string, unknown>>(`/admin/pages/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) =>
      request<{ success: boolean }>(`/admin/pages/${id}`, { method: 'DELETE' }),
  },
};
