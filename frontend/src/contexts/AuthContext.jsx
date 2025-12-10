import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { AUTH_TOKEN_KEY, USER_KEY } from '../config/constants';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        // Check if user is logged in on mount
        const token = localStorage.getItem(AUTH_TOKEN_KEY);
        const storedUser = localStorage.getItem(USER_KEY);

        if (token && storedUser && storedUser !== 'undefined') {
            try {
                const parsedUser = JSON.parse(storedUser);
                setUser(parsedUser);
                setIsAuthenticated(true);
            } catch (error) {
                console.error('Error parsing stored user:', error);
                localStorage.removeItem(AUTH_TOKEN_KEY);
                localStorage.removeItem(USER_KEY);
            }
        } else if (token || storedUser) {
            // Clean up invalid tokens/user data
            localStorage.removeItem(AUTH_TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        try {
            const response = await authService.login(email, password);

            if (response.success) {
                localStorage.setItem(AUTH_TOKEN_KEY, response.token);
                localStorage.setItem(USER_KEY, JSON.stringify(response.data));
                setUser(response.data);
                setIsAuthenticated(true);
                toast.success('Login successful!');
                return { success: true };
            }
        } catch (error) {
            const message = error.response?.data?.message || 'Login failed';
            toast.error(message);
            return { success: false, error: message };
        }
    };

    const register = async (userData) => {
        try {
            const response = await authService.register(userData);

            if (response.success) {
                localStorage.setItem(AUTH_TOKEN_KEY, response.token);
                localStorage.setItem(USER_KEY, JSON.stringify(response.data));
                setUser(response.data);
                setIsAuthenticated(true);
                toast.success('Registration successful!');
                return { success: true };
            }
        } catch (error) {
            const message = error.response?.data?.message || 'Registration failed';
            toast.error(message);
            return { success: false, error: message };
        }
    };

    const logout = async () => {
        try {
            await authService.logout();
            localStorage.removeItem(AUTH_TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
            setUser(null);
            setIsAuthenticated(false);
            toast.success('Logged out successfully');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const updateUser = (updatedUser) => {
        setUser(updatedUser);
        localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
    };

    const value = {
        user,
        isAuthenticated,
        loading,
        login,
        register,
        logout,
        updateUser,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
