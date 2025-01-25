import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface AuthContextType {
    isAuthenticated: boolean;
    login: (token: string) => void;
    logout: () => void;
    token: string | null;
    authInitialized: boolean; // New state to track if auth has been initialized
}

const AuthContext = createContext<AuthContextType>({
    isAuthenticated: false,
    login: () => {},
    logout: () => {},
    token: null,
    authInitialized: false, // Default value for authInitialized
});

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [token, setToken] = useState<string | null>(null);
    const [authInitialized, setAuthInitialized] = useState<boolean>(false); // New state

    useEffect(() => {
        // Simulate fetching authentication state (e.g., from localStorage)
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
            setIsAuthenticated(true);
            setToken(storedToken);
        }
        setAuthInitialized(true); // Mark authentication as initialized
    }, []);

    const login = (token: string) => {
        setIsAuthenticated(true);
        setToken(token);
        localStorage.setItem('token', token);
    };

    const logout = () => {
        setIsAuthenticated(false);
        setToken(null);
        localStorage.removeItem('token');
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, login, logout, token, authInitialized }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
