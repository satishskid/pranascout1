/**
 * Vital signs and health monitoring types
 */

export interface VitalSigns {
  heartRate: HeartRateData[];
  heartRateVariability: HRVData[];
  oxygenSaturation: SpO2Data[];
  breathing: BreathingData[];
  stressLevel: StressData[];
}

export interface HeartRateData {
  timestamp: Date;
  bpm: number;
  confidence: number; // 0-1
  source: 'camera_ppg' | 'camera_rppg' | 'manual';
  quality?: number; // 0-1
  signalStrength?: number;
}

export interface HRVData {
  timestamp: Date;
  rmssd: number; // ms
  sdnn: number; // ms
  pnn50: number; // percentage
  confidence: number; // 0-1
  source: string;
}

export interface SpO2Data {
  timestamp: Date;
  value: number; // percentage
  confidence: number; // 0-1
  source: 'camera_analysis' | 'manual';
  pulseStrength?: number;
}

export interface BreathingData {
  timestamp: Date;
  breathsPerMinute: number;
  breathPattern: 'regular' | 'irregular' | 'shallow' | 'deep';
  inhaleDuration?: number; // seconds
  exhaleDuration?: number; // seconds
  holdDuration?: number; // seconds
  amplitude?: number; // breathing depth
  confidence: number; // 0-1
  source: 'audio_analysis' | 'camera_motion' | 'manual';
}

export interface StressData {
  timestamp: Date;
  value: number; // 0-100 scale
  factors: {
    hrv: number;
    heartRate: number;
    breathing: number;
    movement?: number;
  };
  recommendation?: string;
}

export interface VitalSignsSession {
  sessionId: string;
  startTime: Date;
  endTime?: Date;
  vitalSigns: VitalSigns;
  dataQuality: DataQuality;
  analytics: SessionAnalytics;
}

export interface DataQuality {
  overallScore: number; // 0-1
  signalToNoiseRatio?: number;
  dataCompleteness: number; // percentage
  artifactsDetected: number;
  confidenceIntervals: {
    heartRate: number;
    hrv: number;
    spo2: number;
    breathing: number;
  };
  qualityFlags: string[];
  usableForAnalysis: boolean;
}

export interface SessionAnalytics {
  stressIndicators: {
    hrvStressScore: number;
    breathingIrregularity: number;
    heartRateElevation: number;
    overallStress: number; // 0-100
  };
  coherence: {
    heartBrainCoherence: number;
    breathingHeartSync: number;
    coherenceRatio: number;
  };
  trends: {
    heartRateTrend: string;
    hrvTrend: string;
    breathingTrend: string;
    improvementIndicators: string[];
  };
}

export interface CameraConfig {
  rearCamera: boolean;
  frontCamera: boolean;
  flashEnabled: boolean;
  resolution: string;
  frameRate: number;
  autoFocus: boolean;
}

export interface ProcessingConfig {
  algorithm: string;
  filterType: 'lowpass' | 'highpass' | 'bandpass';
  samplingRate: number;
  windowSize: number;
  noiseReduction: boolean;
  realTimeProcessing: boolean;
}

// PPG/rPPG specific types
export interface PPGSignal {
  timestamps: number[];
  redChannel: number[];
  greenChannel: number[];
  blueChannel: number[];
  quality: number;
  fps: number;
}

export interface rPPGSignal {
  timestamps: number[];
  faceRegion: FaceRegion;
  roiSignal: number[];
  quality: number;
  fps: number;
}

export interface FaceRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
}

// Breathing analysis types
export interface AudioBreathingSignal {
  timestamps: number[];
  amplitude: number[];
  frequency: number[];
  sampleRate: number;
  quality: number;
  nostrilDominance?: 'left' | 'right' | 'both';
}

export interface BreathingPattern {
  technique: string;
  pattern: {
    inhale: number;
    holdAfterInhale: number;
    exhale: number;
    holdAfterExhale: number;
  };
  cycles: number;
  consistency: number; // 0-1
  accuracy: number; // 0-1
}

// Motion and activity types
export interface MotionData {
  accelerometer: {
    x: number;
    y: number;
    z: number;
    magnitude: number;
    timestamp: Date;
  }[];
  gyroscope: {
    x: number;
    y: number;
    z: number;
    timestamp: Date;
  }[];
  activity: {
    stepCount: number;
    movementIntensity: 'sedentary' | 'light' | 'moderate' | 'vigorous';
    posture: 'sitting' | 'standing' | 'walking' | 'lying';
    stability: number; // 0-1
  };
}

// Error and validation types
export interface VitalSignsError {
  type: 'sensor_error' | 'processing_error' | 'validation_error' | 'network_error';
  message: string;
  code: string;
  timestamp: Date;
  context?: any;
}