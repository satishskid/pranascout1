/**
 * Vital Signs Context Provider
 * Manages real-time vital signs monitoring and data processing
 */

import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { 
  VitalSigns, 
  HeartRateData, 
  HRVData, 
  BreathingData, 
  StressData,
  DataQuality,
  SessionAnalytics,
  RealTimeMetrics,
  VitalSignsError,
  CameraConfig,
  ProcessingConfig
} from '../types/vitalSigns';
import { VitalSignsService } from '../services/VitalSignsService';
import { CameraService } from '../services/CameraService';
import { AudioService } from '../services/AudioService';

interface VitalSignsContextType {
  // Current vital signs data
  currentVitalSigns: VitalSigns;
  realTimeMetrics: RealTimeMetrics;
  dataQuality: DataQuality;
  analytics: SessionAnalytics;
  
  // Monitoring state
  isMonitoring: boolean;
  monitoringMethods: MonitoringMethod[];
  errors: VitalSignsError[];
  
  // Configuration
  cameraConfig: CameraConfig;
  processingConfig: ProcessingConfig;
  
  // Control methods
  startMonitoring: (methods: MonitoringMethod[]) => Promise<void>;
  stopMonitoring: () => Promise<void>;
  calibrateBaseline: () => Promise<void>;
  updateConfiguration: (config: Partial<ProcessingConfig>) => void;
  clearErrors: () => void;
  
  // Data access
  getSessionData: (sessionId: string) => VitalSigns | null;
  exportData: (timeRange: number) => Promise<any>;
}

export type MonitoringMethod = 'camera_ppg' | 'camera_rppg' | 'audio_breathing' | 'motion_sensors';

const VitalSignsContext = createContext<VitalSignsContextType | undefined>(undefined);

interface VitalSignsProviderProps {
  children: ReactNode;
}

