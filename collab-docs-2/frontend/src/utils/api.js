import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

// Inject username header from localStorage on every request
api.interceptors.request.use(config => {
  const username = localStorage.getItem('cd_username');
  if (username) config.headers['X-Username'] = username;
  return config;
});

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const login = (username) => api.post('/auth/login', { username });
export const getMe = () => api.get('/auth/me');
export const searchUsers = (q) => api.get('/auth/users/search', { params: { q } });

// ─── Documents ────────────────────────────────────────────────────────────────
export const getMyDocs = () => api.get('/docs');
export const getSharedDocs = () => api.get('/docs/shared');
export const getDoc = (id) => api.get(`/docs/${id}`);
export const createDoc = (data = {}) => api.post('/docs', data);
export const updateDoc = (id, data) => api.patch(`/docs/${id}`, data);
export const deleteDoc = (id) => api.delete(`/docs/${id}`);

export const uploadDoc = (file) => {
  const form = new FormData();
  form.append('file', file);
  return api.post('/docs/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

// ─── Shares ───────────────────────────────────────────────────────────────────
export const getShares = (docId) => api.get(`/docs/${docId}/shares`);
export const shareDoc = (docId, username, permission) =>
  api.post(`/docs/${docId}/shares`, { username, permission });
export const updateShare = (docId, shareId, permission) =>
  api.patch(`/docs/${docId}/shares/${shareId}`, { permission });
export const revokeShare = (docId, shareId) =>
  api.delete(`/docs/${docId}/shares/${shareId}`);

export default api;
