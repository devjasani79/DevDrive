'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getCurrentUser } from '@/client/auth';
import type { Models } from 'appwrite';

interface AuthContextType {
    user: Models.User<Models.Preferences> | null;
    loading: boolean;
    refetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);
    const [loading, setLoading] = useState(true);

    const refetchUser = async () => {
        const maxRetries = 3;
        const retryDelay = 500;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const result = await getCurrentUser(); 
                if (result.success && result.data?.user) {
                    setUser(result.data.user);
                    setLoading(false);
                    return;
                }
            } catch (error) {
                console.error(`AuthContext: Attempt ${attempt} failed:`, error);
                if (attempt === maxRetries) {
                    setUser(null);
                }
            }
            if (attempt < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, retryDelay));
            }
        }
        setLoading(false);
    };

    useEffect(() => {
        refetchUser();
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, refetchUser }}>
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
