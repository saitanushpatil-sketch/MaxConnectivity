import { create } from 'zustand';
import { authAPI } from '../utils/api';

const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,

  init: async () => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('max_token');
    const userStr = localStorage.getItem('max_user');
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        set({ token, user, isAuthenticated: true, isLoading: false });
        // Refresh user data
        const { data } = await authAPI.getMe();
        set({ user: data.user });
        localStorage.setItem('max_user', JSON.stringify(data.user));
      } catch {
        get().logout();
      }
    } else {
      set({ isLoading: false });
    }
  },

  login: async (identifier, password) => {
    const { data } = await authAPI.login({ identifier, password });
    localStorage.setItem('max_token', data.token);
    localStorage.setItem('max_user', JSON.stringify(data.user));
    set({ user: data.user, token: data.token, isAuthenticated: true });
    return data;
  },

  signup: async (userData) => {
    const { data } = await authAPI.signup(userData);
    localStorage.setItem('max_token', data.token);
    localStorage.setItem('max_user', JSON.stringify(data.user));
    set({ user: data.user, token: data.token, isAuthenticated: true });
    return data;
  },

  updateUser: (updates) => {
    const updated = { ...get().user, ...updates };
    set({ user: updated });
    localStorage.setItem('max_user', JSON.stringify(updated));
  },

  logout: () => {
    localStorage.removeItem('max_token');
    localStorage.removeItem('max_user');
    set({ user: null, token: null, isAuthenticated: false, isLoading: false });
  },
}));

export default useAuthStore;
