import { NativeModules, Platform } from 'react-native';
import Sound from 'react-native-sound';

interface BreathingPattern {
  inhale: number;
  hold: number;
  exhale: number;
  pause: number;
}

interface CoachingConfig {
  voiceType: 'male' | 'female' | 'neutral';
  language: 'en' | 'es' | 'fr' | 'de' | 'hi' | 'ja';
  volume: number; // 0-1
  speed: number; // 0.5-2.0
  enableBackground: boolean;
  backgroundType: 'nature' | 'white-noise' | 'binaural' | 'silence';
  backgroundVolume: number; // 0-1
  hapticFeedback: boolean;
}

interface BreathingPhase {
  phase: 'inhale' | 'hold' | 'exhale' | 'pause';
  duration: number;
  instruction: string;
  countdown?: number;
}

interface VitalSignsContext {
  heartRate?: number;
  hrv?: number;
  stressLevel?: number;
  breathingRate?: number;
}

export class AudioCoachingService {
  private isActive: boolean = false;
  private currentConfig: CoachingConfig;
  private currentPattern: BreathingPattern;
  private currentPhase: BreathingPhase | null = null;
  private phaseTimer: NodeJS.Timeout | null = null;
  private backgroundSound: Sound | null = null;
  private onPhaseChange?: (phase: BreathingPhase) => void;
  private onSessionComplete?: () => void;
  private sessionDuration: number = 0;
  private sessionStartTime: Date | null = null;
  private cycleCount: number = 0;
  private targetCycles: number = 0;

  constructor() {
    this.currentConfig = {
      voiceType: 'neutral',
      language: 'en',
      volume: 0.8,
      speed: 1.0,
      enableBackground: true,
      backgroundType: 'nature',
      backgroundVolume: 0.3,
      hapticFeedback: true,
    };

    this.currentPattern = {
      inhale: 4,
      hold: 4,
      exhale: 4,
      pause: 4,
    };

    // Enable playback in silence mode
    Sound.setCategory('Playback');
  }

  /**
   * Start audio coaching session
   */
  async startCoaching(
    pattern: BreathingPattern,
    duration: number, // in minutes
    config?: Partial<CoachingConfig>,
    onPhaseChange?: (phase: BreathingPhase) => void,
    onComplete?: () => void
  ): Promise<void> {
    if (this.isActive) {
      throw new Error('Coaching session is already active');
    }

    this.currentConfig = { ...this.currentConfig, ...config };
    this.currentPattern = pattern;
    this.sessionDuration = duration;
    this.sessionStartTime = new Date();
    this.cycleCount = 0;
    this.onPhaseChange = onPhaseChange;
    this.onSessionComplete = onComplete;

    // Calculate target cycles based on duration
    const cycleTime = pattern.inhale + pattern.hold + pattern.exhale + pattern.pause;
    this.targetCycles = Math.floor((duration * 60) / cycleTime);

    try {
      // Start background sounds if enabled
      if (this.currentConfig.enableBackground) {
        await this.startBackgroundAudio();
      }

      // Start coaching sequence
      this.isActive = true;
      await this.playWelcomeMessage();
      await this.startBreathingCycle();

      console.log(`Started audio coaching: ${pattern.inhale}-${pattern.hold}-${pattern.exhale}-${pattern.pause} for ${duration} minutes`);
    } catch (error) {
      console.error('Failed to start coaching:', error);
      this.stopCoaching();
      throw error;
    }
  }

  /**
   * Stop audio coaching session
   */
  async stopCoaching(): Promise<void> {
    if (!this.isActive) {
      return;
    }

    this.isActive = false;
    
    if (this.phaseTimer) {
      clearTimeout(this.phaseTimer);
      this.phaseTimer = null;
    }

    if (this.backgroundSound) {
      this.backgroundSound.stop();
      this.backgroundSound.release();
      this.backgroundSound = null;
    }

    this.currentPhase = null;
    console.log('Stopped audio coaching');
  }

  /**
   * Pause coaching session
   */
  pauseCoaching(): void {
    if (!this.isActive) return;

    if (this.phaseTimer) {
      clearTimeout(this.phaseTimer);
      this.phaseTimer = null;
    }

    if (this.backgroundSound) {
      this.backgroundSound.pause();
    }

    console.log('Paused audio coaching');
  }

  /**
   * Resume coaching session
   */
  resumeCoaching(): void {
    if (!this.isActive || !this.currentPhase) return;

    if (this.backgroundSound) {
      this.backgroundSound.play();
    }

    // Resume current phase with remaining time
    this.scheduleNextPhase(this.currentPhase.duration);
    console.log('Resumed audio coaching');
  }

  /**
   * Adjust coaching based on vital signs
   */
  adjustCoaching(vitalSigns: VitalSignsContext): void {
    if (!this.isActive) return;

    const adjustments = this.calculateAdjustments(vitalSigns);
    
    if (adjustments.shouldAdjustPattern) {
      this.currentPattern = adjustments.newPattern;
      console.log('Adjusted breathing pattern based on vital signs');
    }

    if (adjustments.shouldAdjustSpeed) {
      this.currentConfig.speed = adjustments.newSpeed;
      console.log(`Adjusted coaching speed to ${adjustments.newSpeed}`);
    }
  }

