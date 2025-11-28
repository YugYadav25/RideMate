// Ensure API_BASE always ends with /api and doesn't have trailing slash
const getApiBase = () => {
  const base = import.meta.env.VITE_API_URL ?? 'http://localhost:5001/api';
  // Remove trailing slash if present
  const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base;
  // Ensure it ends with /api
  if (!cleanBase.endsWith('/api')) {
    return cleanBase.endsWith('/') ? `${cleanBase}api` : `${cleanBase}/api`;
  }
  return cleanBase;
};

const API_BASE = getApiBase();

// Log in development
if (import.meta.env.DEV) {
  console.log('Auth API Base URL:', API_BASE);
}

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    let errorText = '';
    try {
      errorText = await response.text();
      // Try to parse as JSON for better error messages
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.message) {
          errorText = errorJson.message;
        }
      } catch {
        // Keep original errorText if not JSON
      }
    } catch (e) {
      errorText = `HTTP ${response.status}: ${response.statusText}`;
    }
    throw new Error(errorText || `Request failed with status ${response.status}`);
  }
  try {
    return await response.json() as Promise<T>;
  } catch (e) {
    throw new Error('Invalid JSON response from server');
  }
};

export type User = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'driver' | 'rider';
  createdAt?: string;
  emergencyName1?: string;
  emergencyPhone1?: string;
  emergencyName2?: string;
  emergencyPhone2?: string;
  emergencyName3?: string;
  emergencyPhone3?: string;
  profilePhoto?: string;
  rating?: number;
  co2Saved?: number;
  greenPoints?: number;
  verificationStatus?: 'unverified' | 'pending' | 'verified' | 'rejected';
};

export type AuthResponse = {
  success: boolean;
  token: string;
  user: User;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: 'driver' | 'rider';
  emergencyName1?: string;
  emergencyPhone1?: string;
  emergencyName2?: string;
  emergencyPhone2?: string;
  emergencyName3?: string;
  emergencyPhone3?: string;
};

export const authApi = {
  /**
   * Login user
   */
  async login(payload: LoginPayload): Promise<AuthResponse> {
    try {
      const url = `${API_BASE}/auth/login`;
      if (import.meta.env.DEV) {
        console.log('Login URL:', url);
        console.log('API_BASE:', API_BASE);
      }
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      // Check if response is HTML (error page)
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        const text = await response.text();
        console.error('Server returned HTML error page:', text);
        throw new Error(`Server route not found. Check if server is running and route exists at ${url}`);
      }

      return handleResponse<AuthResponse>(response);
    } catch (error) {
      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Unable to connect to the server. Please check if the server is running on port 5001.');
      }
      throw error;
    }
  },

  /**
   * Register new user
   */
  async register(payload: RegisterPayload): Promise<AuthResponse> {
    try {
      const url = `${API_BASE}/auth/register`;
      if (import.meta.env.DEV) {
        console.log('Register URL:', url);
        console.log('API_BASE:', API_BASE);
        console.log('Payload:', { ...payload, password: '***' });
      }
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      // Check if response is HTML (error page)
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        const text = await response.text();
        console.error('Server returned HTML error page:', text);
        throw new Error(`Server route not found. Check if server is running and route exists at ${url}`);
      }

      return handleResponse<AuthResponse>(response);
    } catch (error) {
      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Unable to connect to the server. Please check if the server is running on port 5001.');
      }
      throw error;
    }
  },

  /**
   * Get current user (requires token)
   */
  async getMe(token: string): Promise<{ success: boolean; user: User }> {
    try {
      const response = await fetch(`${API_BASE}/auth/me`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      return handleResponse<{ success: boolean; user: User }>(response);
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Unable to connect to the server. Please check if the server is running.');
      }
      throw error;
    }
  },

  /**
   * Update user profile (requires token)
   */
  async updateProfile(
    token: string,
    updates: {
      name?: string;
      phone?: string;
      emergencyName1?: string;
      emergencyPhone1?: string;
      emergencyName2?: string;
      emergencyPhone2?: string;
      emergencyName3?: string;
      emergencyPhone3?: string;
      profilePhoto?: string;
    }
  ): Promise<{ success: boolean; user: User }> {
    try {
      const response = await fetch(`${API_BASE}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });
      return handleResponse<{ success: boolean; user: User }>(response);
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Unable to connect to the server. Please check if the server is running.');
      }
      throw error;
    }
  },
};

