import { create } from 'zustand';
import api from '../utils/api';

const useAuthStore = create((set) => ({
    user: null,
    token: localStorage.getItem('token'),
    isAuthenticated: !!localStorage.getItem('token'),
    isLoading: false,
    error: null,

    login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.post('/auth/login', { email, password });
            const { access_token } = response.data;

            localStorage.setItem('token', access_token);

            // Get user info
            const userResponse = await api.get('/auth/me');

            set({
                token: access_token,
                user: userResponse.data,
                isAuthenticated: true,
                isLoading: false,
            });

            return true;
        } catch (error) {
            set({
                error: error.response?.data?.detail || 'Login failed',
                isLoading: false,
            });
            return false;
        }
    },

    register: async (email, username, password) => {
        set({ isLoading: true, error: null });
        try {
            await api.post('/auth/register', { email, username, password });

            // Auto-login after registration
            return await useAuthStore.getState().login(email, password);
        } catch (error) {
            set({
                error: error.response?.data?.detail || 'Registration failed',
                isLoading: false,
            });
            return false;
        }
    },

    logout: () => {
        localStorage.removeItem('token');
        set({
            user: null,
            token: null,
            isAuthenticated: false,
        });
    },

    fetchUser: async () => {
        try {
            const response = await api.get('/auth/me');
            set({ user: response.data });
        } catch (error) {
            console.error('Failed to fetch user:', error);
        }
    },

    clearError: () => set({ error: null }),
}));

export default useAuthStore;
