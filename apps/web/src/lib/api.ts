const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export interface Job {
    id: string;
    title: string;
    type: string;
    sector: string;
    regions: string;
    educationLevel?: string;
    experienceLevel?: string;
    description?: string;
    requirements?: string;
    salaryMin?: number;
    salaryMax?: number;
    deadline: string;
    publishedAt: string;
    isDiasporaOpen: boolean;
    isRemoteAbroad?: boolean;
    relocationAid?: string;
    applicationCount?: number;
    viewCount?: number;
    isSaved?: boolean;
    employer: { id?: string; name: string; logoS3Key?: string; isVerified: boolean; description?: string };
    requiredDocs?: Array<{ id: string; label: string; documentCategory: string; isOptional: boolean }>;
}

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
    uploadLogo: async (token: string, file: File): Promise<any> => {
        const form = new FormData();
        form.append('file', file);
        const res = await fetch(`${API_URL}/employers/me/logo`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: form,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || 'Erreur upload logo');
        return data;
    },
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

    /** Download a document securely via proxy endpoint */
    download: async (token: string, id: string, name: string) => {
        const res = await fetch(`${API_URL}/documents/${id}/download`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || 'Erreur lors du téléchargement');
        }
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = name; // Force specific file name
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
    },
};

export const profileApi = {
    get: (token: string) => fetchAPI<any>('/profile/me', { headers: { Authorization: `Bearer ${token}` } }),
    update: (token: string, data: any) =>
        fetchAPI<any>('/profile/me', { method: 'PATCH', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(data) }),
    addExperience: (token: string, data: any) =>
        fetchAPI<any>('/profile/me/experiences', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(data) }),
    removeExperience: (token: string, id: string) =>
        fetchAPI<any>(`/profile/me/experiences/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }),
    addEducation: (token: string, data: any) =>
        fetchAPI<any>('/profile/me/educations', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(data) }),
    removeEducation: (token: string, id: string) =>
        fetchAPI<any>(`/profile/me/educations/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }),
    addSkill: (token: string, data: any) =>
        fetchAPI<any>('/profile/me/skills', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(data) }),
    removeSkill: (token: string, id: string) =>
        fetchAPI<any>(`/profile/me/skills/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }),
    uploadAvatar: async (token: string, file: File): Promise<any> => {
        const form = new FormData();
        form.append('file', file);
        const res = await fetch(`${API_URL}/profile/me/avatar`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: form,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || 'Erreur upload avatar');
        return data;
    },
};

export const talentsApi = {
    search: (token: string, params: any) => {
        const query = new URLSearchParams();
        if (params.q) query.append('q', params.q);
        if (params.isDiaspora) query.append('isDiaspora', params.isDiaspora);
        if (params.regions) query.append('regions', params.regions);
        if (params.sectors) query.append('sectors', params.sectors);
        if (params.educationLevel) query.append('educationLevel', params.educationLevel);
        if (params.experienceLevel) query.append('experienceLevel', params.experienceLevel);

        return fetchAPI<any[]>(`/talents/search?${query.toString()}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
    },
    getOne: (token: string, id: string) =>
        fetchAPI<any>(`/talents/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
        }),
};

export const savedJobsApi = {
    list: (token: string) =>
        fetchAPI<any[]>('/saved-jobs', {
            headers: { Authorization: `Bearer ${token}` },
        }),
    save: (token: string, jobId: string) =>
        fetchAPI<any>(`/jobs/${jobId}/save`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
        }),
    remove: (token: string, jobId: string) =>
        fetchAPI<any>(`/jobs/${jobId}/save`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
        }),
};

