'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authApi, AuthResponse } from '@/lib/api';

interface User {
    id: string;
    phone: string;
    email: string | null;
    firstName: string;
    lastName: string;
    role: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    loading: boolean;
    login: (identifier: string, password: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const stored = localStorage.getItem('malilink_token');
        const storedUser = localStorage.getItem('malilink_user');
        if (stored && storedUser) {
            setToken(stored);
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const saveAuth = (res: AuthResponse) => {
        localStorage.setItem('malilink_token', res.access_token);
        localStorage.setItem('malilink_user', JSON.stringify(res.user));
        setToken(res.access_token);
        setUser(res.user);
    };

    const login = async (identifier: string, password: string) => {
        const res = await authApi.login({ identifier, password });
        saveAuth(res);
    };

    const logout = () => {
        localStorage.removeItem('malilink_token');
        localStorage.removeItem('malilink_user');
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
    return ctx;
}
