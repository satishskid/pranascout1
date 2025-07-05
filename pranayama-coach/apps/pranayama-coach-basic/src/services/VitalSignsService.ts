/**
 * Vital Signs Service
 * Handles camera-based PPG/rPPG, breathing analysis, and health monitoring
 */

import { 
  VitalSigns, 
  HeartRateData, 
  HRVData, 
  BreathingData, 
  StressData,
  PPGSignal,
  rPPGSignal,
  AudioBreathingSignal,
  MotionData,
  DataQuality,
  SessionAnalytics,
  CameraConfig,
  ProcessingConfig,
  VitalSignsError
} from '../types/vitalSigns';
import { MonitoringMethod } from '../context/VitalSignsContext';
import { CameraService } from './CameraService';
import { AudioService } from './AudioService';
import { TensorFlowService } from './TensorFlowService';
import { MotionService } from './MotionService';

export class VitalSignsService {
  private static isInitialized = false;
  private static activeMonitoring: MonitoringMethod[] = [];
  private static processingConfig: ProcessingConfig = {
    algorithm: 'adaptive_filter',
    filterType: 'bandpass',
    samplingRate: 30,
    windowSize: 10,
    noiseReduction: true,
    realTimeProcessing: true,
  };

  private static dataBuffer: {
    heartRate: HeartRateData[];
    hrv: HRVData[];
    breathing: BreathingData[];
    stress: StressData[];
  } = {
    heartRate: [],
    hrv: [],
    breathing: [],
    stress: [],
  };

  /**
   * Initialize the vital signs service
   */
  static async initialize(): Promise<void> {
    try {
      if (this.isInitialized) return;

      // Initialize TensorFlow for ML processing
      await TensorFlowService.initialize();
      
      // Initialize motion sensors
      await MotionService.initialize();
      
      this.isInitialized = true;
      console.log('VitalSignsService initialized successfully');
    } catch (error) {
      console.error('Failed to initialize VitalSignsService:', error);
      throw error;
    }
  }

  /**
   * Start data collection using specified methods
   */
  static async startDataCollection(methods: MonitoringMethod[]): Promise<void> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      this.activeMonitoring = methods;
      
      // Clear previous data
      this.clearDataBuffer();

