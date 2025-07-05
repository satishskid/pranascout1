/**
 * Session and meditation activity types
 */

import { VitalSigns, MotionData } from './vitalSigns';

export interface Session {
  id: string;
  userId: string;
  sessionType: SessionType;
  pranayama?: PranayamaSession;
  meditation?: MeditationSession;
  timing: SessionTiming;
  vitalSigns: VitalSigns;
  userExperience: UserExperience;
  gamification: SessionGamification;
  outcome: SessionOutcome;
  createdAt: Date;
  updatedAt: Date;
}

export type SessionType = 
  | 'pranayama'
  | 'meditation_walk'
  | 'meditation_stationary'
  | 'breathing_exercise'
  | 'stress_relief'
  | 'sleep_preparation'
  | 'energy_boost'
  | 'custom';

export interface PranayamaSession {
  technique: PranayamaTechnique;
  pattern: BreathingPattern;
  cycles: {
    planned: number;
    completed: number;
  };
  nostrilPattern?: string;
  guidanceUsed: boolean;
}

export type PranayamaTechnique = 
  | 'nadi_shodhana'     // Alternate nostril breathing
  | 'box_breathing'     // 4-4-4-4 pattern
  | 'ujjayi'           // Ocean breath
  | 'bhramari'         // Bee breath
  | 'kapalabhati'      // Skull shining breath
  | 'bhastrika'        // Bellows breath
  | 'surya_bhedana'    // Right nostril breathing
  | 'chandra_bhedana'  // Left nostril breathing
  | 'three_part'       // Three-part breath
  | 'custom';

export interface BreathingPattern {
  inhale: number;          // seconds
  holdAfterInhale: number;
  exhale: number;
  holdAfterExhale: number;
  ratio: string;           // e.g., "4:4:4:4"
}

export interface MeditationSession {
  activityType: MeditationActivityType;
  location: MeditationLocation;
  movement?: MovementData;
  environment: EnvironmentData;
  guidanceUsed: boolean;
}

export type MeditationActivityType = 
  | 'morning_walk'
  | 'evening_walk'
  | 'nature_walk'
  | 'indoor_meditation'
  | 'stretching'
  | 'yoga'
  | 'mindfulness'
  | 'body_scan'
  | 'loving_kindness'
  | 'custom';

export interface MeditationLocation {
  type: 'indoor' | 'outdoor' | 'unknown';
  gpsData?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  environment: string; // park, home, office, etc.
}

export interface MovementData {
  stepCount: number;
  distance: number;        // meters
  avgPace: number;         // minutes per km
  route?: RoutePoint[];
  elevation?: number;
}

export interface RoutePoint {
  timestamp: Date;
  latitude: number;
  longitude: number;
  elevation?: number;
}

export interface EnvironmentData {
  ambientLight?: number;
  noiseLevel?: number;
  temperature?: number;
  humidity?: number;
  airQuality?: number;
}

export interface SessionTiming {
  startTime: Date;
  endTime?: Date;
  plannedDuration: number;  // seconds
  actualDuration?: number;  // seconds
  pausedDuration?: number;  // seconds
  timeZone: string;
}

export interface UserExperience {
  difficultyRating?: number;     // 1-5
  satisfactionRating?: number;   // 1-5
  energyLevelBefore?: number;    // 1-10
  energyLevelAfter?: number;     // 1-10
  stressLevelBefore?: number;    // 1-10
  stressLevelAfter?: number;     // 1-10
  moodBefore?: string;
  moodAfter?: string;
  notes?: string;
  tags?: string[];
  wouldRecommend?: boolean;
}

export interface SessionGamification {
  pointsEarned: number;
  achievementsUnlocked: string[];
  streakContribution: boolean;
  personalBests: PersonalBest[];
  challengeProgress: ChallengeProgress[];
}

export interface PersonalBest {
  metric: string;      // longest_session, best_hrv, most_consistent
  value: number;
  previousBest?: number;
}

export interface ChallengeProgress {
  challengeId: string;
  progress: number;
  completed: boolean;
}

export interface SessionOutcome {
  sessionCompleted: boolean;
  completionPercentage: number;
  reasonForIncomplete?: string;
  effectiveness?: number;     // calculated effectiveness score
  nextSessionRecommendation?: NextSessionRecommendation;
  healthInsights?: string[];
  warningsOrConcerns?: string[];
}

export interface NextSessionRecommendation {
  technique: string;
  duration: number;
  timing: string;
  focus: string;
}

// Audio coaching types
export interface AudioCoaching {
  coachingUsed: boolean;
  coachingType: AudioCoachingType;
  backgroundAudio: string;
  volumeLevel: number;
  adaptiveCoaching: AdaptiveCoaching;
  breathSoundAnalysis?: BreathSoundAnalysis;
}

export type AudioCoachingType = 
  | 'voice_guidance'
  | 'breathing_tones'
  | 'nature_sounds'
  | 'music'
  | 'silent';

export interface AdaptiveCoaching {
  enabled: boolean;
  adjustments: CoachingAdjustment[];
}

export interface CoachingAdjustment {
  timestamp: Date;
  reason: string;         // "high_stress", "breathing_too_fast", etc.
  adjustment: string;     // "slower_pace", "calming_voice", etc.
}

export interface BreathSoundAnalysis {
  breathingPatternDetected: string;
  breathingQuality: number;  // 0-1
  nostrilDominance: string;  // left, right, balanced
  soundPurity: number;       // breath clarity
}

// Real-time session state
export interface SessionState {
  status: 'not_started' | 'running' | 'paused' | 'completed' | 'cancelled';
  currentPhase: 'preparation' | 'breathing' | 'meditation' | 'cooldown' | 'feedback';
  elapsedTime: number;       // seconds
  remainingTime: number;     // seconds
  currentCycle?: number;
  totalCycles?: number;
  currentBreathPhase?: 'inhale' | 'hold_in' | 'exhale' | 'hold_out';
  breathPhaseTime?: number;  // seconds remaining in current phase
  realTimeMetrics: RealTimeMetrics;
}

export interface RealTimeMetrics {
  currentHeartRate?: number;
  currentHRV?: number;
  currentStressLevel?: number;
  currentBreathingRate?: number;
  coherenceScore?: number;
  sessionQuality?: number;
}

// Session configuration
export interface SessionConfig {
  sessionType: SessionType;
  technique?: PranayamaTechnique;
  activityType?: MeditationActivityType;
  duration: number;        // seconds
  customPattern?: BreathingPattern;
  audioSettings: AudioSettings;
  vitalSignsSettings: VitalSignsSettings;
  gamificationEnabled: boolean;
  adaptiveCoachingEnabled: boolean;
}

export interface AudioSettings {
  guidanceEnabled: boolean;
  guidanceType: AudioCoachingType;
  backgroundSound: string;
  volume: number;          // 0-1
  hapticFeedback: boolean;
}

export interface VitalSignsSettings {
  cameraEnabled: boolean;
  microphoneEnabled: boolean;
  motionSensorsEnabled: boolean;
  realTimeProcessing: boolean;
  dataCollection: boolean;
  privacyMode: boolean;
}