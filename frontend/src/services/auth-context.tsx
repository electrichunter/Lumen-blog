'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from './api';
import { apiClient } from './client';

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, username: string, password: string, fullName?: string) => Promise<void>;
    logout: () => void;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const refreshUser = async () => {
        try {
            const currentUser = await apiClient.getCurrentUser();
            setUser(currentUser);
        } catch {
            setUser(null);
            apiClient.logout();
        }
    };

    useEffect(() => {
        const initAuth = async () => {
            const token = apiClient.getToken();
            if (token) {
                try {
                    await refreshUser();
                } catch {
                    // Token invalid, try refresh
                    try {
                        await apiClient.refreshToken();
                        await refreshUser();
                    } catch {
                        apiClient.logout();
                    }
                }
            }
            setIsLoading(false);
        };

        initAuth();
    }, []);

    const login = async (email: string, password: string) => {
        await apiClient.login(email, password);
        await refreshUser();
    };

    const register = async (email: string, username: string, password: string, fullName?: string) => {
        await apiClient.register({
            email,
            username,
            password,
            full_name: fullName,
        });
        // Auto-login after registration
        await login(email, password);
    };

    const logout = () => {
        apiClient.logout();
        setUser(null);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                isAuthenticated: !!user,
                login,
                register,
                logout,
                refreshUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
