import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { RNCamera } from 'react-native-camera';
import CameraVitalSignsService from '../services/CameraVitalSignsService';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface VitalSignsReading {
  heartRate: number;
  hrv: number;
  spO2?: number;
  breathingRate?: number;
  confidence: number;
  timestamp: Date;
  method: 'ppg' | 'rppg';
  signalQuality: 'poor' | 'fair' | 'good' | 'excellent';
}

interface SignalQualityMetrics {
  snr: number;
  motionLevel: number;
  lightingLevel: number;
  contactQuality: number;
  overallQuality: 'poor' | 'fair' | 'good' | 'excellent';
}

interface CameraVitalSignsProps {
  visible: boolean;
  onClose: () => void;
  onVitalSigns: (reading: VitalSignsReading) => void;
  method?: 'ppg' | 'rppg';
  autoStart?: boolean;
  showInstructions?: boolean;
}

export const CameraVitalSigns: React.FC<CameraVitalSignsProps> = ({
  visible,
  onClose,
  onVitalSigns,
  method = 'ppg',
  autoStart = false,
  showInstructions = true,
}) => {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [currentReading, setCurrentReading] = useState<VitalSignsReading | null>(null);
  const [signalQuality, setSignalQuality] = useState<SignalQualityMetrics | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showTutorial, setShowTutorial] = useState(showInstructions);
  const [calibrationProgress, setCalibrationProgress] = useState(0);
  
  const cameraRef = useRef<RNCamera>(null);
  const vitalSignsService = useRef(new CameraVitalSignsService());
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const breathingAnimation = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible && autoStart && !showTutorial) {
      startMonitoring();
    }

    return () => {
      if (isMonitoring) {
        stopMonitoring();
      }
    };
  }, [visible, autoStart, showTutorial]);

  useEffect(() => {
    // Pulse animation for heart rate visualization
    if (currentReading) {
      const bpm = currentReading.heartRate;
      const duration = (60 / bpm) * 1000; // Convert BPM to milliseconds
      
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.2,
            duration: duration * 0.3,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: duration * 0.7,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [currentReading?.heartRate]);

  const startMonitoring = async () => {
    try {
      setCountdown(3);
      
      // Countdown before starting
      for (let i = 3; i > 0; i--) {
        setCountdown(i);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      setCountdown(null);
      setCalibrationProgress(0);
      
      await vitalSignsService.current.startMonitoring(
        method,
        (reading) => {
          setCurrentReading(reading);
          onVitalSigns(reading);
        },
        (quality) => {
          setSignalQuality(quality);
        },
        (error) => {
          Alert.alert('Monitoring Error', error);
          stopMonitoring();
        }
      );
      
      setIsMonitoring(true);
      
      // Simulate calibration progress
      const progressInterval = setInterval(() => {
        setCalibrationProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            return 100;
          }
          return prev + 2;
        });
      }, 100);
      
    } catch (error) {
      Alert.alert('Start Error', error.message);
    }
  };

  const stopMonitoring = async () => {
    try {
      await vitalSignsService.current.stopMonitoring();
      setIsMonitoring(false);
      setCurrentReading(null);
      setSignalQuality(null);
      setCalibrationProgress(0);
    } catch (error) {
      Alert.alert('Stop Error', error.message);
    }
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent': return '#22c55e';
      case 'good': return '#3b82f6';
      case 'fair': return '#f59e0b';
      case 'poor': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getInstructions = () => {
    if (method === 'ppg') {
      return [
        'Place your finger gently over the rear camera',
        'Cover both the camera and flash completely',
        'Keep your finger still and apply light pressure',
        'Breathe normally and stay relaxed',
        'Wait for stable readings (30-60 seconds)',
      ];
    } else {
      return [
        'Position your face in the camera view',
        'Ensure good lighting (avoid shadows)',
        'Keep your head still and look at the camera',
        'Remove any glasses or face coverings',
        'Wait for face detection and stable readings',
      ];
    }
  };

  const TutorialModal = () => (
    <Modal
      visible={showTutorial}
      animationType="slide"
      transparent={true}
    >
      <View style={styles.tutorialOverlay}>
        <View style={styles.tutorialContent}>
          <View style={styles.tutorialHeader}>
            <Text style={styles.tutorialTitle}>
              {method === 'ppg' ? 'Camera Heart Rate' : 'Face Heart Rate'}
            </Text>
            <TouchableOpacity onPress={() => setShowTutorial(false)}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.tutorialIcon}>
            <Ionicons 
              name={method === 'ppg' ? 'finger-print-outline' : 'face-outline'} 
              size={64} 
              color="#3b82f6" 
            />
          </View>
          
          <Text style={styles.tutorialDescription}>
            {method === 'ppg' 
              ? 'Use your smartphone camera and flash to measure your heart rate by placing your finger over the camera.'
              : 'Use your front camera to measure heart rate by detecting subtle color changes in your face.'
            }
          </Text>
          
          <View style={styles.instructionsList}>
            <Text style={styles.instructionsTitle}>Instructions:</Text>
            {getInstructions().map((instruction, index) => (
              <View key={index} style={styles.instructionItem}>
                <View style={styles.instructionNumber}>
                  <Text style={styles.instructionNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.instructionText}>{instruction}</Text>
              </View>
            ))}
          </View>
          
          <TouchableOpacity 
            style={styles.startButton}
            onPress={() => {
              setShowTutorial(false);
              setTimeout(startMonitoring, 500);
            }}
          >
            <Text style={styles.startButtonText}>Start Monitoring</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const SignalQualityIndicator = () => {
    if (!signalQuality) return null;

    return (
      <View style={styles.signalQuality}>
        <Text style={styles.qualityTitle}>Signal Quality</Text>
        <View style={styles.qualityMetrics}>
          <View style={styles.qualityItem}>
            <Text style={styles.qualityLabel}>Overall</Text>
            <View style={[styles.qualityIndicator, { backgroundColor: getQualityColor(signalQuality.overallQuality) }]}>
              <Text style={styles.qualityText}>{signalQuality.overallQuality.toUpperCase()}</Text>
            </View>
          </View>
          
          <View style={styles.qualityDetails}>
            <View style={styles.qualityDetail}>
              <Ionicons name="cellular" size={16} color="#6b7280" />
              <Text style={styles.qualityDetailText}>SNR: {signalQuality.snr.toFixed(1)} dB</Text>
            </View>
            
            <View style={styles.qualityDetail}>
              <Ionicons name="body-outline" size={16} color="#6b7280" />
              <Text style={styles.qualityDetailText}>Motion: {signalQuality.motionLevel.toFixed(0)}%</Text>
            </View>
            
            <View style={styles.qualityDetail}>
              <Ionicons name="sunny-outline" size={16} color="#6b7280" />
              <Text style={styles.qualityDetailText}>Light: {signalQuality.lightingLevel.toFixed(0)}%</Text>
            </View>
            
            {method === 'ppg' && (
              <View style={styles.qualityDetail}>
                <Ionicons name="finger-print-outline" size={16} color="#6b7280" />
                <Text style={styles.qualityDetailText}>Contact: {signalQuality.contactQuality.toFixed(0)}%</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  const VitalSignsDisplay = () => {
    if (!currentReading) return null;

    return (
      <View style={styles.vitalSignsDisplay}>
        <View style={styles.primaryReading}>
          <Animated.View style={[styles.heartIcon, { transform: [{ scale: pulseAnimation }] }]}>
            <Ionicons name="heart" size={32} color="#ef4444" />
          </Animated.View>
          <Text style={styles.heartRateValue}>{currentReading.heartRate}</Text>
          <Text style={styles.heartRateUnit}>BPM</Text>
        </View>
        
        <View style={styles.secondaryReadings}>
          <View style={styles.readingItem}>
            <Ionicons name="pulse" size={20} color="#22c55e" />
            <Text style={styles.readingLabel}>HRV</Text>
            <Text style={styles.readingValue}>{currentReading.hrv} ms</Text>
          </View>
          
          {currentReading.spO2 && (
            <View style={styles.readingItem}>
              <Ionicons name="water" size={20} color="#3b82f6" />
              <Text style={styles.readingLabel}>SpO2</Text>
              <Text style={styles.readingValue}>{currentReading.spO2}%</Text>
            </View>
          )}
          
          {currentReading.breathingRate && (
            <View style={styles.readingItem}>
              <Ionicons name="leaf" size={20} color="#8b5cf6" />
              <Text style={styles.readingLabel}>Breathing</Text>
              <Text style={styles.readingValue}>{currentReading.breathingRate} BPM</Text>
            </View>
          )}
          
          <View style={styles.readingItem}>
            <Ionicons name="checkmark-circle" size={20} color="#f59e0b" />
            <Text style={styles.readingLabel}>Confidence</Text>
            <Text style={styles.readingValue}>{currentReading.confidence}%</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <TutorialModal />
        
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="chevron-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.title}>
            {method === 'ppg' ? 'Camera Heart Rate' : 'Face Heart Rate'}
          </Text>
          <TouchableOpacity onPress={() => setShowTutorial(true)} style={styles.helpButton}>
            <Ionicons name="help-circle-outline" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>

        <View style={styles.cameraContainer}>
          <RNCamera
            ref={cameraRef}
            style={styles.camera}
            type={method === 'ppg' ? RNCamera.Constants.Type.back : RNCamera.Constants.Type.front}
            flashMode={method === 'ppg' ? RNCamera.Constants.FlashMode.torch : RNCamera.Constants.FlashMode.off}
            captureAudio={false}
            autoFocus={method === 'rppg' ? RNCamera.Constants.AutoFocus.on : RNCamera.Constants.AutoFocus.off}
          />
          
          {method === 'ppg' && (
            <View style={styles.fingerGuide}>
              <View style={styles.fingerIndicator}>
                <Ionicons name="finger-print" size={64} color="#ffffff" />
                <Text style={styles.fingerText}>Place finger here</Text>
              </View>
            </View>
          )}
          
          {method === 'rppg' && (
            <View style={styles.faceGuide}>
              <View style={styles.faceFrame} />
              <Text style={styles.faceText}>Position your face in the frame</Text>
            </View>
          )}
          
          {countdown && (
            <View style={styles.countdownOverlay}>
              <Text style={styles.countdownText}>{countdown}</Text>
              <Text style={styles.countdownLabel}>Starting in...</Text>
            </View>
          )}
        </View>

        {calibrationProgress > 0 && calibrationProgress < 100 && (
          <View style={styles.calibrationContainer}>
            <Text style={styles.calibrationText}>Calibrating... {calibrationProgress}%</Text>
            <View style={styles.calibrationBar}>
              <View 
                style={[styles.calibrationProgress, { width: `${calibrationProgress}%` }]}
              />
            </View>
          </View>
        )}

        <VitalSignsDisplay />
        <SignalQualityIndicator />

        <View style={styles.controls}>
          {!isMonitoring ? (
            <TouchableOpacity style={styles.startMonitoringButton} onPress={startMonitoring}>
              <Ionicons name="play" size={24} color="#ffffff" />
              <Text style={styles.controlButtonText}>Start Monitoring</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.stopMonitoringButton} onPress={stopMonitoring}>
              <Ionicons name="stop" size={24} color="#ffffff" />
              <Text style={styles.controlButtonText}>Stop Monitoring</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  helpButton: {
    padding: 8,
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  fingerGuide: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -50 }, { translateY: -50 }],
    alignItems: 'center',
  },
  fingerIndicator: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    padding: 20,
  },
  fingerText: {
    color: '#ffffff',
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center',
  },
  faceGuide: {
    position: 'absolute',
    top: '30%',
    left: '50%',
    transform: [{ translateX: -100 }],
    alignItems: 'center',
  },
  faceFrame: {
    width: 200,
    height: 250,
    borderWidth: 3,
    borderColor: '#ffffff',
    borderRadius: 100,
    backgroundColor: 'transparent',
  },
  faceText: {
    color: '#ffffff',
    fontSize: 16,
    marginTop: 20,
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  countdownOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownText: {
    fontSize: 72,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  countdownLabel: {
    fontSize: 18,
    color: '#ffffff',
    marginTop: 12,
  },
  calibrationContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  calibrationText: {
    color: '#ffffff',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
  calibrationBar: {
    height: 4,
    backgroundColor: '#374151',
    borderRadius: 2,
    overflow: 'hidden',
  },
  calibrationProgress: {
    height: '100%',
    backgroundColor: '#3b82f6',
  },
  vitalSignsDisplay: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  primaryReading: {
    alignItems: 'center',
    marginBottom: 16,
  },
  heartIcon: {
    marginBottom: 8,
  },
  heartRateValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ef4444',
  },
  heartRateUnit: {
    fontSize: 16,
    color: '#9ca3af',
  },
  secondaryReadings: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  readingItem: {
    alignItems: 'center',
    flex: 1,
  },
  readingLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
    marginBottom: 2,
  },
  readingValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  signalQuality: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  qualityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  qualityMetrics: {
    alignItems: 'center',
  },
  qualityItem: {
    alignItems: 'center',
    marginBottom: 8,
  },
  qualityLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 4,
  },
  qualityIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  qualityText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  qualityDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  qualityDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
    marginVertical: 2,
  },
  qualityDetailText: {
    fontSize: 10,
    color: '#9ca3af',
    marginLeft: 4,
  },
  controls: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 30,
  },
  startMonitoringButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#22c55e',
    paddingVertical: 16,
    borderRadius: 12,
  },
  stopMonitoringButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ef4444',
    paddingVertical: 16,
    borderRadius: 12,
  },
  controlButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },

  // Tutorial Modal Styles
  tutorialOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tutorialContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
  },
  tutorialHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tutorialTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  tutorialIcon: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  tutorialDescription: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 24,
    marginBottom: 24,
  },
  instructionsList: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  instructionNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  instructionNumberText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  startButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});