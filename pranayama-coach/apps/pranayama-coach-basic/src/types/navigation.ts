/**
 * Navigation types for React Navigation
 */

export type RootStackParamList = {
  Onboarding: undefined;
  Home: undefined;
  Session: {
    sessionType: 'pranayama' | 'meditation_walk' | 'meditation_stationary' | 'breathing_exercise';
    technique?: string;
    duration?: number;
    activityType?: string;
  };
  MeditationZone: {
    activityType?: string;
  };
  Analytics: {
    timeRange?: number;
    metric?: string;
  };
  Settings: undefined;
};

export type ScreenProps<T extends keyof RootStackParamList> = {
  route: {
    params: RootStackParamList[T];
  };
  navigation: any; // Will be properly typed in real implementation
};