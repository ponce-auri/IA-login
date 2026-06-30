import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add Authorization token
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

// Response interceptor to handle 401 errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const requestUrl = error.config?.url || '';
      // No redirigir si el error es de la verificación inicial del token al arrancar
      const isInitialCheck = requestUrl.includes('/auth/me');
      
      // Token inválido o vencido — limpiar sesión
      localStorage.removeItem('token');
      
      if (!isInitialCheck && window.location.pathname !== '/') {
        // Redirigir al login para otras rutas protegidas
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
