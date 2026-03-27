const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export interface AuthResponse {
    access_token: string;
    user: {
        id: string;
        phone: string;
        email: string | null;
        firstName: string;
        lastName: string;
        role: string;
    };
}

export interface LoginPayload {
    identifier: string;
    password: string;
}

async function fetchAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const { headers: extraHeaders, ...restOptions } = options;
    const res = await fetch(`${API_URL}${endpoint}`, {
        headers: {
            'Content-Type': 'application/json',
            ...(extraHeaders as Record<string, string>),
        },
        ...restOptions,
    });

    const data = await res.json();

    if (res.status === 401 && endpoint !== '/auth/login') {
        localStorage.removeItem('malilink_token');
        localStorage.removeItem('malilink_user');
        window.location.href = '/login';
        throw new Error('Session expirée');
    }

    if (!res.ok) {
        throw new Error(`[${res.status}] ${endpoint}: ${Array.isArray(data?.message) ? data.message.join(', ') : data?.message || 'Erreur réseau'}`);
    }

    return data as T;
}

export const authApi = {
    login: (payload: LoginPayload): Promise<AuthResponse> =>
        fetchAPI('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
};

export const adminApi = {
    getStats: (token: string) => fetchAPI<any>('/admin/stats', { headers: { Authorization: `Bearer ${token}` } }),
    getUsers: (token: string, params: string) => fetchAPI<any>(`/admin/users?${params}`, { headers: { Authorization: `Bearer ${token}` } }),
    suspendUser: (token: string, id: string, isSuspended: boolean) =>
        fetchAPI(`/admin/users/${id}/suspend`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify({ isSuspended }) }),
    getUserDetail: (token: string, id: string) => fetchAPI<any>(`/admin/users/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
    getEmployers: (token: string, params: string) => fetchAPI<any>(`/admin/employers?${params}`, { headers: { Authorization: `Bearer ${token}` } }),
    verifyEmployer: (token: string, id: string, status: string, note?: string) =>
        fetchAPI(`/admin/employers/${id}/verify`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify({ status, note }) }),
    getEmployerDetail: (token: string, id: string) => fetchAPI<any>(`/admin/employers/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
    getJobs: (token: string, params: string) => fetchAPI<any>(`/admin/jobs?${params}`, { headers: { Authorization: `Bearer ${token}` } }),
    updateJobStatus: (token: string, id: string, status: string) =>
        fetchAPI(`/admin/jobs/${id}/status`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify({ status }) }),
    getJobDetail: (token: string, id: string) => fetchAPI<any>(`/admin/jobs/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
};
