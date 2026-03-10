import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi, AuthResponse, User } from '../lib/api';

interface AuthContextType {
    user: User | null;
    token: string | null;
    loading: boolean;
    /** identifier = phone number OR email */
    login: (identifier: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    register: (data: Parameters<typeof authApi.register>[0]) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            const storedToken = await AsyncStorage.getItem('malilink_token');
            const storedUser = await AsyncStorage.getItem('malilink_user');
            if (storedToken && storedUser) {
                setToken(storedToken);
                setUser(JSON.parse(storedUser));
            }
            setLoading(false);
        })();
    }, []);

    const saveAuth = async (res: AuthResponse) => {
        await AsyncStorage.setItem('malilink_token', res.access_token);
        await AsyncStorage.setItem('malilink_user', JSON.stringify(res.user));
        setToken(res.access_token);
        setUser(res.user);
    };

    const login = async (identifier: string, password: string) => {
        const res = await authApi.login({ identifier, password });
        await saveAuth(res);
    };

    const register = async (data: Parameters<typeof authApi.register>[0]) => {
        const res = await authApi.register(data);
        await saveAuth(res);
    };

    const logout = async () => {
        await AsyncStorage.multiRemove(['malilink_token', 'malilink_user']);
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, logout, register }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be inside AuthProvider');
    return ctx;
}

