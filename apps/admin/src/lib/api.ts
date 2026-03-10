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
    const res = await fetch(`${API_URL}${endpoint}`, {
        headers: { 'Content-Type': 'application/json', ...options.headers },
        ...options,
    });

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data?.message || 'Erreur réseau');
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
    getEmployers: (token: string, params: string) => fetchAPI<any>(`/admin/employers?${params}`, { headers: { Authorization: `Bearer ${token}` } }),
    verifyEmployer: (token: string, id: string, isVerified: boolean) =>
        fetchAPI(`/admin/employers/${id}/verify`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify({ isVerified }) }),
    getJobs: (token: string, params: string) => fetchAPI<any>(`/admin/jobs?${params}`, { headers: { Authorization: `Bearer ${token}` } }),
    updateJobStatus: (token: string, id: string, status: string) =>
        fetchAPI(`/admin/jobs/${id}/status`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify({ status }) }),
};