export const VitalSignsProvider: React.FC<VitalSignsProviderProps> = ({ children }) => {
  // State management
  const [currentVitalSigns, setCurrentVitalSigns] = useState<VitalSigns>({
    heartRate: [],
    heartRateVariability: [],
    oxygenSaturation: [],
    breathing: [],
    stressLevel: [],
  });

  const [realTimeMetrics, setRealTimeMetrics] = useState<RealTimeMetrics>({});
  
  const [dataQuality, setDataQuality] = useState<DataQuality>({
    overallScore: 0,
    dataCompleteness: 0,
    artifactsDetected: 0,
    confidenceIntervals: {
      heartRate: 0,
      hrv: 0,
      spo2: 0,
      breathing: 0,
    },
    qualityFlags: [],
    usableForAnalysis: false,
  });

  const [analytics, setAnalytics] = useState<SessionAnalytics>({
    stressIndicators: {
      hrvStressScore: 0,
      breathingIrregularity: 0,
      heartRateElevation: 0,
      overallStress: 0,
    },
    coherence: {
      heartBrainCoherence: 0,
      breathingHeartSync: 0,
      coherenceRatio: 0,
    },
    trends: {
      heartRateTrend: 'stable',
      hrvTrend: 'stable',
      breathingTrend: 'stable',
      improvementIndicators: [],
    },
  });

  const [isMonitoring, setIsMonitoring] = useState<boolean>(false);
  const [monitoringMethods, setMonitoringMethods] = useState<MonitoringMethod[]>([]);
  const [errors, setErrors] = useState<VitalSignsError[]>([]);

  const [cameraConfig, setCameraConfig] = useState<CameraConfig>({
    rearCamera: true,
    frontCamera: false,
    flashEnabled: true,
    resolution: '1920x1080',
    frameRate: 30,
    autoFocus: true,
  });

  const [processingConfig, setProcessingConfig] = useState<ProcessingConfig>({
    algorithm: 'adaptive_filter',
    filterType: 'bandpass',
    samplingRate: 30,
    windowSize: 10,
    noiseReduction: true,
    realTimeProcessing: true,
  });

  // Refs for cleanup
  const monitoringInterval = useRef<NodeJS.Timeout | null>(null);
  const dataProcessingRef = useRef<boolean>(false);

  useEffect(() => {
    // Initialize vital signs service
    VitalSignsService.initialize();
    
    return () => {
      // Cleanup on unmount
      if (isMonitoring) {
        stopMonitoring();
      }
    };
  }, []);

  useEffect(() => {
    if (isMonitoring) {
      // Start real-time processing
      startRealTimeProcessing();
    } else {
      // Stop real-time processing
      stopRealTimeProcessing();
    }
  }, [isMonitoring, monitoringMethods]);

  const startMonitoring = async (methods: MonitoringMethod[]) => {
    try {
      setErrors([]);
      setMonitoringMethods(methods);

      // Initialize monitoring services based on selected methods
      const initPromises = methods.map(async (method) => {
        switch (method) {
          case 'camera_ppg':
          case 'camera_rppg':
            return await CameraService.startMonitoring(cameraConfig);
          case 'audio_breathing':
            return await AudioService.startBreathingAnalysis();
          case 'motion_sensors':
            return await VitalSignsService.startMotionMonitoring();
          default:
            throw new Error(`Unknown monitoring method: ${method}`);
        }
      });

      await Promise.all(initPromises);
      setIsMonitoring(true);

      // Start data collection
      await VitalSignsService.startDataCollection(methods);

    } catch (error) {
      console.error('Failed to start vital signs monitoring:', error);
      addError({
        type: 'sensor_error',
        message: 'Failed to start monitoring',
        code: 'MONITORING_START_FAILED',
        timestamp: new Date(),
        context: { methods, error: error.message },
      });
      throw error;
    }
  };

  const stopMonitoring = async () => {
    try {
      setIsMonitoring(false);
      
      // Stop all monitoring services
      await Promise.all([
        CameraService.stopMonitoring(),
        AudioService.stopBreathingAnalysis(),
        VitalSignsService.stopMotionMonitoring(),
        VitalSignsService.stopDataCollection(),
      ]);

      setMonitoringMethods([]);
      
    } catch (error) {
      console.error('Failed to stop vital signs monitoring:', error);
      addError({
        type: 'sensor_error',
        message: 'Failed to stop monitoring',
        code: 'MONITORING_STOP_FAILED',
        timestamp: new Date(),
        context: { error: error.message },
      });
    }
  };

  const startRealTimeProcessing = () => {
    if (dataProcessingRef.current) return;
    
    dataProcessingRef.current = true;
    monitoringInterval.current = setInterval(async () => {
      try {
        // Collect latest data from all active monitoring methods
        const latestData = await VitalSignsService.collectLatestData(monitoringMethods);
        
        // Process and update vital signs
        if (latestData) {
          updateVitalSigns(latestData);
          updateRealTimeMetrics(latestData);
          updateDataQuality(latestData);
          updateAnalytics(latestData);
        }
        
      } catch (error) {
        console.error('Real-time processing error:', error);
        addError({
          type: 'processing_error',
          message: 'Real-time processing failed',
          code: 'PROCESSING_ERROR',
          timestamp: new Date(),
          context: { error: error.message },
        });
      }
    }, 1000); // Update every second
  };

  const stopRealTimeProcessing = () => {
    dataProcessingRef.current = false;
    if (monitoringInterval.current) {
      clearInterval(monitoringInterval.current);
      monitoringInterval.current = null;
    }
  };

  const updateVitalSigns = (data: any) => {
    setCurrentVitalSigns(prev => {
      const updated = { ...prev };
      
      // Add new heart rate data
      if (data.heartRate) {
        updated.heartRate = [...prev.heartRate, data.heartRate].slice(-100); // Keep last 100 readings
      }
      
      // Add new HRV data
      if (data.hrv) {
        updated.heartRateVariability = [...prev.heartRateVariability, data.hrv].slice(-100);
      }
      
      // Add new breathing data
      if (data.breathing) {
        updated.breathing = [...prev.breathing, data.breathing].slice(-100);
      }
      
      // Add new stress data
      if (data.stress) {
        updated.stressLevel = [...prev.stressLevel, data.stress].slice(-100);
      }
      
      return updated;
    });
  };

  const updateRealTimeMetrics = (data: any) => {
    setRealTimeMetrics(prev => ({
      ...prev,
      currentHeartRate: data.heartRate?.bpm,
      currentHRV: data.hrv?.rmssd,
      currentStressLevel: data.stress?.value,
      currentBreathingRate: data.breathing?.breathsPerMinute,
      coherenceScore: calculateCoherence(data),
      sessionQuality: calculateSessionQuality(data),
    }));
  };

  const updateDataQuality = (data: any) => {
    const qualityScore = VitalSignsService.calculateDataQuality(data);
    setDataQuality(prev => ({
      ...prev,
      overallScore: qualityScore.overall,
      confidenceIntervals: qualityScore.confidence,
      qualityFlags: qualityScore.flags,
      usableForAnalysis: qualityScore.overall > 0.7,
    }));
  };

  const updateAnalytics = (data: any) => {
    const analyticsData = VitalSignsService.calculateAnalytics(currentVitalSigns);
    setAnalytics(analyticsData);
  };

  const calculateCoherence = (data: any): number => {
    // Implement heart-brain coherence calculation
    // This would analyze the synchronization between heart rate and breathing
    return 0.5; // Placeholder
  };

  const calculateSessionQuality = (data: any): number => {
    // Calculate overall session quality based on data quality and consistency
    return dataQuality.overallScore * 0.7 + (data.consistency || 0.5) * 0.3;
  };

  const calibrateBaseline = async () => {
    try {
      await VitalSignsService.calibrateBaseline(currentVitalSigns);
    } catch (error) {
      console.error('Baseline calibration failed:', error);
      addError({
        type: 'processing_error',
        message: 'Baseline calibration failed',
        code: 'CALIBRATION_FAILED',
        timestamp: new Date(),
        context: { error: error.message },
      });
      throw error;
    }
  };

  const updateConfiguration = (config: Partial<ProcessingConfig>) => {
    setProcessingConfig(prev => ({ ...prev, ...config }));
    VitalSignsService.updateProcessingConfig(config);
  };

  const addError = (error: VitalSignsError) => {
    setErrors(prev => [...prev, error].slice(-10)); // Keep last 10 errors
  };

  const clearErrors = () => {
    setErrors([]);
  };

  const getSessionData = (sessionId: string): VitalSigns | null => {
    // Implementation would retrieve specific session data
    return null; // Placeholder
  };

  const exportData = async (timeRange: number): Promise<any> => {
    try {
      return await VitalSignsService.exportData(timeRange);
    } catch (error) {
      console.error('Data export failed:', error);
      throw error;
    }
  };

  const value: VitalSignsContextType = {
    currentVitalSigns,
    realTimeMetrics,
    dataQuality,
    analytics,
    isMonitoring,
    monitoringMethods,
    errors,
    cameraConfig,
    processingConfig,
    startMonitoring,
    stopMonitoring,
    calibrateBaseline,
    updateConfiguration,
    clearErrors,
    getSessionData,
    exportData,
  };

  return (
    <VitalSignsContext.Provider value={value}>
      {children}
    </VitalSignsContext.Provider>
  );
};

export const useVitalSigns = (): VitalSignsContextType => {
  const context = useContext(VitalSignsContext);
  if (context === undefined) {
    throw new Error('useVitalSigns must be used within a VitalSignsProvider');
  }
  return context;
};