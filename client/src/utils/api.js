import axios from 'axios';

// Get API URL from environment or use default
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001';

// Create axios instance with default configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('userRole');
      localStorage.removeItem('identity');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// API endpoints
export const authAPI = {
  parentSignup: (data) => api.post('/parent/signup', data),
  parentLogin: (data) => api.post('/parent/login', data),
  childSignup: (data) => api.post('/child/signup', data),
  childLogin: (data) => api.post('/child/login', data),
  getParentProfile: (phone) => api.get(`/parent/user/${phone}`),
  updateParentProfile: (phone, data) => api.put(`/parent/update/${phone}`, data),
  getChildProfile: (randomId) => api.get(`/child/child/${randomId}`),
};

export const analysisAPI = {
  // Backend routes are defined in Backend/routes/analysis.js
  // POST /analysis/feedback -> create new feedback
  // GET  /analysis/feedback -> list all feedback
  // PUT  /analysis/feedback/:id -> update feedback
  // DELETE /analysis/feedback/:id -> delete feedback
  createFeedback: (data) => api.post('/analysis/feedback', data),
  getAllFeedback: () => api.get('/analysis/feedback'),
  updateFeedback: (id, data) => api.put(`/analysis/feedback/${id}`, data),
  deleteFeedback: (id) => api.delete(`/analysis/feedback/${id}`),
};

export default api;
