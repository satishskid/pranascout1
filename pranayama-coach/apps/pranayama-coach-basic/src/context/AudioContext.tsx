/**
 * Audio Context Provider
 * Manages audio playback, guidance, and breathing sound analysis
 */

import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { AudioService } from '../services/AudioService';
import { AudioCoachingType, BreathSoundAnalysis, CoachingAdjustment } from '../types/session';

interface AudioContextType {
  // Playback state
  isPlaying: boolean;
  currentTrack: string | null;
  volume: number;
  
  // Guidance state
  guidanceEnabled: boolean;
  guidanceType: AudioCoachingType;
  adaptiveCoachingEnabled: boolean;
  
  // Breathing analysis
  breathAnalysis: BreathSoundAnalysis | null;
  isAnalyzingBreath: boolean;
  
  // Coaching adjustments
  recentAdjustments: CoachingAdjustment[];
  
  // Audio configuration
  audioSources: AudioSource[];
  backgroundSounds: BackgroundSound[];
  
  // Control methods
  playGuidance: (type: AudioCoachingType, options?: PlaybackOptions) => Promise<void>;
  stopGuidance: () => Promise<void>;
  playBackgroundSound: (soundId: string) => Promise<void>;
  stopBackgroundSound: () => Promise<void>;
  setVolume: (volume: number) => void;
  
  // Breathing analysis
  startBreathingAnalysis: () => Promise<void>;
  stopBreathingAnalysis: () => Promise<void>;
  
  // Adaptive coaching
  enableAdaptiveCoaching: () => void;
  disableAdaptiveCoaching: () => void;
  makeAdjustment: (reason: string, adjustment: string) => void;
  
  // Configuration
  updateAudioSettings: (settings: Partial<AudioSettings>) => void;
  preloadAudio: (tracks: string[]) => Promise<void>;
}

interface AudioSource {
  id: string;
  name: string;
  type: AudioCoachingType;
  duration: number;
  fileUrl: string;
  description?: string;
}

interface BackgroundSound {
  id: string;
  name: string;
  category: 'nature' | 'ambient' | 'music' | 'tones';
  fileUrl: string;
  loopable: boolean;
  description?: string;
}

interface PlaybackOptions {
  loop?: boolean;
  fadeIn?: boolean;
  fadeOut?: boolean;
  startAt?: number; // seconds
  volume?: number;
}

