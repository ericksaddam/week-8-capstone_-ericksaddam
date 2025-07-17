import { toast } from '@/components/ui/use-toast';

const API_BASE = process.env.NODE_ENV === 'development'
  ? 'http://localhost:5000/api'
  : '/api';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: response.statusText || 'An error occurred'
    }));
    throw new Error(error.message || 'Request failed');
  }
  return response.json();
}

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });
    return await handleResponse<T>(response);
  } catch (error) {
    console.error('API Error:', error);
    
    // Show toast for connection errors
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      toast({
        title: 'Connection Error',
        description: 'Unable to connect to the server. Please check if the backend is running.',
        variant: 'destructive',
      });
    } else if (error instanceof Error) {
      toast({
        title: 'Error',
        description: error.message || 'An error occurred',
        variant: 'destructive',
      });
    }
    
    throw error;
  }
}

// Add a health check function
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/health`);
    return response.ok;
  } catch (error) {
    return false;
  }
}
