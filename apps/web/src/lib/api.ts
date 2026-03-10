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

export interface RegisterPayload {
    phone: string;            // Required — primary identifier
    password: string;
    firstName: string;
    lastName: string;
    country: string;
    email?: string;           // Optional at sign-up
    role?: 'CANDIDATE' | 'RECRUITER';
}

export interface LoginPayload {
    identifier: string;       // Phone OR email
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

    if (!res.ok) {
        throw new Error(data?.message || 'Erreur réseau');
    }

    return data as T;
}

export const authApi = {
    register: (payload: RegisterPayload): Promise<AuthResponse> =>
        fetchAPI('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),

    login: (payload: LoginPayload): Promise<AuthResponse> =>
        fetchAPI('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
};

export const employerApi = {
    create: (token: string, data: { name: string; category: string; description?: string; nif?: string; rccm?: string }) =>
        fetchAPI('/employers', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: JSON.stringify(data),
        }),
    update: (token: string, data: { nif?: string; rccm?: string; description?: string }) =>
        fetchAPI('/employers/me', {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${token}` },
            body: JSON.stringify(data),
        }),
    getMyEmployers: (token: string) =>
        fetchAPI<any[]>('/employers/me', {
            headers: { Authorization: `Bearer ${token}` },
        }),
};

export const documentsApi = {
    /** List my documents */
    list: (token: string): Promise<any[]> =>
        fetchAPI('/documents', { headers: { Authorization: `Bearer ${token}` } }),

    /** Upload a document file. Uses raw fetch because multipart/form-data. */
    upload: async (token: string, file: File, category: string): Promise<any> => {
        const form = new FormData();
        form.append('file', file);
        form.append('category', category);
        const res = await fetch(`${API_URL}/documents/upload`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: form,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || 'Erreur upload');
        return data;
    },

    /** Delete a document */
    remove: (token: string, id: string) =>
        fetchAPI(`/documents/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
        }),
};
