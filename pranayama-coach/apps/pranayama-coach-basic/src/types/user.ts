/**
 * User and authentication related types
 */

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  profile: UserProfile;
  preferences: UserPreferences;
  subscription: Subscription;
  gamification: Gamification;
  createdAt: string;
  lastActiveAt: string;
}

export interface UserProfile {
  firstName: string;
  lastName: string;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other' | 'prefer-not-to-say';
  height?: number; // cm
  weight?: number; // kg
  timezone: string;
  language: string;
}

export interface UserPreferences {
  notifications: NotificationSettings;
  audioVisual: AudioVisualSettings;
  privacy: PrivacySettings;
}

export interface NotificationSettings {
  enabled: boolean;
  reminderTimes: string[]; // HH:MM format
  sessionReminders: boolean;
  achievementAlerts: boolean;
}

export interface AudioVisualSettings {
  theme: 'forest' | 'ocean' | 'mountain' | 'cosmic' | 'minimal';
  breathingSound: 'none' | 'ocean' | 'forest' | 'chime' | 'custom';
  voiceGuidance: boolean;
  hapticFeedback: boolean;
  backgroundMusic: boolean;
}

export interface PrivacySettings {
  dataSharing: boolean;
  analyticsOptIn: boolean;
  consentVersion: string;
  consentDate: Date;
}

export interface Subscription {
  plan: 'free' | 'premium' | 'pro';
  expiresAt?: Date;
  features: SubscriptionFeature[];
}

export interface SubscriptionFeature {
  name: string;
  enabled: boolean;
}

export interface Gamification {
  level: number;
  experience: number;
  streakDays: number;
  longestStreak: number;
  lastSessionDate?: Date;
  achievements: Achievement[];
  badges: Badge[];
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  unlockedAt: Date;
  category: string;
}

export interface Badge {
  type: string;
  level: number;
  earnedAt: Date;
}

export interface HealthBaseline {
  restingHeartRate?: number;
  maxHeartRate?: number;
  averageHRV?: number;
  baselineSpO2?: number;
  breathingRate?: number;
  lastUpdated: Date;
}