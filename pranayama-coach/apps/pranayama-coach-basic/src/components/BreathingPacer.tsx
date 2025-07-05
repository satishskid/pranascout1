import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Easing,
} from 'react-native';

const { width } = Dimensions.get('window');

interface BreathingPattern {
  inhale: number;
  hold1: number;
  exhale: number;
  hold2: number;
}

interface BreathingPacerProps {
  pattern: BreathingPattern;
  isActive: boolean;
  onPhaseChange?: (phase: 'inhale' | 'hold' | 'exhale' | 'pause') => void;
  technique: string;
  size?: number;
}

const BreathingPacer: React.FC<BreathingPacerProps> = ({
  pattern,
  isActive,
  onPhaseChange,
  technique,
  size = 200,
}) => {
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const colorAnim = useRef(new Animated.Value(0)).current;
  
  const [currentPhase, setCurrentPhase] = useState<'inhale' | 'hold' | 'exhale' | 'pause'>('inhale');
  const [phaseProgress, setPhaseProgress] = useState(0);
  const [totalCycles, setTotalCycles] = useState(0);
  
  const phaseTimers = useRef<NodeJS.Timeout[]>([]);
  const progressTimer = useRef<NodeJS.Timeout | null>(null);

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'inhale': return '#4facfe';
      case 'hold': return '#43e97b';
      case 'exhale': return '#f093fb';
      case 'pause': return '#feca57';
      default: return '#4facfe';
    }
  };

  const getPhaseInstruction = (phase: string) => {
    switch (phase) {
      case 'inhale': return 'Breathe In';
      case 'hold': return 'Hold';
      case 'exhale': return 'Breathe Out';
      case 'pause': return 'Pause';
      default: return 'Breathe';
    }
  };

  const getTechniqueSpecificText = () => {
    switch (technique) {
      case 'nadi-shodhana':
        return currentPhase === 'inhale' ? 'Through left nostril' : 
               currentPhase === 'exhale' ? 'Through right nostril' : '';
      case 'ujjayi':
        return 'With throat constriction';
      case 'bhramari':
        return currentPhase === 'exhale' ? 'Hum like a bee' : '';
      case 'emergency':
        return 'Focus on the circle';
      default:
        return '';
    }
  };

  const startBreathingCycle = () => {
    const phases = [
      { name: 'inhale' as const, duration: pattern.inhale },
      { name: 'hold' as const, duration: pattern.hold1 },
      { name: 'exhale' as const, duration: pattern.exhale },
      { name: 'pause' as const, duration: pattern.hold2 },
    ];

    let currentPhaseIndex = 0;

    const runPhase = () => {
      if (!isActive) return;

      const phase = phases[currentPhaseIndex];
      setCurrentPhase(phase.name);
      onPhaseChange?.(phase.name);

      // Reset progress
      setPhaseProgress(0);

      // Start progress tracking
      const progressInterval = 50; // Update every 50ms
      const totalSteps = (phase.duration * 1000) / progressInterval;
      let currentStep = 0;

      progressTimer.current = setInterval(() => {
        currentStep++;
        const progress = Math.min(currentStep / totalSteps, 1);
        setPhaseProgress(progress);

        if (progress >= 1) {
          if (progressTimer.current) {
            clearInterval(progressTimer.current);
          }
        }
      }, progressInterval);

      // Animate based on phase
      const animations: Animated.CompositeAnimation[] = [];

      switch (phase.name) {
        case 'inhale':
          animations.push(
            Animated.timing(scaleAnim, {
              toValue: 1,
              duration: phase.duration * 1000,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            })
          );
          animations.push(
            Animated.timing(colorAnim, {
              toValue: 0,
              duration: phase.duration * 1000,
              useNativeDriver: false,
            })
          );
          break;

        case 'hold':
          animations.push(
            Animated.timing(opacityAnim, {
              toValue: 0.8,
              duration: phase.duration * 1000,
              useNativeDriver: true,
            })
          );
          animations.push(
            Animated.timing(colorAnim, {
              toValue: 1,
              duration: phase.duration * 1000,
              useNativeDriver: false,
            })
          );
          break;

        case 'exhale':
          animations.push(
            Animated.timing(scaleAnim, {
              toValue: 0.3,
              duration: phase.duration * 1000,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            })
          );
          animations.push(
            Animated.timing(colorAnim, {
              toValue: 2,
              duration: phase.duration * 1000,
              useNativeDriver: false,
            })
          );
          break;

        case 'pause':
          animations.push(
            Animated.timing(opacityAnim, {
              toValue: 1,
              duration: phase.duration * 1000,
              useNativeDriver: true,
            })
          );
          animations.push(
            Animated.timing(colorAnim, {
              toValue: 3,
              duration: phase.duration * 1000,
              useNativeDriver: false,
            })
          );
          break;
      }

      // Rotation animation (continuous)
      Animated.timing(rotateAnim, {
        toValue: rotateAnim._value + 0.25,
        duration: phase.duration * 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start();

      // Run all animations in parallel
      Animated.parallel(animations).start();

      // Schedule next phase
      const timer = setTimeout(() => {
        currentPhaseIndex = (currentPhaseIndex + 1) % phases.length;
        
        if (currentPhaseIndex === 0) {
          setTotalCycles(prev => prev + 1);
        }
        
        runPhase();
      }, phase.duration * 1000);

      phaseTimers.current.push(timer);
    };

    // Start the first phase
    runPhase();
  };

  const stopBreathingCycle = () => {
    // Clear all timers
    phaseTimers.current.forEach(timer => clearTimeout(timer));
    phaseTimers.current = [];

    if (progressTimer.current) {
      clearInterval(progressTimer.current);
      progressTimer.current = null;
    }

    // Reset animations to initial state
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.3,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(colorAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: false,
      }),
    ]).start();
  };

  useEffect(() => {
    if (isActive) {
      startBreathingCycle();
    } else {
      stopBreathingCycle();
    }

    return () => {
      stopBreathingCycle();
    };
  }, [isActive, pattern]);

  // Interpolate colors
  const animatedBackgroundColor = colorAnim.interpolate({
    inputRange: [0, 1, 2, 3],
    outputRange: [
      getPhaseColor('inhale'),
      getPhaseColor('hold'),
      getPhaseColor('exhale'),
      getPhaseColor('pause'),
    ],
  });

  const animatedBorderColor = colorAnim.interpolate({
    inputRange: [0, 1, 2, 3],
    outputRange: [
      'rgba(79, 172, 254, 0.3)',
      'rgba(67, 233, 123, 0.3)',
      'rgba(240, 147, 251, 0.3)',
      'rgba(254, 202, 87, 0.3)',
    ],
  });

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      {/* Progress Ring */}
      <View style={[styles.progressRing, { width: size + 40, height: size + 40 }]}>
        <Animated.View
          style={[
            styles.progressSegment,
            {
              width: size + 40,
              height: size + 40,
              borderRadius: (size + 40) / 2,
              borderWidth: 4,
              borderColor: animatedBorderColor,
              transform: [
                { rotate: rotation },
                { 
                  scaleX: phaseProgress * 0.2 + 0.8 
                },
                { 
                  scaleY: phaseProgress * 0.2 + 0.8 
                },
              ],
            },
          ]}
        />
      </View>

      {/* Main breathing circle */}
      <Animated.View
        style={[
          styles.breathingCircle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: animatedBackgroundColor,
            transform: [
              { scale: scaleAnim },
            ],
            opacity: opacityAnim,
          },
        ]}
      >
        {/* Inner glow effect */}
        <Animated.View
          style={[
            styles.innerGlow,
            {
              width: size * 0.7,
              height: size * 0.7,
              borderRadius: (size * 0.7) / 2,
              backgroundColor: 'rgba(255, 255, 255, 0.3)',
              transform: [
                { scale: scaleAnim },
              ],
            },
          ]}
        />

        {/* Center content */}
        <View style={styles.centerContent}>
          <Text style={styles.phaseText}>
            {getPhaseInstruction(currentPhase)}
          </Text>
          <Text style={styles.techniqueText}>
            {getTechniqueSpecificText()}
          </Text>
          <Text style={styles.counterText}>
            {pattern[currentPhase as keyof BreathingPattern]}s
          </Text>
        </View>
      </Animated.View>

      {/* Phase indicator */}
      <View style={styles.phaseIndicator}>
        <View style={styles.phaseSteps}>
          {['inhale', 'hold', 'exhale', 'pause'].map((phase, index) => (
            <View
              key={phase}
              style={[
                styles.phaseStep,
                currentPhase === phase && styles.activePhaseStep,
                { backgroundColor: getPhaseColor(phase) },
              ]}
            />
          ))}
        </View>
        <Text style={styles.cycleCounter}>
          Cycle {totalCycles + 1}
        </Text>
      </View>

      {/* Progress bar */}
      <View style={styles.progressBar}>
        <View style={styles.progressBarBg}>
          <Animated.View
            style={[
              styles.progressBarFill,
              {
                width: `${phaseProgress * 100}%`,
                backgroundColor: animatedBackgroundColor,
              },
            ]}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressRing: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressSegment: {
    position: 'absolute',
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderStyle: 'dashed',
  },
  breathingCircle: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
  },
  innerGlow: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  phaseText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
    textAlign: 'center',
  },
  techniqueText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 8,
    textAlign: 'center',
    minHeight: 20,
  },
  counterText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  phaseIndicator: {
    marginTop: 30,
    alignItems: 'center',
  },
  phaseSteps: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  phaseStep: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginHorizontal: 4,
    opacity: 0.3,
  },
  activePhaseStep: {
    opacity: 1,
    transform: [{ scale: 1.3 }],
  },
  cycleCounter: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  progressBar: {
    marginTop: 20,
    width: width - 60,
  },
  progressBarBg: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
});

export default BreathingPacer;