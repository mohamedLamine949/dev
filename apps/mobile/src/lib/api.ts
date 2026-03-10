const API_URL = 'http://10.0.2.2:3001/api';
// On iOS simulator use http://localhost:3001/api
// On a real device, use your local IP address

export interface User {
    id: string;
    phone: string;
    email: string | null;
    firstName: string;
    lastName: string;
    role: string;
}

export interface AuthResponse {
    access_token: string;
    user: User;
}

export interface Experience { id: string; title: string; company: string; type: string; startDate: string; endDate?: string; description?: string; }
export interface Education { id: string; title: string; institution: string; country: string; year: number; level: string; }
export interface Skill { id: string; name: string; level: string; }

export interface Profile {
    id: string;
    userId: string;
    title?: string;
    summary?: string;
    availability?: string;
    salaryMin?: number;
    salaryMax?: number;
    isDiaspora: boolean;
    returnType?: string;
    returnHorizon?: string;
    completionScore: number;
    user: { firstName: string; lastName: string; country: string; region?: string; };
    experiences: Experience[];
    educations: Education[];
    skills: Skill[];
}

export interface Job {
    id: string;
    title: string;
    type: string;
    sector: string;
    regions: string; // JSON string
    educationLevel: string; // JSON string
    experienceLevel: string;
    description: string;
    requirements: string;
    salaryMin?: number;
    salaryMax?: number;
    deadline: string;
    isDiasporaOpen: boolean;
    isRemoteAbroad: boolean;
    relocationAid?: string;
    status: string;
    employer: { name: string; logoS3Key?: string; isVerified: boolean };
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

    let data;
    try {
        data = await res.json();
    } catch {
        data = null;
    }

    if (!res.ok) {
        throw new Error(data?.message || 'Erreur réseau');
    }
    return data as T;
}

export const authApi = {
    register: (payload: {
        phone: string;
        password: string;
        firstName: string;
        lastName: string;
        country: string;
        email?: string;
        role?: 'CANDIDATE' | 'RECRUITER';
    }): Promise<AuthResponse> =>
        fetchAPI('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),

    /** identifier = phone OR email */
    login: (payload: { identifier: string; password: string }): Promise<AuthResponse> =>
        fetchAPI('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
};

export const profileApi = {
    getMe: (token: string): Promise<Profile> =>
        fetchAPI('/profile/me', { headers: { Authorization: `Bearer ${token}` } }),

    update: (token: string, dto: Partial<Profile>): Promise<Profile> =>
        fetchAPI('/profile/me', {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${token}` },
            body: JSON.stringify(dto)
        }),

    addExperience: (token: string, dto: any) =>
        fetchAPI('/profile/me/experiences', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(dto) }),

    removeExperience: (token: string, id: string) =>
        fetchAPI(`/profile/me/experiences/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }),

    addEducation: (token: string, dto: any) =>
        fetchAPI('/profile/me/educations', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(dto) }),

    removeEducation: (token: string, id: string) =>
        fetchAPI(`/profile/me/educations/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }),

    addSkill: (token: string, dto: any) =>
        fetchAPI('/profile/me/skills', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(dto) }),

    removeSkill: (token: string, id: string) =>
        fetchAPI(`/profile/me/skills/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }),
};

export const jobsApi = {
    list: (filters: any = {}): Promise<{ jobs: Job[]; total: number }> => {
        const query = new URLSearchParams(filters as any).toString();
        return fetchAPI(`/jobs?${query}`);
    },
    get: (id: string): Promise<Job> =>
        fetchAPI(`/jobs/${id}`),
};

export const appsApi = {
    apply: (token: string, jobId: string, dto: { coverLetter?: string; introMessage?: string }) =>
        fetchAPI(`/jobs/${jobId}/apply`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: JSON.stringify(dto)
        }),
    getMyApps: (token: string) =>
        fetchAPI('/applications/mine', { headers: { Authorization: `Bearer ${token}` } }),
};

export const employerApi = {
    create: (token: string, data: { name: string; category: string; description?: string }) =>
        fetchAPI('/employers', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: JSON.stringify(data),
        }),
    getMyEmployers: (token: string) =>
        fetchAPI<any[]>('/employers/me', {
            headers: { Authorization: `Bearer ${token}` },
        }),
};


