import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT to every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('max_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('max_token');
      localStorage.removeItem('max_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

// Auth
export const authAPI = {
  signup: (data) => api.post('/auth/signup', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
};

// Friends
export const friendsAPI = {
  sendRequest: (receiverId) => api.post('/friends/request', { receiverId }),
  respond: (requestId, action) => api.put('/friends/respond', { requestId, action }),
  getFriends: () => api.get('/friends'),
  getPending: () => api.get('/friends/pending'),
  remove: (friendId) => api.delete(`/friends/${friendId}`),
};

// Messages
export const messagesAPI = {
  get: (conversationId, page = 1) => api.get(`/messages/${conversationId}?page=${page}`),
  send: (data) => api.post('/messages', data),
  react: (messageId, emoji) => api.post(`/messages/${messageId}/react`, { emoji }),
  delete: (messageId, deleteFor) => api.delete(`/messages/${messageId}`, { data: { deleteFor } }),
  markRead: (conversationId) => api.put(`/messages/${conversationId}/read`),
};

// Users
export const usersAPI = {
  search: (q) => api.get(`/users/search?q=${q}`),
  getProfile: (userId) => api.get(`/users/${userId}`),
};

// Memes
export const memesAPI = {
  search: (q, category, limit) => api.get(`/memes/search?q=${q || ''}&category=${category || ''}&limit=${limit || 12}`),
  trending: () => api.get('/memes/trending'),
  categories: () => api.get('/memes/categories'),
};

// Groups
export const groupsAPI = {
  create: (data) => api.post('/groups', data),
  getAll: () => api.get('/groups'),
  addMember: (groupId, userId) => api.post('/groups/member', { groupId, userId }),
  leave: (groupId) => api.delete(`/groups/${groupId}/leave`),
};
