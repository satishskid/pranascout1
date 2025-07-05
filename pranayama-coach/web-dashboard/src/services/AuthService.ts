import axios, { AxiosResponse } from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

interface LoginResponse {
  token: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    id: string;
    email: string;
    name: string;
    role: 'admin' | 'support' | 'analyst';
    permissions: string[];
    lastLogin: Date;
    avatar?: string;
  };
}

interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'support' | 'analyst';
  permissions: string[];
  lastLogin: Date;
  avatar?: string;
}

class AuthServiceClass {
  private baseURL = `${API_BASE_URL}/auth`;

  constructor() {
    // Add token to all requests
    axios.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Handle token expiration
    axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const response: AxiosResponse<LoginResponse> = await axios.post(
        `${this.baseURL}/login`,
        {
          email,
          password,
        }
      );

      const { token, refreshToken } = response.data;
      
      // Store tokens
      localStorage.setItem('auth_token', token);
      localStorage.setItem('refresh_token', refreshToken);

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          error.response?.data?.message || 'Login failed'
        );
      }
      throw new Error('Network error occurred');
    }
  }

  async logout(): Promise<void> {
    try {
      await axios.post(`${this.baseURL}/logout`);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
    }
  }

  async getCurrentUser(): Promise<User> {
    try {
      const response: AxiosResponse<{ user: User }> = await axios.get(
        `${this.baseURL}/me`
      );
      return response.data.user;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          error.response?.data?.message || 'Failed to get user data'
        );
      }
      throw new Error('Network error occurred');
    }
  }

  async refreshToken(): Promise<string> {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response: AxiosResponse<{ token: string }> = await axios.post(
        `${this.baseURL}/refresh`,
        { refreshToken }
      );

      const { token } = response.data;
      localStorage.setItem('auth_token', token);
      
      return token;
    } catch (error) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      throw error;
    }
  }

  async requestPasswordReset(email: string): Promise<void> {
    try {
      await axios.post(`${this.baseURL}/forgot-password`, { email });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          error.response?.data?.message || 'Password reset request failed'
        );
      }
      throw new Error('Network error occurred');
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      await axios.post(`${this.baseURL}/reset-password`, {
        token,
        password: newPassword,
      });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          error.response?.data?.message || 'Password reset failed'
        );
      }
      throw new Error('Network error occurred');
    }
  }

  isAuthenticated(): boolean {
    const token = localStorage.getItem('auth_token');
    return !!token;
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  hasPermission(permission: string): boolean {
    // This would typically check against the current user's permissions
    // For now, we'll implement a basic check
    const user = this.getCurrentUserFromStorage();
    return user?.permissions?.includes(permission) || false;
  }

  hasRole(role: string): boolean {
    const user = this.getCurrentUserFromStorage();
    return user?.role === role;
  }

  private getCurrentUserFromStorage(): User | null {
    try {
      const userStr = localStorage.getItem('current_user');
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  }
}

export const AuthService = new AuthServiceClass();