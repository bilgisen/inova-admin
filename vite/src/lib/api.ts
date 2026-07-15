const API_BASE = '/api/admin';

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
  // Auth
  login: (username: string, password: string) =>
    request<{ token: string; user: { username: string } }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  me: () => request<{ user: { username: string } }>('/auth/me'),

  // Dashboard
  dashboard: () => request<{
    stats: { projects: number; media: number; posts: number; pages: number };
    recentProjects: unknown[];
    categoryBreakdown: unknown[];
  }>('/dashboard'),

  // Projects
  projects: {
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return request<{ data: unknown[]; total: number; page: number; limit: number; totalPages: number }>(`/projects${qs}`);
    },
    get: (id: number) => request<Record<string, unknown>>(`/projects/${id}`),
    create: (data: Record<string, unknown>) =>
      request<Record<string, unknown>>('/projects', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: Record<string, unknown>) =>
      request<Record<string, unknown>>(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) =>
      request<{ success: boolean }>(`/projects/${id}`, { method: 'DELETE' }),
    reorder: (items: { id: number; sort_order: number }[]) =>
      request<{ success: boolean }>('/projects/reorder', { method: 'POST', body: JSON.stringify({ items }) }),
  },

  // Categories
  categories: {
    list: (type?: string) =>
      request<unknown[]>(`/categories${type ? `?type=${type}` : ''}`),
    create: (data: Record<string, unknown>) =>
      request<Record<string, unknown>>('/categories', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: Record<string, unknown>) =>
      request<Record<string, unknown>>(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) =>
      request<{ success: boolean }>(`/categories/${id}`, { method: 'DELETE' }),
  },

  // Tags
  tags: {
    list: () => request<unknown[]>('/tags'),
    create: (data: Record<string, unknown>) =>
      request<Record<string, unknown>>('/tags', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: Record<string, unknown>) =>
      request<Record<string, unknown>>(`/tags/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) =>
      request<{ success: boolean }>(`/tags/${id}`, { method: 'DELETE' }),
  },

  // Media
  media: {
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return request<{ data: unknown[]; total: number; page: number; limit: number }>(`/media${qs}`);
    },
    get: (id: number) => request<Record<string, unknown>>(`/media/${id}`),
    create: (data: Record<string, unknown>) =>
      request<Record<string, unknown>>('/media', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: Record<string, unknown>) =>
      request<Record<string, unknown>>(`/media/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) =>
      request<{ success: boolean }>(`/media/${id}`, { method: 'DELETE' }),
    reorder: (items: { id: number; sort_order: number }[]) =>
      request<{ success: boolean }>('/media/reorder', { method: 'POST', body: JSON.stringify({ items }) }),
    signature: () =>
      request<{ cloud_name: string; api_key: string; timestamp: number; signature: string; folder: string }>('/media/signature'),
  },

  // Posts
  posts: {
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return request<{ data: unknown[]; total: number; page: number; limit: number; totalPages: number }>(`/posts${qs}`);
    },
    get: (id: number) => request<Record<string, unknown>>(`/posts/${id}`),
    create: (data: Record<string, unknown>) =>
      request<Record<string, unknown>>('/posts', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: Record<string, unknown>) =>
      request<Record<string, unknown>>(`/posts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) =>
      request<{ success: boolean }>(`/posts/${id}`, { method: 'DELETE' }),
  },

  // Pages
  pages: {
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return request<{ data: unknown[]; total: number; page: number; limit: number; totalPages: number }>(`/pages${qs}`);
    },
    get: (id: number) => request<Record<string, unknown>>(`/pages/${id}`),
    create: (data: Record<string, unknown>) =>
      request<Record<string, unknown>>('/pages', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: Record<string, unknown>) =>
      request<Record<string, unknown>>(`/pages/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) =>
      request<{ success: boolean }>(`/pages/${id}`, { method: 'DELETE' }),
  },
};
