import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to every request if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('booky_token_ref');
  // We don't store the token in localStorage — this is just a flag
  // The actual token is passed via AuthContext
  return config;
});

// --- Auth ---
export const loginApi = (data) => {
  const deviceId = localStorage.getItem('booky_device_id');
  return api.post('/api/auth/login', data, {
    headers: deviceId ? { 'X-Device-ID': deviceId } : {},
  });
};
export const verifyOtpApi = (data) => api.post('/api/auth/verify-otp', data);
export const logoutApi = () => api.post('/api/auth/logout');
export const verifyApi = (token) => api.get('/api/auth/verify', {
  headers: { Authorization: `Bearer ${token}` },
});
export const forgotPasswordApi = (data) => api.post('/api/auth/forgot-password', data);
export const resetPasswordApi = (data) => api.post('/api/auth/reset-password', data);
export const changePasswordApi = (token, data) => api.post('/api/auth/change-password', data, {
  headers: { Authorization: `Bearer ${token}` },
});

// --- Public ---
export const getSettingsApi = () => api.get('/api/public/settings');
export const getAboutApi = () => api.get('/api/public/about');
export const getTestimonialsApi = () => api.get('/api/public/testimonials');
export const submitPublicTestimonialApi = (data) => api.post('/api/public/testimonials', data);
export const getPublishedPostsApi = (page = 1) => api.get(`/api/public/blogs?page=${page}`);
export const getPostBySlugApi = (slug, sessionId) =>
  api.get(`/api/public/blogs/${slug}${sessionId ? `?session_id=${encodeURIComponent(sessionId)}` : ''}`);
export const toggleLikeApi = (slug, sessionId) =>
  api.post(`/api/public/blogs/${slug}/like`, { session_id: sessionId });
export const getCommentsApi = (slug) => api.get(`/api/public/blogs/${slug}/comments`);
export const submitCommentApi = (slug, data) => api.post(`/api/public/blogs/${slug}/comments`, data);
export const recordPageViewApi = (data) => api.post('/api/public/analytics/pageview', data);
export const submitQuoteApi = (data) => api.post('/api/public/quote', data, {
  headers: { 'Content-Type': 'multipart/form-data' },
});

// --- Admin: Blog ---
export const getAllPostsApi = (token, status = '') => api.get(`/api/admin/blogs${status ? `?status=${status}` : ''}`, {
  headers: { Authorization: `Bearer ${token}` },
});
export const getPostByIdApi = (token, id) => api.get(`/api/admin/blogs/${id}`, {
  headers: { Authorization: `Bearer ${token}` },
});
export const createPostApi = (token, data) => api.post('/api/admin/blogs', data, {
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
});
export const updatePostApi = (token, id, data) => api.put(`/api/admin/blogs/${id}`, data, {
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
});
export const deletePostApi = (token, id) => api.delete(`/api/admin/blogs/${id}`, {
  headers: { Authorization: `Bearer ${token}` },
});

// --- Admin: Settings ---
export const getAdminSettingsApi = (token) => api.get('/api/public/settings', {
  headers: { Authorization: `Bearer ${token}` },
});
export const updateSettingsApi = (token, data) => api.put('/api/admin/settings', data, {
  headers: { Authorization: `Bearer ${token}` },
});
export const uploadLogoApi = (token, data) => api.post('/api/admin/settings/logo', data, {
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
});
export const removeLogoApi = (token) => api.delete('/api/admin/settings/logo', {
  headers: { Authorization: `Bearer ${token}` },
});
export const uploadPhotoApi = (token, data) => api.post('/api/admin/settings/photo', data, {
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
});
export const removePhotoApi = (token) => api.delete('/api/admin/settings/photo', {
  headers: { Authorization: `Bearer ${token}` },
});

// --- Admin: About ---
export const getAdminAboutApi = (token) => api.get('/api/public/about', {
  headers: { Authorization: `Bearer ${token}` },
});
export const updateAboutApi = (token, data) => api.put('/api/admin/about', data, {
  headers: { Authorization: `Bearer ${token}` },
});

// --- Admin: Testimonials ---
export const getAllTestimonialsApi = (token, status = '') => api.get(`/api/admin/testimonials${status ? `?status=${status}` : ''}`, {
  headers: { Authorization: `Bearer ${token}` },
});
export const createTestimonialApi = (token, data) => api.post('/api/admin/testimonials', data, {
  headers: { Authorization: `Bearer ${token}` },
});
export const updateTestimonialApi = (token, id, data) => api.put(`/api/admin/testimonials/${id}`, data, {
  headers: { Authorization: `Bearer ${token}` },
});
export const approveTestimonialApi = (token, id) => api.put(`/api/admin/testimonials/${id}/approve`, {}, {
  headers: { Authorization: `Bearer ${token}` },
});
export const deleteTestimonialApi = (token, id) => api.delete(`/api/admin/testimonials/${id}`, {
  headers: { Authorization: `Bearer ${token}` },
});

// --- Admin: Analytics ---
export const getAnalyticsApi = (token, range = '30d', startDate = '', endDate = '') => {
  const params = new URLSearchParams({ range });
  if (range === 'custom' && startDate && endDate) {
    params.set('startDate', startDate);
    params.set('endDate', endDate);
  }
  return api.get(`/api/admin/analytics?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

// --- Admin: Comments ---
export const getAdminCommentsApi = (token, status = '', page = 1) =>
  api.get(`/api/admin/comments?status=${status}&page=${page}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
export const approveCommentApi = (token, id) =>
  api.put(`/api/admin/comments/${id}/approve`, {}, {
    headers: { Authorization: `Bearer ${token}` },
  });
export const deleteCommentApi = (token, id) =>
  api.delete(`/api/admin/comments/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

// --- Admin: Quotes ---
export const getQuotesApi = (token, status = '', page = 1) => api.get(`/api/admin/quotes?status=${status}&page=${page}`, {
  headers: { Authorization: `Bearer ${token}` },
});
export const getQuoteByIdApi = (token, id) => api.get(`/api/admin/quotes/${id}`, {
  headers: { Authorization: `Bearer ${token}` },
});
export const toggleReadApi = (token, id, is_read) => api.put(`/api/admin/quotes/${id}/read`, { is_read }, {
  headers: { Authorization: `Bearer ${token}` },
});

export default api;
