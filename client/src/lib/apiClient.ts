import { toast } from '@/components/ui/use-toast';

// Debug logging
console.log('Environment:', {
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
  NODE_ENV: import.meta.env.MODE
});

// Construct API base URL with /api suffix
const getApiBaseUrl = () => {
  let baseUrl = import.meta.env.VITE_API_BASE_URL;

  // If VITE_API_BASE_URL is not set, try VITE_API_URL
  if (!baseUrl && import.meta.env.VITE_API_URL) {
    baseUrl = `${import.meta.env.VITE_API_URL}/api`;
  }

  // If it's still not set, use the fallback
  if (!baseUrl) {
    baseUrl = 'https://week-8-capstone-ericksaddam.onrender.com/api';
  }

  // Final check: ensure the URL ends with /api
  if (!baseUrl.endsWith('/api')) {
    // Avoid double slashes if baseUrl ends with a slash
    baseUrl = `${baseUrl.replace(/\/$/, '')}/api`;
  }

  return baseUrl;
};

const API_BASE = getApiBaseUrl();
console.log('Using API base URL:', API_BASE);

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: response.statusText || 'An error occurred',
      status: response.status
    }));
    
    const errorMessage = error.message || `Request failed with status ${response.status}`;
    console.error('API Error:', {
      status: response.status,
      statusText: response.statusText,
      url: response.url,
      message: errorMessage
    });
    
    throw new Error(errorMessage);
  }
  return response.json();
}

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  console.log(`API Request: ${options.method || 'GET'} ${url}`);
  
  try {
    const response = await fetch(url, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(options.headers || {}),
      },
    });
    
    console.log(`API Response: ${response.status} ${response.statusText} - ${url}`);
    return await handleResponse<T>(response);
  } catch (error) {
    console.error('Network Error:', error);
    
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      toast({
        title: 'Connection Error',
        description: 'Unable to connect to the server. Please check if the backend is running and CORS is properly configured.',
        variant: 'destructive',
      });
    } else if (error instanceof Error) {
      toast({
        title: 'Error',
        description: error.message || 'An unexpected error occurred',
        variant: 'destructive',
      });
    }
    
    throw error;
  }
}
export async function checkBackendHealth(): Promise<boolean> {
  // For health check, use the base URL without /api since health endpoint is at root
  const getBaseUrl = () => {
    if (import.meta.env.VITE_API_BASE_URL) {
      // Remove /api suffix if present
      return import.meta.env.VITE_API_BASE_URL.replace('/api', '');
    }
    if (import.meta.env.VITE_API_URL) {
      return import.meta.env.VITE_API_URL;
    }
    return 'https://week-8-capstone-ericksaddam.onrender.com';
  };
  
  const baseUrl = getBaseUrl();
  const healthUrl = `${baseUrl}/health`;
  console.log('Checking backend health at:', healthUrl);
  
  try {
    const response = await fetch(healthUrl, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      cache: 'no-cache'
    });
    
    console.log('Health check response:', {
      status: response.status,
      statusText: response.statusText,
      url: response.url,
      headers: Object.fromEntries(response.headers.entries())
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error('Health check failed:', {
        status: response.status,
        error: error?.message || 'Unknown error'
      });
      return false;
    }
    
    const data = await response.json();
    console.log('Health check successful:', data);
    return true;
    
  } catch (error) {
    console.error('Health check error:', error);
    return false;
  }
}
