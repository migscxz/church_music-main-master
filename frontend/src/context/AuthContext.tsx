import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import api from '../api';

interface User {
    id: number;
    name: string;
    email: string;
    role: 'admin' | 'leader' | 'member' | 'pianist';
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    login: (token: string, user: User) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem('auth_token'));
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            if (!token) {
                setIsLoading(false);
                return;
            }
            try {
                const response = await api.get('/auth/user');
                setUser(response.data);
            } catch (error) {
                console.error("Failed to fetch user, logging out", error);
                logout();
            } finally {
                setIsLoading(false);
            }
        };

        fetchUser();
    }, [token]);

    const login = (newToken: string, newUser: User) => {
        localStorage.setItem('auth_token', newToken);
        setToken(newToken);
        setUser(newUser);
    };

    const logout = async () => {
        try {
            await api.post('/logout');
        } catch (error) {
            console.error("Logout failed on server", error);
        } finally {
            localStorage.removeItem('auth_token');
            setToken(null);
            setUser(null);
        }
    };

    return (
        <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
