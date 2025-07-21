import axios from 'axios';
import { toast } from '@/components/ui/use-toast';

// Construct API base URL with /api suffix
const getApiBaseUrl = () => {
  let baseUrl = import.meta.env.VITE_API_BASE_URL;

  if (!baseUrl && import.meta.env.VITE_API_URL) {
    baseUrl = `${import.meta.env.VITE_API_URL}/api`;
  }

  if (!baseUrl) {
    // Check if we're in development mode
    if (import.meta.env.DEV || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      baseUrl = 'http://localhost:5000/api';
    } else {
      // Fallback to production URL
      baseUrl = 'https://week-8-capstone-ericksaddam.onrender.com/api';
    }
  }

  // Ensure it ends with /api and doesn't have a trailing slash before it
  if (!baseUrl.endsWith('/api')) {
    baseUrl = `${baseUrl.replace(/\/$/, '')}/api`;
  }

  return baseUrl;
};

const apiClient = axios.create({
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Use a request interceptor to dynamically set the baseURL and Authorization header
apiClient.interceptors.request.use(
  (config) => {
    config.baseURL = getApiBaseUrl();
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

// Use a response interceptor for global error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message || // Prefer backend error message
      error.response?.data?.error ||
      error.message ||
      'An unexpected error occurred';

    console.error('API Error:', message, 'Full error:', error);

    toast({
      title: 'Error',
      description: message,
      variant: 'destructive',
    });

    return Promise.reject(error);
  }
);

/**
 * Checks the health of the backend service.
 * Note: This uses a separate axios call because the health check endpoint
 * is at the root, not under /api.
 */
export const checkBackendHealth = async (): Promise<boolean> => {
  try {
    const healthUrl = `${getApiBaseUrl().replace('/api', '')}/health`;
    // We use a new axios instance here to avoid the interceptors that add /api
    const response = await axios.get(healthUrl);
    return response.status === 200;
  } catch (error) {
    console.error('Health check failed:', error);
    return false;
  }
};

export default apiClient;