  /**
   * Update coaching configuration
   */
  updateConfig(config: Partial<CoachingConfig>): void {
    this.currentConfig = { ...this.currentConfig, ...config };
    
    // Apply volume changes immediately
    if (this.backgroundSound && config.backgroundVolume !== undefined) {
      this.backgroundSound.setVolume(config.backgroundVolume);
    }
  }

  /**
   * Get current session status
   */
  getSessionStatus() {
    return {
      isActive: this.isActive,
      currentPhase: this.currentPhase,
      cycleCount: this.cycleCount,
      targetCycles: this.targetCycles,
      progress: this.targetCycles > 0 ? (this.cycleCount / this.targetCycles) * 100 : 0,
      elapsedTime: this.sessionStartTime ? Date.now() - this.sessionStartTime.getTime() : 0,
      remainingTime: this.sessionDuration * 60 * 1000 - (this.sessionStartTime ? Date.now() - this.sessionStartTime.getTime() : 0),
    };
  }

  /**
   * Start background audio
   */
  private async startBackgroundAudio(): Promise<void> {
    const backgroundFiles = {
      nature: 'nature_sounds.mp3',
      'white-noise': 'white_noise.mp3',
      binaural: 'binaural_beats.mp3',
      silence: null,
    };

    const fileName = backgroundFiles[this.currentConfig.backgroundType];
    if (!fileName) return;

    return new Promise((resolve, reject) => {
      this.backgroundSound = new Sound(fileName, Sound.MAIN_BUNDLE, (error) => {
        if (error) {
          console.error('Failed to load background sound:', error);
          reject(error);
          return;
        }

        if (this.backgroundSound) {
          this.backgroundSound.setVolume(this.currentConfig.backgroundVolume);
          this.backgroundSound.setNumberOfLoops(-1); // Loop indefinitely
          this.backgroundSound.play();
        }
        
        resolve();
      });
    });
  }

  /**
   * Play welcome message
   */
  private async playWelcomeMessage(): Promise<void> {
    const message = this.getLocalizedMessage('welcome');
    await this.speakText(message);
    await this.delay(1000);
  }

  /**
   * Start breathing cycle
   */
  private async startBreathingCycle(): Promise<void> {
    if (!this.isActive) return;

    const phases: Array<keyof BreathingPattern> = ['inhale', 'hold', 'exhale', 'pause'];
    
    for (const phaseName of phases) {
      if (!this.isActive) break;

      const duration = this.currentPattern[phaseName];
      if (duration === 0) continue;

      const phase: BreathingPhase = {
        phase: phaseName,
        duration,
        instruction: this.getPhaseInstruction(phaseName, duration),
      };

      this.currentPhase = phase;
      this.onPhaseChange?.(phase);

      // Speak phase instruction
      await this.speakText(phase.instruction);

      // Apply haptic feedback
      if (this.currentConfig.hapticFeedback) {
        this.triggerHapticFeedback(phaseName);
      }

      // Wait for phase duration
      await this.waitForPhase(duration);
    }

    // Complete cycle
    this.cycleCount++;
    
    // Check if session should continue
    if (this.cycleCount < this.targetCycles && this.isActive) {
      await this.startBreathingCycle();
    } else {
      await this.completeSession();
    }
  }

  /**
   * Wait for phase duration with countdown
   */
  private async waitForPhase(duration: number): Promise<void> {
    return new Promise((resolve) => {
      let remaining = duration;
      
      const countdown = () => {
        if (!this.isActive || remaining <= 0) {
          resolve();
          return;
        }

        if (this.currentPhase) {
          this.currentPhase.countdown = remaining;
          this.onPhaseChange?.(this.currentPhase);
        }

        remaining--;
        this.phaseTimer = setTimeout(countdown, 1000);
      };

      countdown();
    });
  }

  /**
   * Complete coaching session
   */
  private async completeSession(): Promise<void> {
    const completionMessage = this.getLocalizedMessage('completion');
    await this.speakText(completionMessage);
    
    this.stopCoaching();
    this.onSessionComplete?.();
  }

  /**
   * Schedule next phase
   */
  private scheduleNextPhase(delay: number): void {
    this.phaseTimer = setTimeout(() => {
      // Continue with current cycle
    }, delay * 1000);
  }

