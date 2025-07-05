import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  SafeAreaView,
  Animated,
  Modal,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useVitalSigns } from '../context/VitalSignsContext';
import { useAudio } from '../context/AudioContext';
import BreathingPacer from '../components/BreathingPacer';
import VitalSignsDisplay from '../components/VitalSignsDisplay';
import StressMeter from '../components/StressMeter';
import SessionControls from '../components/SessionControls';

const { width, height } = Dimensions.get('window');

interface SessionParams {
  sessionType: 'pranayama' | 'meditation' | 'emergency';
  technique: string;
  duration?: number;
}

const SessionScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params as SessionParams;
  
  const { currentData, isMonitoring, startMonitoring, stopMonitoring } = useVitalSigns();
  const { playGuidance, stopGuidance, isPlaying } = useAudio();
  
  // Session state
  const [sessionState, setSessionState] = useState<'preparing' | 'active' | 'paused' | 'completed'>('preparing');
  const [duration, setDuration] = useState(params.duration || 10); // minutes
  const [elapsedTime, setElapsedTime] = useState(0); // seconds
  const [breathingPhase, setBreathingPhase] = useState<'inhale' | 'hold' | 'exhale' | 'pause'>('inhale');
  const [breathCount, setBreathCount] = useState(0);
  const [showExitModal, setShowExitModal] = useState(false);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  
  // Breathing patterns
  const breathingPatterns = {
    'box-breathing': { inhale: 4, hold1: 4, exhale: 4, hold2: 4 },
    'nadi-shodhana': { inhale: 4, hold1: 2, exhale: 6, hold2: 1 },
    'ujjayi': { inhale: 5, hold1: 1, exhale: 7, hold2: 1 },
    'bhramari': { inhale: 4, hold1: 1, exhale: 6, hold2: 2 },
    'emergency': { inhale: 4, hold1: 4, exhale: 4, hold2: 4 },
  };
  
  const currentPattern = breathingPatterns[params.technique as keyof typeof breathingPatterns] || breathingPatterns['box-breathing'];
  
  // Session metrics
  const [sessionMetrics, setSessionMetrics] = useState({
    avgHeartRate: 0,
    avgHRV: 0,
    stressReduction: 0,
    breathsCompleted: 0,
    initialStress: 0,
    finalStress: 0,
  });

  useEffect(() => {
    // Start session preparation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
    
    // Start monitoring vital signs
    startMonitoring();
    
    // Set initial stress level
    if (currentData?.stressLevel) {
      setSessionMetrics(prev => ({ ...prev, initialStress: currentData.stressLevel || 0 }));
    }
    
    return () => {
      stopMonitoring();
      stopGuidance();
    };
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (sessionState === 'active') {
      interval = setInterval(() => {
        setElapsedTime(prev => {
          const newTime = prev + 1;
          if (newTime >= duration * 60) {
            completeSession();
          }
          return newTime;
        });
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [sessionState, duration]);

  const startSession = () => {
    setSessionState('active');
    playGuidance(params.technique, currentPattern);
  };

  const pauseSession = () => {
    setSessionState('paused');
    stopGuidance();
  };

  const resumeSession = () => {
    setSessionState('active');
    playGuidance(params.technique, currentPattern);
  };

  const completeSession = () => {
    setSessionState('completed');
    stopGuidance();
    stopMonitoring();
    
    // Calculate final metrics
    const finalStress = currentData?.stressLevel || 0;
    const stressReduction = Math.max(0, sessionMetrics.initialStress - finalStress);
    
    setSessionMetrics(prev => ({
      ...prev,
      finalStress,
      stressReduction,
      breathsCompleted: breathCount,
      avgHeartRate: currentData?.heartRate || 0,
      avgHRV: currentData?.hrv || 0,
    }));
  };

  const exitSession = () => {
    setShowExitModal(true);
  };

  const confirmExit = () => {
    stopGuidance();
    stopMonitoring();
    navigation.goBack();
  };

  const onBreathComplete = (phase: string) => {
    setBreathingPhase(phase as any);
    if (phase === 'exhale') {
      setBreathCount(prev => prev + 1);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getSessionTitle = () => {
    switch (params.technique) {
      case 'box-breathing': return 'Box Breathing';
      case 'nadi-shodhana': return 'Nadi Shodhana';
      case 'ujjayi': return 'Ujjayi Breathing';
      case 'bhramari': return 'Bhramari Breathing';
      case 'emergency': return 'Emergency Calm';
      default: return 'Breathing Session';
    }
  };

  const getGradientColors = () => {
    switch (params.technique) {
      case 'box-breathing': return ['#667eea', '#764ba2'];
      case 'nadi-shodhana': return ['#f093fb', '#f5576c'];
      case 'ujjayi': return ['#4facfe', '#00f2fe'];
      case 'bhramari': return ['#43e97b', '#38f9d7'];
      case 'emergency': return ['#ff6b6b', '#ee5a24'];
      default: return ['#667eea', '#764ba2'];
    }
  };

  const renderPreparationScreen = () => (
    <Animated.View style={[styles.preparationContainer, { opacity: fadeAnim }]}>
      <Text style={styles.sessionTitle}>{getSessionTitle()}</Text>
      <Text style={styles.preparationText}>
        Prepare yourself for a {duration} minute session
      </Text>
      
      <View style={styles.preparationInstructions}>
        <Text style={styles.instructionTitle}>Before we begin:</Text>
        <Text style={styles.instructionText}>• Find a comfortable seated position</Text>
        <Text style={styles.instructionText}>• Place your phone steady or hold gently</Text>
        <Text style={styles.instructionText}>• Close your eyes or soften your gaze</Text>
        <Text style={styles.instructionText}>• Take a few natural breaths</Text>
      </View>
      
      <TouchableOpacity style={styles.startButton} onPress={startSession}>
        <Text style={styles.startButtonText}>Begin Session</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderActiveSession = () => (
    <View style={styles.activeSessionContainer}>
      {/* Header */}
      <View style={styles.sessionHeader}>
        <TouchableOpacity style={styles.exitButton} onPress={exitSession}>
          <Text style={styles.exitButtonText}>✕</Text>
        </TouchableOpacity>
        <View style={styles.sessionInfo}>
          <Text style={styles.sessionTitleSmall}>{getSessionTitle()}</Text>
          <Text style={styles.timeRemaining}>
            {formatTime((duration * 60) - elapsedTime)}
          </Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      {/* Main breathing area */}
      <View style={styles.breathingArea}>
        <BreathingPacer
          pattern={currentPattern}
          isActive={sessionState === 'active'}
          onPhaseChange={onBreathComplete}
          technique={params.technique}
        />
        
        <View style={styles.breathingStats}>
          <Text style={styles.breathCountText}>
            Breaths: {breathCount}
          </Text>
          <Text style={styles.phaseText}>
            {breathingPhase.charAt(0).toUpperCase() + breathingPhase.slice(1)}
          </Text>
        </View>
      </View>

      {/* Vital signs */}
      <View style={styles.vitalSignsSection}>
        <VitalSignsDisplay 
          data={currentData} 
          isMonitoring={isMonitoring}
          compact={true}
        />
        <StressMeter 
          level={currentData?.stressLevel || 0}
          size={60}
        />
      </View>

      {/* Controls */}
      <SessionControls
        sessionState={sessionState}
        onPause={pauseSession}
        onResume={resumeSession}
        onStop={exitSession}
      />
    </View>
  );

  const renderCompletedSession = () => (
    <View style={styles.completedContainer}>
      <Text style={styles.completedTitle}>Session Complete! 🎉</Text>
      
      <View style={styles.metricsContainer}>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{formatTime(elapsedTime)}</Text>
          <Text style={styles.metricLabel}>Duration</Text>
        </View>
        
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{sessionMetrics.breathsCompleted}</Text>
          <Text style={styles.metricLabel}>Breaths</Text>
        </View>
        
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>-{sessionMetrics.stressReduction.toFixed(1)}</Text>
          <Text style={styles.metricLabel}>Stress Reduction</Text>
        </View>
        
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{sessionMetrics.avgHeartRate}</Text>
          <Text style={styles.metricLabel}>Avg HR</Text>
        </View>
      </View>
      
      <View style={styles.completedActions}>
        <TouchableOpacity 
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('Analytics')}
        >
          <Text style={styles.secondaryButtonText}>View Analytics</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.primaryButton}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.primaryButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderContent = () => {
    switch (sessionState) {
      case 'preparing':
        return renderPreparationScreen();
      case 'active':
      case 'paused':
        return renderActiveSession();
      case 'completed':
        return renderCompletedSession();
      default:
        return renderPreparationScreen();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={getGradientColors()[0]} />
      
      <LinearGradient
        colors={getGradientColors()}
        style={styles.gradientContainer}
      >
        {renderContent()}
      </LinearGradient>

      {/* Exit confirmation modal */}
      <Modal
        visible={showExitModal}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>End Session?</Text>
            <Text style={styles.modalText}>
              Your progress will be saved, but the session will be marked as incomplete.
            </Text>
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.modalCancelButton}
                onPress={() => setShowExitModal(false)}
              >
                <Text style={styles.modalCancelText}>Continue Session</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.modalConfirmButton}
                onPress={confirmExit}
              >
                <Text style={styles.modalConfirmText}>End Session</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientContainer: {
    flex: 1,
  },
  preparationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  sessionTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
    textAlign: 'center',
  },
  preparationText: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 40,
    textAlign: 'center',
  },
  preparationInstructions: {
    marginBottom: 50,
  },
  instructionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
    marginBottom: 15,
    textAlign: 'center',
  },
  instructionText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
    paddingLeft: 20,
  },
  startButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: 'white',
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  activeSessionContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 20,
  },
  exitButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  exitButtonText: {
    fontSize: 20,
    color: 'white',
    fontWeight: 'bold',
  },
  sessionInfo: {
    alignItems: 'center',
  },
  sessionTitleSmall: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: 5,
  },
  timeRemaining: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  placeholder: {
    width: 40,
  },
  breathingArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  breathingStats: {
    alignItems: 'center',
    marginTop: 30,
  },
  breathCountText: {
    fontSize: 18,
    color: 'white',
    marginBottom: 10,
  },
  phaseText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  vitalSignsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    marginBottom: 20,
  },
  completedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  completedTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 40,
    textAlign: 'center',
  },
  metricsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  metricCard: {
    width: (width - 80) / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    marginBottom: 15,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  metricLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  completedActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  primaryButton: {
    flex: 1,
    backgroundColor: 'white',
    paddingVertical: 15,
    borderRadius: 25,
    marginLeft: 10,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#667eea',
    textAlign: 'center',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 15,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: 'white',
    marginRight: 10,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 30,
    width: width - 60,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 15,
  },
  modalText: {
    fontSize: 16,
    color: '#718096',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  modalActions: {
    flexDirection: 'row',
    width: '100%',
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#f7fafc',
    paddingVertical: 12,
    borderRadius: 15,
    marginRight: 10,
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4a5568',
    textAlign: 'center',
  },
  modalConfirmButton: {
    flex: 1,
    backgroundColor: '#fed7d7',
    paddingVertical: 12,
    borderRadius: 15,
    marginLeft: 10,
  },
  modalConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e53e3e',
    textAlign: 'center',
  },
});

export default SessionScreen;