      console.log('Started vital signs data collection:', methods);
    } catch (error) {
      console.error('Failed to start data collection:', error);
      throw error;
    }
  }

  /**
   * Stop data collection
   */
  static async stopDataCollection(): Promise<void> {
    try {
      this.activeMonitoring = [];
      console.log('Stopped vital signs data collection');
    } catch (error) {
      console.error('Failed to stop data collection:', error);
      throw error;
    }
  }

  /**
   * Start motion sensor monitoring
   */
  static async startMotionMonitoring(): Promise<void> {
    try {
      await MotionService.startMonitoring();
    } catch (error) {
      console.error('Failed to start motion monitoring:', error);
      throw error;
    }
  }

  /**
   * Stop motion sensor monitoring
   */
  static async stopMotionMonitoring(): Promise<void> {
    try {
      await MotionService.stopMonitoring();
    } catch (error) {
      console.error('Failed to stop motion monitoring:', error);
      throw error;
    }
  }

  /**
   * Collect latest data from active monitoring methods
   */
  static async collectLatestData(methods: MonitoringMethod[]): Promise<any> {
    try {
      const collectedData: any = {};

      for (const method of methods) {
        switch (method) {
          case 'camera_ppg':
            collectedData.heartRate = await this.processCameraPPG();
            break;
          case 'camera_rppg':
            collectedData.heartRate = await this.processCamerarPPG();
            break;
          case 'audio_breathing':
            collectedData.breathing = await this.processAudioBreathing();
            break;
          case 'motion_sensors':
            collectedData.motion = await this.processMotionData();
            break;
        }
      }

      // Calculate derived metrics
      if (collectedData.heartRate) {
        collectedData.hrv = await this.calculateHRV(collectedData.heartRate);
        collectedData.stress = await this.calculateStress(collectedData);
      }

      // Store in buffer
      this.updateDataBuffer(collectedData);

      return collectedData;
    } catch (error) {
      console.error('Failed to collect latest data:', error);
      throw error;
    }
  }

  /**
   * Process camera PPG signal for heart rate
   */
  private static async processCameraPPG(): Promise<HeartRateData | null> {
    try {
      const ppgSignal = await CameraService.getPPGSignal();
      if (!ppgSignal || ppgSignal.quality < 0.5) {
        return null;
      }

      // Apply filtering
      const filteredSignal = this.applyBandpassFilter(
        ppgSignal.greenChannel, 
        ppgSignal.fps,
        0.7, // Low cutoff (42 BPM)
        3.5  // High cutoff (210 BPM)
      );

      // Detect peaks
      const peaks = this.detectPeaks(filteredSignal, ppgSignal.fps);
      if (peaks.length < 2) {
        return null;
      }

      // Calculate heart rate
      const intervals = this.calculateRRIntervals(peaks, ppgSignal.fps);
      const heartRate = this.calculateHeartRateFromRR(intervals);

      return {
        timestamp: new Date(),
        bpm: heartRate,
        confidence: ppgSignal.quality,
        source: 'camera_ppg',
        quality: ppgSignal.quality,
        signalStrength: this.calculateSignalStrength(filteredSignal),
      };
    } catch (error) {
      console.error('Camera PPG processing failed:', error);
      return null;
    }
  }

  /**
   * Process camera rPPG signal for heart rate (remote PPG)
   */
  private static async processCamerarPPG(): Promise<HeartRateData | null> {
    try {
      const rppgSignal = await CameraService.getrPPGSignal();
      if (!rppgSignal || rppgSignal.quality < 0.4) {
        return null;
      }

      // Use TensorFlow model for rPPG processing
      const heartRate = await TensorFlowService.processrPPG(rppgSignal);
      if (!heartRate) {
        return null;
      }

      return {
        timestamp: new Date(),
        bpm: heartRate.bpm,
        confidence: heartRate.confidence,
        source: 'camera_rppg',
        quality: rppgSignal.quality,
      };
    } catch (error) {
      console.error('Camera rPPG processing failed:', error);
      return null;
    }
  }

  /**
   * Process audio breathing signal
   */
  private static async processAudioBreathing(): Promise<BreathingData | null> {
    try {
      const audioSignal = await AudioService.getBreathingSignal();
      if (!audioSignal || audioSignal.quality < 0.5) {
        return null;
      }

      // Use TensorFlow model for breathing analysis
      const breathingAnalysis = await TensorFlowService.processBreathing(audioSignal);
      if (!breathingAnalysis) {
        return null;
      }

      return {
        timestamp: new Date(),
        breathsPerMinute: breathingAnalysis.rate,
        breathPattern: breathingAnalysis.pattern,
        inhaleDuration: breathingAnalysis.inhaleDuration,
        exhaleDuration: breathingAnalysis.exhaleDuration,
        confidence: breathingAnalysis.confidence,
        source: 'audio_analysis',
      };
    } catch (error) {
      console.error('Audio breathing processing failed:', error);
      return null;
    }
  }

  /**
   * Process motion sensor data
   */
  private static async processMotionData(): Promise<MotionData | null> {
    try {
      return await MotionService.getLatestData();
    } catch (error) {
      console.error('Motion data processing failed:', error);
      return null;
    }
  }

  /**
   * Calculate Heart Rate Variability from heart rate data
   */
  private static async calculateHRV(heartRateData: HeartRateData): Promise<HRVData | null> {
    try {
      // Need at least 5 minutes of data for reliable HRV
      const recentHR = this.dataBuffer.heartRate.slice(-150); // Last 5 minutes at 30 FPS
      if (recentHR.length < 50) {
        return null;
      }

      // Extract R-R intervals
      const rrIntervals: number[] = [];
      for (let i = 1; i < recentHR.length; i++) {
        const interval = 60000 / recentHR[i].bpm; // Convert BPM to ms
        rrIntervals.push(interval);
      }

      // Calculate RMSSD
      const rmssd = this.calculateRMSSD(rrIntervals);
      
      // Calculate SDNN
      const sdnn = this.calculateSDNN(rrIntervals);
      
      // Calculate pNN50
      const pnn50 = this.calculatepNN50(rrIntervals);

      return {
        timestamp: new Date(),
        rmssd,
        sdnn,
        pnn50,
        confidence: heartRateData.confidence,
        source: heartRateData.source,
      };
    } catch (error) {
      console.error('HRV calculation failed:', error);
      return null;
    }
  }

  /**
   * Calculate stress level from multiple metrics
   */
  private static async calculateStress(data: any): Promise<StressData | null> {
    try {
      let stressScore = 0;
      let factorCount = 0;
      const factors: any = {};

      // Heart rate factor (30% weight)
      if (data.heartRate) {
        const baselineHR = 70; // Would come from user profile
        const hrDeviation = Math.abs(data.heartRate.bpm - baselineHR) / baselineHR;
        factors.heartRate = Math.min(hrDeviation * 100, 100);
        stressScore += factors.heartRate * 0.3;
        factorCount += 0.3;
      }

      // HRV factor (40% weight)
      if (data.hrv) {
        const baselineRMSSD = 40; // Would come from user profile
        const hrvDeviation = Math.max(0, (baselineRMSSD - data.hrv.rmssd) / baselineRMSSD);
        factors.hrv = hrvDeviation * 100;
        stressScore += factors.hrv * 0.4;
        factorCount += 0.4;
      }

      // Breathing factor (30% weight)
      if (data.breathing) {
        const normalBreathingRate = 16;
        const brDeviation = Math.abs(data.breathing.breathsPerMinute - normalBreathingRate) / normalBreathingRate;
        factors.breathing = Math.min(brDeviation * 100, 100);
        stressScore += factors.breathing * 0.3;
        factorCount += 0.3;
      }

      if (factorCount === 0) {
        return null;
      }

      const finalStressLevel = Math.round(stressScore / factorCount);

      return {
        timestamp: new Date(),
        value: finalStressLevel,
        factors,
        recommendation: this.getStressRecommendation(finalStressLevel),
      };
    } catch (error) {
      console.error('Stress calculation failed:', error);
      return null;
    }
  }

  /**
   * Get stress level recommendation
   */
  private static getStressRecommendation(stressLevel: number): string {
    if (stressLevel < 20) {
      return 'You appear relaxed. Great time for meditation!';
    } else if (stressLevel < 40) {
      return 'Mild stress detected. Try some deep breathing exercises.';
    } else if (stressLevel < 60) {
      return 'Moderate stress. Consider a longer breathing session.';
    } else if (stressLevel < 80) {
      return 'High stress detected. Take a break and focus on relaxation.';
    } else {
      return 'Very high stress. Please prioritize relaxation and consider seeking support.';
    }
  }

  /**
   * Calculate data quality metrics
   */
  static calculateDataQuality(data: any): any {
    const quality = {
      overall: 0,
      confidence: {
        heartRate: 0,
        hrv: 0,
        spo2: 0,
        breathing: 0,
      },
      flags: [] as string[],
    };

    let totalWeight = 0;
    let weightedScore = 0;

    // Heart rate quality
    if (data.heartRate) {
      const hrQuality = data.heartRate.confidence || 0;
      quality.confidence.heartRate = hrQuality;
      weightedScore += hrQuality * 0.3;
      totalWeight += 0.3;

      if (hrQuality < 0.5) {
        quality.flags.push('low_hr_confidence');
      }
    }

    // HRV quality
    if (data.hrv) {
      const hrvQuality = data.hrv.confidence || 0;
      quality.confidence.hrv = hrvQuality;
      weightedScore += hrvQuality * 0.3;
      totalWeight += 0.3;
    }

    // Breathing quality
    if (data.breathing) {
      const breathingQuality = data.breathing.confidence || 0;
      quality.confidence.breathing = breathingQuality;
      weightedScore += breathingQuality * 0.4;
      totalWeight += 0.4;

      if (breathingQuality < 0.5) {
        quality.flags.push('low_breathing_confidence');
      }
    }

    quality.overall = totalWeight > 0 ? weightedScore / totalWeight : 0;

    return quality;
  }

  /**
   * Calculate analytics from vital signs data
   */
  static calculateAnalytics(vitalSigns: VitalSigns): SessionAnalytics {
    // Implementation would analyze trends and patterns
    return {
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
    };
  }

  /**
   * Calibrate baseline measurements
   */
  static async calibrateBaseline(vitalSigns: VitalSigns): Promise<void> {
    // Implementation would calculate user baseline from historical data
    console.log('Calibrating baseline measurements...');
  }

  /**
   * Update processing configuration
   */
  static updateProcessingConfig(config: Partial<ProcessingConfig>): void {
    this.processingConfig = { ...this.processingConfig, ...config };
  }

  /**
   * Export vital signs data
   */
  static async exportData(timeRange: number): Promise<any> {
    // Implementation would export data in various formats
    return {
      data: this.dataBuffer,
      timeRange,
      exportedAt: new Date(),
    };
  }

  // Helper methods for signal processing

  private static applyBandpassFilter(signal: number[], sampleRate: number, lowCutoff: number, highCutoff: number): number[] {
    // Simplified bandpass filter implementation
    // In production, would use a proper DSP library
    return signal; // Placeholder
  }

  private static detectPeaks(signal: number[], sampleRate: number): number[] {
    const peaks: number[] = [];
    const threshold = this.calculateAdaptiveThreshold(signal);
    
    for (let i = 1; i < signal.length - 1; i++) {
      if (signal[i] > signal[i - 1] && signal[i] > signal[i + 1] && signal[i] > threshold) {
        peaks.push(i);
      }
    }
    
    return peaks;
  }

  private static calculateAdaptiveThreshold(signal: number[]): number {
    const mean = signal.reduce((sum, val) => sum + val, 0) / signal.length;
    const variance = signal.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / signal.length;
    const stdDev = Math.sqrt(variance);
    return mean + 0.5 * stdDev;
  }

  private static calculateRRIntervals(peaks: number[], sampleRate: number): number[] {
    const intervals: number[] = [];
    for (let i = 1; i < peaks.length; i++) {
      const interval = ((peaks[i] - peaks[i - 1]) / sampleRate) * 1000; // Convert to ms
      intervals.push(interval);
    }
    return intervals;
  }

  private static calculateHeartRateFromRR(rrIntervals: number[]): number {
    if (rrIntervals.length === 0) return 0;
    const avgInterval = rrIntervals.reduce((sum, interval) => sum + interval, 0) / rrIntervals.length;
    return Math.round(60000 / avgInterval); // Convert ms to BPM
  }

  private static calculateSignalStrength(signal: number[]): number {
    const max = Math.max(...signal);
    const min = Math.min(...signal);
    return (max - min) / max; // Signal amplitude ratio
  }

  private static calculateRMSSD(rrIntervals: number[]): number {
    if (rrIntervals.length < 2) return 0;
    
    let sumSquares = 0;
    for (let i = 1; i < rrIntervals.length; i++) {
      const diff = rrIntervals[i] - rrIntervals[i - 1];
      sumSquares += diff * diff;
    }
    
    return Math.sqrt(sumSquares / (rrIntervals.length - 1));
  }

  private static calculateSDNN(rrIntervals: number[]): number {
    if (rrIntervals.length === 0) return 0;
    
    const mean = rrIntervals.reduce((sum, interval) => sum + interval, 0) / rrIntervals.length;
    const variance = rrIntervals.reduce((sum, interval) => sum + Math.pow(interval - mean, 2), 0) / rrIntervals.length;
    
    return Math.sqrt(variance);
  }

  private static calculatepNN50(rrIntervals: number[]): number {
    if (rrIntervals.length < 2) return 0;
    
    let nn50Count = 0;
    for (let i = 1; i < rrIntervals.length; i++) {
      if (Math.abs(rrIntervals[i] - rrIntervals[i - 1]) > 50) {
        nn50Count++;
      }
    }
    
    return (nn50Count / (rrIntervals.length - 1)) * 100;
  }

  private static updateDataBuffer(data: any): void {
    const maxBufferSize = 1000; // Keep last 1000 readings
    
    if (data.heartRate) {
      this.dataBuffer.heartRate.push(data.heartRate);
      if (this.dataBuffer.heartRate.length > maxBufferSize) {
        this.dataBuffer.heartRate = this.dataBuffer.heartRate.slice(-maxBufferSize);
      }
    }
    
    if (data.hrv) {
      this.dataBuffer.hrv.push(data.hrv);
      if (this.dataBuffer.hrv.length > maxBufferSize) {
        this.dataBuffer.hrv = this.dataBuffer.hrv.slice(-maxBufferSize);
      }
    }
    
    if (data.breathing) {
      this.dataBuffer.breathing.push(data.breathing);
      if (this.dataBuffer.breathing.length > maxBufferSize) {
        this.dataBuffer.breathing = this.dataBuffer.breathing.slice(-maxBufferSize);
      }
    }
    
    if (data.stress) {
      this.dataBuffer.stress.push(data.stress);
      if (this.dataBuffer.stress.length > maxBufferSize) {
        this.dataBuffer.stress = this.dataBuffer.stress.slice(-maxBufferSize);
      }
    }
  }

  private static clearDataBuffer(): void {
    this.dataBuffer = {
      heartRate: [],
      hrv: [],
      breathing: [],
      stress: [],
    };
  }
}