  /**
   * Calculate adjustments based on vital signs
   */
  private calculateAdjustments(vitalSigns: VitalSignsContext) {
    const adjustments = {
      shouldAdjustPattern: false,
      newPattern: { ...this.currentPattern },
      shouldAdjustSpeed: false,
      newSpeed: this.currentConfig.speed,
    };

    // Adjust based on heart rate
    if (vitalSigns.heartRate) {
      if (vitalSigns.heartRate > 100) {
        // High heart rate - slow down breathing
        adjustments.shouldAdjustPattern = true;
        adjustments.newPattern.inhale = Math.min(this.currentPattern.inhale + 1, 8);
        adjustments.newPattern.exhale = Math.min(this.currentPattern.exhale + 1, 8);
      } else if (vitalSigns.heartRate < 60) {
        // Low heart rate - can speed up slightly
        adjustments.shouldAdjustSpeed = true;
        adjustments.newSpeed = Math.min(this.currentConfig.speed + 0.1, 1.5);
      }
    }

    // Adjust based on stress level
    if (vitalSigns.stressLevel && vitalSigns.stressLevel > 7) {
      // High stress - longer exhales for relaxation
      adjustments.shouldAdjustPattern = true;
      adjustments.newPattern.exhale = Math.min(this.currentPattern.exhale + 2, 10);
      adjustments.shouldAdjustSpeed = true;
      adjustments.newSpeed = Math.max(this.currentConfig.speed - 0.2, 0.5);
    }

    // Adjust based on HRV
    if (vitalSigns.hrv && vitalSigns.hrv < 20) {
      // Low HRV indicates stress - gentler pattern
      adjustments.shouldAdjustPattern = true;
      adjustments.newPattern.hold = Math.max(this.currentPattern.hold - 1, 0);
      adjustments.newPattern.pause = Math.max(this.currentPattern.pause - 1, 0);
    }

    return adjustments;
  }

  /**
   * Get phase instruction text
   */
  private getPhaseInstruction(phase: keyof BreathingPattern, duration: number): string {
    const instructions = {
      inhale: `Breathe in for ${duration} seconds`,
      hold: `Hold your breath for ${duration} seconds`,
      exhale: `Breathe out for ${duration} seconds`,
      pause: `Pause for ${duration} seconds`,
    };

    return this.getLocalizedMessage(phase, { duration });
  }

  /**
   * Get localized message
   */
  private getLocalizedMessage(key: string, params?: any): string {
    // Simplified localization - in real app would use proper i18n
    const messages = {
      en: {
        welcome: 'Welcome to your breathing session. Find a comfortable position and begin when ready.',
        inhale: params ? `Breathe in for ${params.duration} seconds` : 'Breathe in',
        hold: params ? `Hold your breath for ${params.duration} seconds` : 'Hold',
        exhale: params ? `Breathe out for ${params.duration} seconds` : 'Breathe out',
        pause: params ? `Pause for ${params.duration} seconds` : 'Pause',
        completion: 'Excellent work. Your breathing session is complete.',
      },
      es: {
        welcome: 'Bienvenido a tu sesión de respiración. Encuentra una posición cómoda y comienza cuando estés listo.',
        inhale: params ? `Inhala durante ${params.duration} segundos` : 'Inhala',
        hold: params ? `Mantén la respiración durante ${params.duration} segundos` : 'Mantén',
        exhale: params ? `Exhala durante ${params.duration} segundos` : 'Exhala',
        pause: params ? `Pausa durante ${params.duration} segundos` : 'Pausa',
        completion: 'Excelente trabajo. Tu sesión de respiración está completa.',
      },
    };

    const languageMessages = messages[this.currentConfig.language] || messages.en;
    return languageMessages[key] || key;
  }

  /**
   * Speak text using text-to-speech
   */
  private async speakText(text: string): Promise<void> {
    // In a real implementation, would use react-native-tts or similar
    // For now, simulate TTS with a delay
    console.log(`TTS: ${text}`);
    
    const speechDuration = (text.length * 50) / this.currentConfig.speed; // Approximate duration
    await this.delay(Math.min(speechDuration, 3000)); // Max 3 seconds per phrase
  }

  /**
   * Trigger haptic feedback
   */
  private triggerHapticFeedback(phase: keyof BreathingPattern): void {
    if (!this.currentConfig.hapticFeedback) return;

    // In a real implementation, would use react-native-haptic-feedback
    const patterns = {
      inhale: 'light',
      hold: 'medium',
      exhale: 'heavy',
      pause: 'light',
    };

    console.log(`Haptic: ${patterns[phase]} feedback`);
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get available voice types
   */
  static getAvailableVoices(): string[] {
    return ['male', 'female', 'neutral'];
  }

  /**
   * Get available languages
   */
  static getAvailableLanguages(): Array<{ code: string; name: string }> {
    return [
      { code: 'en', name: 'English' },
      { code: 'es', name: 'Español' },
      { code: 'fr', name: 'Français' },
      { code: 'de', name: 'Deutsch' },
      { code: 'hi', name: 'हिन्दी' },
      { code: 'ja', name: '日本語' },
    ];
  }

  /**
   * Get available background types
   */
  static getAvailableBackgrounds(): Array<{ type: string; name: string }> {
    return [
      { type: 'nature', name: 'Nature Sounds' },
      { type: 'white-noise', name: 'White Noise' },
      { type: 'binaural', name: 'Binaural Beats' },
      { type: 'silence', name: 'Silence' },
    ];
  }
}

export default AudioCoachingService;