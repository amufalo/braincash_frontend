import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
    id: number;
    email: string;
    name: string;
    role: string;
    is_superuser?: boolean;
}

interface Tenant {
    id: number;
    name: string;
    slug: string;
}

interface AuthContextType {
    user: User | null;
    tenant: Tenant | null;
    token: string | null;
    login: (token: string, user: User, tenant: Tenant) => void;
    logout: () => void;
    isAuthenticated: boolean;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [tenant, setTenant] = useState<Tenant | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Load from localStorage on mount
        const storedToken = localStorage.getItem('access_token');
        const storedUser = localStorage.getItem('user_data');
        const storedTenant = localStorage.getItem('tenant_data');

        if (storedToken && storedUser && storedTenant) {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
            setTenant(JSON.parse(storedTenant));
        }
        setIsLoading(false);
    }, []);

    const login = (newToken: string, newUser: User, newTenant: Tenant) => {
        localStorage.setItem('access_token', newToken);
        localStorage.setItem('user_data', JSON.stringify(newUser));
        localStorage.setItem('tenant_data', JSON.stringify(newTenant));

        setToken(newToken);
        setUser(newUser);
        setTenant(newTenant);
    };

    const logout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_data');
        localStorage.removeItem('tenant_data');

        setToken(null);
        setUser(null);
        setTenant(null);

        window.location.href = '/login';
    };

    return (
        <AuthContext.Provider value={{
            user,
            tenant,
            token,
            login,
            logout,
            isAuthenticated: !!token,
            isLoading
        }}>
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
