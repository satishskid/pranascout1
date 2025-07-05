import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '../context/UserContext';
import { useVitalSigns } from '../context/VitalSignsContext';
import { useAudio } from '../context/AudioContext';
import VitalSignsDisplay from '../components/VitalSignsDisplay';
import StressMeter from '../components/StressMeter';

const { width, height } = Dimensions.get('window');

const HomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useUser();
  const { currentData, isMonitoring, startMonitoring } = useVitalSigns();
  const { isPlaying } = useAudio();
  
  const [timeOfDay, setTimeOfDay] = useState('morning');
  const [dailyProgress, setDailyProgress] = useState({
    sessionsCompleted: 2,
    totalMinutes: 25,
    streakDays: 7,
    stressReduction: 15,
  });

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setTimeOfDay('morning');
    else if (hour < 18) setTimeOfDay('afternoon');
    else setTimeOfDay('evening');
  }, []);

  const getGreeting = () => {
    const name = user?.profile?.firstName || 'there';
    switch (timeOfDay) {
      case 'morning': return `Good morning, ${name}`;
      case 'afternoon': return `Good afternoon, ${name}`;
      case 'evening': return `Good evening, ${name}`;
      default: return `Hello, ${name}`;
    }
  };

  const pranayamaTypes = [
    {
      id: 'box-breathing',
      name: 'Box Breathing',
      description: 'Equal count inhale, hold, exhale, hold',
      duration: '5-15 min',
      difficulty: 'Beginner',
      icon: '⬜',
      gradient: ['#667eea', '#764ba2'],
    },
    {
      id: 'nadi-shodhana',
      name: 'Nadi Shodhana',
      description: 'Alternate nostril breathing',
      duration: '10-20 min',
      difficulty: 'Intermediate',
      icon: '🌬️',
      gradient: ['#f093fb', '#f5576c'],
    },
    {
      id: 'ujjayi',
      name: 'Ujjayi',
      description: 'Ocean breath with throat constriction',
      duration: '5-30 min',
      difficulty: 'Advanced',
      icon: '🌊',
      gradient: ['#4facfe', '#00f2fe'],
    },
    {
      id: 'bhramari',
      name: 'Bhramari',
      description: 'Humming bee breath',
      duration: '5-10 min',
      difficulty: 'Beginner',
      icon: '🐝',
      gradient: ['#43e97b', '#38f9d7'],
    },
  ];

  const quickActions = [
    {
      id: 'meditation-zone',
      name: 'Meditation Zone',
      icon: '🧘',
      action: () => navigation.navigate('MeditationZone'),
    },
    {
      id: 'analytics',
      name: 'Analytics',
      icon: '📊',
      action: () => navigation.navigate('Analytics'),
    },
    {
      id: 'settings',
      name: 'Settings',
      icon: '⚙️',
      action: () => navigation.navigate('Settings'),
    },
    {
      id: 'emergency',
      name: 'Emergency Calm',
      icon: '🆘',
      action: () => startEmergencySession(),
    },
  ];

  const startPranayamaSession = (type: string) => {
    navigation.navigate('Session', { 
      sessionType: 'pranayama',
      technique: type,
    });
  };

  const startEmergencySession = () => {
    navigation.navigate('Session', {
      sessionType: 'emergency',
      technique: 'box-breathing',
      duration: 5,
    });
  };

  const handleVitalSignsToggle = () => {
    if (isMonitoring) {
      // Stop monitoring logic handled in context
    } else {
      startMonitoring();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#667eea" />
      
      {/* Header */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.subtitle}>Ready for your practice?</Text>
          </View>
          <TouchableOpacity 
            style={styles.profileButton}
            onPress={() => navigation.navigate('Profile')}
          >
            <Text style={styles.profileInitial}>
              {user?.profile?.firstName?.[0] || 'U'}
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Daily Progress */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Progress</Text>
          <View style={styles.progressGrid}>
            <View style={styles.progressCard}>
              <Text style={styles.progressNumber}>{dailyProgress.sessionsCompleted}</Text>
              <Text style={styles.progressLabel}>Sessions</Text>
            </View>
            <View style={styles.progressCard}>
              <Text style={styles.progressNumber}>{dailyProgress.totalMinutes}</Text>
              <Text style={styles.progressLabel}>Minutes</Text>
            </View>
            <View style={styles.progressCard}>
              <Text style={styles.progressNumber}>{dailyProgress.streakDays}</Text>
              <Text style={styles.progressLabel}>Day Streak</Text>
            </View>
            <View style={styles.progressCard}>
              <Text style={styles.progressNumber}>-{dailyProgress.stressReduction}%</Text>
              <Text style={styles.progressLabel}>Stress</Text>
            </View>
          </View>
        </View>

        {/* Vital Signs */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Vital Signs</Text>
            <TouchableOpacity 
              style={[
                styles.monitorButton,
                isMonitoring && styles.monitorButtonActive
              ]}
              onPress={handleVitalSignsToggle}
            >
              <Text style={[
                styles.monitorButtonText,
                isMonitoring && styles.monitorButtonTextActive
              ]}>
                {isMonitoring ? 'Stop' : 'Start'}
              </Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.vitalSignsContainer}>
            <VitalSignsDisplay 
              data={currentData} 
              isMonitoring={isMonitoring}
              compact={true}
            />
            <StressMeter 
              level={currentData?.stressLevel || 0}
              size={80}
            />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.quickActionButton}
                onPress={action.action}
              >
                <Text style={styles.quickActionIcon}>{action.icon}</Text>
                <Text style={styles.quickActionText}>{action.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Pranayama Techniques */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pranayama Techniques</Text>
          {pranayamaTypes.map((technique) => (
            <TouchableOpacity
              key={technique.id}
              style={styles.techniqueCard}
              onPress={() => startPranayamaSession(technique.id)}
            >
              <LinearGradient
                colors={technique.gradient}
                style={styles.techniqueGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.techniqueContent}>
                  <View style={styles.techniqueHeader}>
                    <Text style={styles.techniqueIcon}>{technique.icon}</Text>
                    <View style={styles.techniqueInfo}>
                      <Text style={styles.techniqueName}>{technique.name}</Text>
                      <Text style={styles.techniqueDescription}>
                        {technique.description}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.techniqueFooter}>
                    <Text style={styles.techniqueDuration}>{technique.duration}</Text>
                    <View style={[
                      styles.difficultyBadge,
                      technique.difficulty === 'Beginner' && styles.beginnerBadge,
                      technique.difficulty === 'Intermediate' && styles.intermediateBadge,
                      technique.difficulty === 'Advanced' && styles.advancedBadge,
                    ]}>
                      <Text style={styles.difficultyText}>{technique.difficulty}</Text>
                    </View>
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  profileButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitial: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 15,
  },
  progressGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  progressNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#667eea',
    marginBottom: 5,
  },
  progressLabel: {
    fontSize: 12,
    color: '#718096',
    textAlign: 'center',
  },
  monitorButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#667eea',
  },
  monitorButtonActive: {
    backgroundColor: '#667eea',
  },
  monitorButtonText: {
    color: '#667eea',
    fontWeight: '600',
  },
  monitorButtonTextActive: {
    color: 'white',
  },
  vitalSignsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    color: '#4a5568',
    textAlign: 'center',
    fontWeight: '500',
  },
  techniqueCard: {
    marginBottom: 15,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  techniqueGradient: {
    padding: 20,
  },
  techniqueContent: {
    flex: 1,
  },
  techniqueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  techniqueIcon: {
    fontSize: 32,
    marginRight: 15,
  },
  techniqueInfo: {
    flex: 1,
  },
  techniqueName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  techniqueDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  techniqueFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  techniqueDuration: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  beginnerBadge: {
    backgroundColor: 'rgba(72, 187, 120, 0.2)',
  },
  intermediateBadge: {
    backgroundColor: 'rgba(237, 137, 54, 0.2)',
  },
  advancedBadge: {
    backgroundColor: 'rgba(245, 101, 101, 0.2)',
  },
  difficultyText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
  bottomSpacing: {
    height: 30,
  },
});

export default HomeScreen;