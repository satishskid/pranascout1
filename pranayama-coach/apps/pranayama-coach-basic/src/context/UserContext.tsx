/**
 * User Context Provider
 * Manages user authentication and profile state
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserPreferences, Gamification } from '../types/user';
import { AuthService } from '../services/AuthService';
import { UserService } from '../services/UserService';

interface UserContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (userData: User) => void;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  updatePreferences: (preferences: Partial<UserPreferences>) => Promise<void>;
  updateGamification: (gamification: Partial<Gamification>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      const token = await AuthService.getStoredToken();
      
      if (token) {
        const userData = await AuthService.validateToken(token);
        if (userData) {
          setUser(userData);
          setIsAuthenticated(true);
        } else {
          // Token is invalid, clear it
          await AuthService.clearStoredToken();
        }
      }
    } catch (error) {
      console.error('Auth status check failed:', error);
      await AuthService.clearStoredToken();
    } finally {
      setIsLoading(false);
    }
  };

  const login = (userData: User) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = async () => {
    try {
      await AuthService.logout();
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout failed:', error);
      // Force logout even if API call fails
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!user) {
      throw new Error('No user logged in');
    }

    try {
      const updatedUser = await UserService.updateProfile(user.id, updates);
      setUser(updatedUser);
    } catch (error) {
      console.error('Profile update failed:', error);
      throw error;
    }
  };

  const updatePreferences = async (preferences: Partial<UserPreferences>) => {
    if (!user) {
      throw new Error('No user logged in');
    }

    try {
      const updatedUser = await UserService.updatePreferences(user.id, preferences);
      setUser(updatedUser);
    } catch (error) {
      console.error('Preferences update failed:', error);
      throw error;
    }
  };

  const updateGamification = async (gamification: Partial<Gamification>) => {
    if (!user) {
      throw new Error('No user logged in');
    }

    try {
      const updatedUser = await UserService.updateGamification(user.id, gamification);
      setUser(updatedUser);
    } catch (error) {
      console.error('Gamification update failed:', error);
      throw error;
    }
  };

  const refreshUser = async () => {
    if (!user) {
      throw new Error('No user logged in');
    }

    try {
      setIsLoading(true);
      const refreshedUser = await UserService.getProfile(user.id);
      setUser(refreshedUser);
    } catch (error) {
      console.error('User refresh failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value: UserContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    updateProfile,
    updatePreferences,
    updateGamification,
    refreshUser,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};