'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface User {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'user';
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    register: (name: string, email: string, password: string, phone?: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => void;
    isAdmin: boolean;
    authHeaders: () => Record<string, string>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const savedToken = localStorage.getItem('iccip_token');
        const savedUser = localStorage.getItem('iccip_user');
        if (savedToken && savedUser) {
            setToken(savedToken);
            setUser(JSON.parse(savedUser));
        }
        setLoading(false);
    }, []);

    const login = async (email: string, password: string) => {
        try {
            const res = await axios.post(`${API}/api/auth/login`, { email, password });
            const { token: t, user: u } = res.data;
            setToken(t);
            setUser(u);
            localStorage.setItem('iccip_token', t);
            localStorage.setItem('iccip_user', JSON.stringify(u));
            return { success: true };
        } catch (err: any) {
            return { success: false, error: err.response?.data?.detail || 'Login failed' };
        }
    };

    const register = async (name: string, email: string, password: string, phone?: string) => {
        try {
            const res = await axios.post(`${API}/api/auth/register`, { name, email, password, phone });
            const { token: t, user: u } = res.data;
            setToken(t);
            setUser(u);
            localStorage.setItem('iccip_token', t);
            localStorage.setItem('iccip_user', JSON.stringify(u));
            return { success: true };
        } catch (err: any) {
            return { success: false, error: err.response?.data?.detail || 'Registration failed' };
        }
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('iccip_token');
        localStorage.removeItem('iccip_user');
    };

    const authHeaders = (): Record<string, string> => token ? { Authorization: `Bearer ${token}` } : {};
    const isAdmin = user?.role === 'admin';

    return (
        <AuthContext.Provider value={{ user, token, loading, login, register, logout, isAdmin, authHeaders }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
