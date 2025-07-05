/**
 * Pranayama Coach - Basic Version (Phone Only)
 * Main Application Component
 */

import React, { useEffect, useState } from 'react';
import {
  StatusBar,
  StyleSheet,
  View,
  Text,
  Alert,
  Platform,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Import screens
import HomeScreen from './src/screens/HomeScreen';
import SessionScreen from './src/screens/SessionScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import AnalyticsScreen from './src/screens/AnalyticsScreen';
import MeditationZoneScreen from './src/screens/MeditationZoneScreen';

// Import services
import { AuthService } from './src/services/AuthService';
import { PermissionsService } from './src/services/PermissionsService';
import { VitalSignsService } from './src/services/VitalSignsService';
import { AudioService } from './src/services/AudioService';

// Import types
import { RootStackParamList } from './src/types/navigation';
import { User } from './src/types/user';

// Import context
import { UserProvider, useUser } from './src/context/UserContext';
import { VitalSignsProvider } from './src/context/VitalSignsContext';
import { AudioProvider } from './src/context/AudioContext';

const Stack = createStackNavigator<RootStackParamList>();

interface AppState {
  isLoading: boolean;
  isAuthenticated: boolean;
  hasCompletedOnboarding: boolean;
  permissionsGranted: boolean;
  user: User | null;
}

function AppContent(): JSX.Element {
  const [appState, setAppState] = useState<AppState>({
    isLoading: true,
    isAuthenticated: false,
    hasCompletedOnboarding: false,
    permissionsGranted: false,
    user: null,
  });

  const { user, login, logout } = useUser();

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Check authentication status
      const authToken = await AuthService.getStoredToken();
      if (authToken) {
        const userData = await AuthService.validateToken(authToken);
        if (userData) {
          login(userData);
          setAppState(prev => ({
            ...prev,
            isAuthenticated: true,
            user: userData,
          }));
        }
      }

      // Check onboarding status
      const onboardingCompleted = await AuthService.getOnboardingStatus();
      setAppState(prev => ({
        ...prev,
        hasCompletedOnboarding: onboardingCompleted,
      }));

      // Check and request permissions
      const permissionsResult = await PermissionsService.requestAllPermissions();
      setAppState(prev => ({
        ...prev,
        permissionsGranted: permissionsResult.allGranted,
      }));

      if (!permissionsResult.allGranted) {
        Alert.alert(
          'Permissions Required',
          'Some features may not work properly without the required permissions. You can grant them in the Settings screen.',
          [{ text: 'OK' }]
        );
      }

      // Initialize services
      await VitalSignsService.initialize();
      await AudioService.initialize();

    } catch (error) {
      console.error('App initialization error:', error);
      Alert.alert(
        'Initialization Error',
        'There was an error starting the app. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setAppState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const getInitialRoute = (): keyof RootStackParamList => {
    if (!appState.hasCompletedOnboarding) {
      return 'Onboarding';
    }
    return 'Home';
  };

  if (appState.isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Pranayama Coach</Text>
        <Text style={styles.loadingSubtext}>Initializing...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#1a1a2e"
        translucent={true}
      />
      <Stack.Navigator
        initialRouteName={getInitialRoute()}
        screenOptions={{
          headerStyle: {
            backgroundColor: '#1a1a2e',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          cardStyle: {
            backgroundColor: '#16213e',
          },
        }}
      >
        <Stack.Screen
          name="Onboarding"
          component={OnboardingScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ 
            title: 'Pranayama Coach',
            headerShown: false 
          }}
        />
        <Stack.Screen
          name="Session"
          component={SessionScreen}
          options={({ route }) => ({
            title: route.params?.sessionType || 'Session',
            headerShown: false,
          })}
        />
        <Stack.Screen
          name="MeditationZone"
          component={MeditationZoneScreen}
          options={{
            title: 'Meditation Zone',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="Analytics"
          component={AnalyticsScreen}
          options={{
            title: 'Your Progress',
          }}
        />
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            title: 'Settings',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function App(): JSX.Element {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <UserProvider>
          <VitalSignsProvider>
            <AudioProvider>
              <AppContent />
            </AudioProvider>
          </VitalSignsProvider>
        </UserProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#16213e',
  },
  loadingText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 10,
  },
  loadingSubtext: {
    fontSize: 16,
    color: '#8e9aaf',
  },
});

export default App;