interface AudioSettings {
  masterVolume: number;
  guidanceVolume: number;
  backgroundVolume: number;
  hapticFeedback: boolean;
  adaptiveAdjustments: boolean;
  breathingAnalysis: boolean;
  noiseReduction: boolean;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

interface AudioProviderProps {
  children: ReactNode;
}

export const AudioProvider: React.FC<AudioProviderProps> = ({ children }) => {
  // Playback state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTrack, setCurrentTrack] = useState<string | null>(null);
  const [volume, setVolumeState] = useState<number>(0.7);
  
  // Guidance state
  const [guidanceEnabled, setGuidanceEnabled] = useState<boolean>(true);
  const [guidanceType, setGuidanceType] = useState<AudioCoachingType>('voice_guidance');
  const [adaptiveCoachingEnabled, setAdaptiveCoachingEnabled] = useState<boolean>(true);
  
  // Analysis state
  const [breathAnalysis, setBreathAnalysis] = useState<BreathSoundAnalysis | null>(null);
  const [isAnalyzingBreath, setIsAnalyzingBreath] = useState<boolean>(false);
  
  // Adjustments
  const [recentAdjustments, setRecentAdjustments] = useState<CoachingAdjustment[]>([]);
  
  // Audio sources and sounds
  const [audioSources] = useState<AudioSource[]>([
    {
      id: 'voice_basic',
      name: 'Basic Voice Guidance',
      type: 'voice_guidance',
      duration: 0,
      fileUrl: 'voice_guidance_basic.mp3',
      description: 'Clear, calming voice instructions for breathing exercises',
    },
    {
      id: 'breathing_bell',
      name: 'Breathing Bell',
      type: 'breathing_tones',
      duration: 0,
      fileUrl: 'breathing_bell.mp3',
      description: 'Gentle bell tones to guide breathing rhythm',
    },
    {
      id: 'ocean_waves',
      name: 'Ocean Waves',
      type: 'nature_sounds',
      duration: 0,
      fileUrl: 'ocean_waves.mp3',
      description: 'Soothing ocean waves for relaxation',
    },
  ]);

  const [backgroundSounds] = useState<BackgroundSound[]>([
    {
      id: 'forest_ambience',
      name: 'Forest Ambience',
      category: 'nature',
      fileUrl: 'forest_ambience.mp3',
      loopable: true,
      description: 'Peaceful forest sounds with birds and wind',
    },
    {
      id: 'rain_gentle',
      name: 'Gentle Rain',
      category: 'nature',
      fileUrl: 'gentle_rain.mp3',
      loopable: true,
      description: 'Soft rain sounds for deep relaxation',
    },
    {
      id: 'singing_bowls',
      name: 'Tibetan Singing Bowls',
      category: 'ambient',
      fileUrl: 'singing_bowls.mp3',
      loopable: true,
      description: 'Resonant singing bowl harmonics',
    },
  ]);

  // Refs for audio management
  const audioServiceRef = useRef<any>(null);
  const analysisInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    initializeAudioService();
    
    return () => {
      cleanup();
    };
  }, []);

  const initializeAudioService = async () => {
    try {
      await AudioService.initialize();
      audioServiceRef.current = AudioService;
      
      // Preload essential audio files
      const essentialTracks = audioSources
        .filter(source => ['voice_guidance', 'breathing_tones'].includes(source.type))
        .map(source => source.fileUrl);
      
      await preloadAudio(essentialTracks);
      
    } catch (error) {
      console.error('Failed to initialize audio service:', error);
    }
  };

  const cleanup = async () => {
    if (isPlaying) {
      await stopGuidance();
    }
    if (isAnalyzingBreath) {
      await stopBreathingAnalysis();
    }
    if (analysisInterval.current) {
      clearInterval(analysisInterval.current);
    }
  };

  const playGuidance = async (type: AudioCoachingType, options: PlaybackOptions = {}) => {
    try {
      const audioSource = audioSources.find(source => source.type === type);
      if (!audioSource) {
        throw new Error(`Audio source not found for type: ${type}`);
      }

      await AudioService.playAudio(audioSource.fileUrl, {
        volume: options.volume || volume,
        loop: options.loop || false,
        category: 'guidance',
      });

      setIsPlaying(true);
      setCurrentTrack(audioSource.id);
      setGuidanceType(type);

    } catch (error) {
      console.error('Failed to play guidance audio:', error);
      throw error;
    }
  };

  const stopGuidance = async () => {
    try {
      await AudioService.stopAudio('guidance');
      setIsPlaying(false);
      setCurrentTrack(null);
    } catch (error) {
      console.error('Failed to stop guidance audio:', error);
      throw error;
    }
  };

  const playBackgroundSound = async (soundId: string) => {
    try {
      const sound = backgroundSounds.find(s => s.id === soundId);
      if (!sound) {
        throw new Error(`Background sound not found: ${soundId}`);
      }

      await AudioService.playAudio(sound.fileUrl, {
        volume: volume * 0.6, // Background sounds at lower volume
        loop: sound.loopable,
        category: 'background',
      });

    } catch (error) {
      console.error('Failed to play background sound:', error);
      throw error;
    }
  };

  const stopBackgroundSound = async () => {
    try {
      await AudioService.stopAudio('background');
    } catch (error) {
      console.error('Failed to stop background sound:', error);
      throw error;
    }
  };

  const setVolume = (newVolume: number) => {
    setVolumeState(newVolume);
    AudioService.setMasterVolume(newVolume);
  };

  const startBreathingAnalysis = async () => {
    try {
      setIsAnalyzingBreath(true);
      await AudioService.startBreathingAnalysis();
      
      // Start periodic analysis updates
      analysisInterval.current = setInterval(async () => {
        try {
          const analysis = await AudioService.getBreathingAnalysis();
          setBreathAnalysis(analysis);
          
          // Check if adaptive coaching adjustment is needed
          if (adaptiveCoachingEnabled && analysis) {
            checkForCoachingAdjustments(analysis);
          }
        } catch (error) {
          console.error('Breathing analysis update failed:', error);
        }
      }, 2000); // Update every 2 seconds

    } catch (error) {
      console.error('Failed to start breathing analysis:', error);
      setIsAnalyzingBreath(false);
      throw error;
    }
  };

  const stopBreathingAnalysis = async () => {
    try {
      setIsAnalyzingBreath(false);
      await AudioService.stopBreathingAnalysis();
      
      if (analysisInterval.current) {
        clearInterval(analysisInterval.current);
        analysisInterval.current = null;
      }
      
      setBreathAnalysis(null);
    } catch (error) {
      console.error('Failed to stop breathing analysis:', error);
      throw error;
    }
  };

  const checkForCoachingAdjustments = (analysis: BreathSoundAnalysis) => {
    // Analyze breathing pattern and suggest adjustments
    if (analysis.breathingQuality < 0.5) {
      makeAdjustment('poor_breathing_quality', 'slower_pace');
    }
    
    if (analysis.nostrilDominance === 'left' && guidanceType === 'voice_guidance') {
      makeAdjustment('left_nostril_dominance', 'right_nostril_emphasis');
    }
    
    if (analysis.soundPurity < 0.6) {
      makeAdjustment('noisy_breathing', 'gentle_reminder');
    }
  };

  const enableAdaptiveCoaching = () => {
    setAdaptiveCoachingEnabled(true);
  };

  const disableAdaptiveCoaching = () => {
    setAdaptiveCoachingEnabled(false);
  };

  const makeAdjustment = (reason: string, adjustment: string) => {
    const newAdjustment: CoachingAdjustment = {
      timestamp: new Date(),
      reason,
      adjustment,
    };
    
    setRecentAdjustments(prev => [...prev, newAdjustment].slice(-5)); // Keep last 5
    
    // Apply the adjustment
    applyCoachingAdjustment(adjustment);
  };

  const applyCoachingAdjustment = async (adjustment: string) => {
    try {
      switch (adjustment) {
        case 'slower_pace':
          await AudioService.adjustPlaybackSpeed(0.8);
          break;
        case 'faster_pace':
          await AudioService.adjustPlaybackSpeed(1.2);
          break;
        case 'calming_voice':
          await playGuidance('voice_guidance', { volume: volume * 0.8 });
          break;
        case 'gentle_reminder':
          await AudioService.playNotificationSound('gentle_chime');
          break;
        default:
          console.log(`Unhandled adjustment: ${adjustment}`);
      }
    } catch (error) {
      console.error('Failed to apply coaching adjustment:', error);
    }
  };

  const updateAudioSettings = (settings: Partial<AudioSettings>) => {
    if (settings.masterVolume !== undefined) {
      setVolume(settings.masterVolume);
    }
    
    if (settings.adaptiveAdjustments !== undefined) {
      setAdaptiveCoachingEnabled(settings.adaptiveAdjustments);
    }
    
    AudioService.updateSettings(settings);
  };

  const preloadAudio = async (tracks: string[]) => {
    try {
      await AudioService.preloadTracks(tracks);
    } catch (error) {
      console.error('Failed to preload audio tracks:', error);
      throw error;
    }
  };

  const value: AudioContextType = {
    isPlaying,
    currentTrack,
    volume,
    guidanceEnabled,
    guidanceType,
    adaptiveCoachingEnabled,
    breathAnalysis,
    isAnalyzingBreath,
    recentAdjustments,
    audioSources,
    backgroundSounds,
    playGuidance,
    stopGuidance,
    playBackgroundSound,
    stopBackgroundSound,
    setVolume,
    startBreathingAnalysis,
    stopBreathingAnalysis,
    enableAdaptiveCoaching,
    disableAdaptiveCoaching,
    makeAdjustment,
    updateAudioSettings,
    preloadAudio,
  };

  return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>;
};

export const useAudio = (): AudioContextType => {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};