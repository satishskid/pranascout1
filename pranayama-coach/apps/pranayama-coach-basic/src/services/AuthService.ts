/**
 * Authentication Service
 * Handles user authentication, token management, and secure storage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types/user';
import { ApiService } from './ApiService';
import { EncryptionService } from './EncryptionService';

interface LoginCredentials {
  email: string;
  password: string;
  deviceInfo?: any;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: Date;
  acceptTerms: boolean;
  acceptPrivacy: boolean;
}

interface AuthResponse {
  user: User;
  token: string;
  expiresAt: string;
}

export class AuthService {
  private static readonly TOKEN_KEY = 'auth_token';
  private static readonly USER_KEY = 'user_data';
  private static readonly ONBOARDING_KEY = 'onboarding_completed';
  private static readonly BIOMETRIC_KEY = 'biometric_enabled';

  /**
   * Register a new user
   */
  static async register(data: RegisterData): Promise<AuthResponse> {
    try {
      const response = await ApiService.post<AuthResponse>('/auth/register', data);
      
      // Store authentication data securely
      await this.storeAuthData(response.token, response.user);
      
      return response;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  }

  /**
   * Login user with email and password
   */
  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await ApiService.post<AuthResponse>('/auth/login', credentials);
      
      // Store authentication data securely
      await this.storeAuthData(response.token, response.user);
      
      return response;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  /**
   * Logout user and clear stored data
   */
  static async logout(): Promise<void> {
    try {
      // Call logout endpoint to invalidate token on server
      await ApiService.post('/auth/logout', {});
    } catch (error) {
      console.error('Server logout failed:', error);
      // Continue with local logout even if server call fails
    }
    
    // Clear all stored authentication data
    await this.clearAuthData();
  }

  /**
   * Request password reset
   */
  static async forgotPassword(email: string): Promise<void> {
    try {
      await ApiService.post('/auth/forgot-password', { email });
    } catch (error) {
      console.error('Password reset request failed:', error);
      throw error;
    }
  }

  /**
   * Reset password with token
   */
  static async resetPassword(token: string, password: string): Promise<void> {
    try {
      await ApiService.post('/auth/reset-password', { token, password });
    } catch (error) {
      console.error('Password reset failed:', error);
      throw error;
    }
  }

  /**
   * Verify email address
   */
  static async verifyEmail(token: string): Promise<void> {
    try {
      await ApiService.post('/auth/verify-email', { token });
    } catch (error) {
      console.error('Email verification failed:', error);
      throw error;
    }
  }

  /**
   * Refresh authentication token
   */
  static async refreshToken(): Promise<string> {
    try {
      const currentToken = await this.getStoredToken();
      if (!currentToken) {
        throw new Error('No token to refresh');
      }

      const response = await ApiService.post<{ token: string; expiresAt: string }>(
        '/auth/refresh-token',
        {},
        { Authorization: `Bearer ${currentToken}` }
      );

      // Store new token
      await this.storeToken(response.token);
      
      return response.token;
    } catch (error) {
      console.error('Token refresh failed:', error);
      // Clear invalid token
      await this.clearAuthData();
      throw error;
    }
  }

  /**
   * Validate stored token and return user data
   */
  static async validateToken(token: string): Promise<User | null> {
    try {
      const response = await ApiService.get<User>(
        '/auth/validate',
        { Authorization: `Bearer ${token}` }
      );
      
      return response;
    } catch (error) {
      console.error('Token validation failed:', error);
      return null;
    }
  }

  /**
   * Store authentication data securely
   */
  private static async storeAuthData(token: string, user: User): Promise<void> {
    try {
      // Encrypt sensitive data
      const encryptedUser = await EncryptionService.encrypt(JSON.stringify(user));
      
      await Promise.all([
        this.storeToken(token),
        AsyncStorage.setItem(this.USER_KEY, encryptedUser),
      ]);
    } catch (error) {
      console.error('Failed to store auth data:', error);
      throw error;
    }
  }

  /**
   * Store authentication token
   */
  static async storeToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem(this.TOKEN_KEY, token);
      // Update API service with new token
      ApiService.setAuthToken(token);
    } catch (error) {
      console.error('Failed to store token:', error);
      throw error;
    }
  }

  /**
   * Get stored authentication token
   */
  static async getStoredToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(this.TOKEN_KEY);
    } catch (error) {
      console.error('Failed to get stored token:', error);
      return null;
    }
  }

  /**
   * Get stored user data
   */
  static async getStoredUser(): Promise<User | null> {
    try {
      const encryptedUser = await AsyncStorage.getItem(this.USER_KEY);
      if (!encryptedUser) return null;
      
      const decryptedUser = await EncryptionService.decrypt(encryptedUser);
      return JSON.parse(decryptedUser);
    } catch (error) {
      console.error('Failed to get stored user:', error);
      return null;
    }
  }

  /**
   * Clear all authentication data
   */
  static async clearAuthData(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem(this.TOKEN_KEY),
        AsyncStorage.removeItem(this.USER_KEY),
      ]);
      
      // Clear API service auth token
      ApiService.clearAuthToken();
    } catch (error) {
      console.error('Failed to clear auth data:', error);
    }
  }

  /**
   * Check if user is authenticated
   */
  static async isAuthenticated(): Promise<boolean> {
    try {
      const token = await this.getStoredToken();
      if (!token) return false;
      
      // Validate token with server
      const user = await this.validateToken(token);
      return user !== null;
    } catch (error) {
      console.error('Authentication check failed:', error);
      return false;
    }
  }

  /**
   * Enable biometric authentication
   */
  static async enableBiometric(): Promise<void> {
    try {
      // Implementation would use react-native-biometrics or similar
      // For now, just store the preference
      await AsyncStorage.setItem(this.BIOMETRIC_KEY, 'true');
    } catch (error) {
      console.error('Failed to enable biometric auth:', error);
      throw error;
    }
  }

  /**
   * Disable biometric authentication
   */
  static async disableBiometric(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.BIOMETRIC_KEY);
    } catch (error) {
      console.error('Failed to disable biometric auth:', error);
      throw error;
    }
  }

  /**
   * Check if biometric authentication is enabled
   */
  static async isBiometricEnabled(): Promise<boolean> {
    try {
      const enabled = await AsyncStorage.getItem(this.BIOMETRIC_KEY);
      return enabled === 'true';
    } catch (error) {
      console.error('Failed to check biometric status:', error);
      return false;
    }
  }

  /**
   * Authenticate with biometric
   */
  static async biometricLogin(): Promise<AuthResponse | null> {
    try {
      // Implementation would use biometric authentication library
      // For now, return stored user data if biometric is enabled
      const isBiometricEnabled = await this.isBiometricEnabled();
      if (!isBiometricEnabled) {
        throw new Error('Biometric authentication is not enabled');
      }

      const token = await this.getStoredToken();
      const user = await this.getStoredUser();
      
      if (token && user) {
        // Validate token is still valid
        const validUser = await this.validateToken(token);
        if (validUser) {
          return {
            user: validUser,
            token,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          };
        }
      }
      
      return null;
    } catch (error) {
      console.error('Biometric login failed:', error);
      throw error;
    }
  }

  /**
   * Set onboarding completion status
   */
  static async setOnboardingCompleted(completed: boolean = true): Promise<void> {
    try {
      await AsyncStorage.setItem(this.ONBOARDING_KEY, completed.toString());
    } catch (error) {
      console.error('Failed to set onboarding status:', error);
      throw error;
    }
  }

  /**
   * Get onboarding completion status
   */
  static async getOnboardingStatus(): Promise<boolean> {
    try {
      const status = await AsyncStorage.getItem(this.ONBOARDING_KEY);
      return status === 'true';
    } catch (error) {
      console.error('Failed to get onboarding status:', error);
      return false;
    }
  }

  /**
   * Update stored user data
   */
  static async updateStoredUser(user: User): Promise<void> {
    try {
      const encryptedUser = await EncryptionService.encrypt(JSON.stringify(user));
      await AsyncStorage.setItem(this.USER_KEY, encryptedUser);
    } catch (error) {
      console.error('Failed to update stored user:', error);
      throw error;
    }
  }

  /**
   * Get device information for authentication
   */
  static getDeviceInfo(): any {
    // Implementation would use react-native-device-info
    return {
      platform: 'mobile',
      version: '1.0.0',
      device: 'unknown',
    };
  }
}