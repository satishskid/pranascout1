import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const { width: screenWidth } = Dimensions.get('window');

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  isUnlocked: boolean;
  unlockedAt?: Date;
  progress: number; // 0-100
  maxProgress: number;
  type: 'sessions' | 'minutes' | 'streak' | 'technique' | 'special';
}

interface ProgressStats {
  totalSessions: number;
  totalMinutes: number;
  currentStreak: number;
  longestStreak: number;
  averageSessionLength: number;
  weeklyGoal: number;
  weeklyProgress: number;
  level: number;
  xp: number;
  xpToNextLevel: number;
}

interface Milestone {
  id: string;
  title: string;
  description: string;
  targetValue: number;
  currentValue: number;
  icon: string;
  color: string;
  type: 'sessions' | 'minutes' | 'streak';
  isCompleted: boolean;
}

interface ProgressTrackerProps {
  stats: ProgressStats;
  achievements: Achievement[];
  milestones: Milestone[];
  onAchievementPress?: (achievement: Achievement) => void;
  onMilestonePress?: (milestone: Milestone) => void;
  showLevel?: boolean;
  showAchievements?: boolean;
  showMilestones?: boolean;
  compact?: boolean;
}

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  stats,
  achievements,
  milestones,
  onAchievementPress,
  onMilestonePress,
  showLevel = true,
  showAchievements = true,
  showMilestones = true,
  compact = false,
}) => {
  const [selectedTab, setSelectedTab] = useState<'overview' | 'achievements' | 'milestones'>('overview');
  const [animatedValues] = useState(() => ({
    xp: new Animated.Value(0),
    weekly: new Animated.Value(0),
    achievements: achievements.map(() => new Animated.Value(0)),
    milestones: milestones.map(() => new Animated.Value(0)),
  }));

  useEffect(() => {
    // Animate progress bars
    Animated.parallel([
      Animated.timing(animatedValues.xp, {
        toValue: (stats.xp / (stats.xp + stats.xpToNextLevel)) * 100,
        duration: 1000,
        useNativeDriver: false,
      }),
      Animated.timing(animatedValues.weekly, {
        toValue: (stats.weeklyProgress / stats.weeklyGoal) * 100,
        duration: 1200,
        useNativeDriver: false,
      }),
      ...animatedValues.achievements.map((anim, index) =>
        Animated.timing(anim, {
          toValue: achievements[index].progress,
          duration: 800 + index * 100,
          useNativeDriver: false,
        })
      ),
      ...animatedValues.milestones.map((anim, index) =>
        Animated.timing(anim, {
          toValue: (milestones[index].currentValue / milestones[index].targetValue) * 100,
          duration: 900 + index * 100,
          useNativeDriver: false,
        })
      ),
    ]).start();
  }, [stats, achievements, milestones]);

  const getStreakColor = (streak: number) => {
    if (streak >= 30) return '#f59e0b';
    if (streak >= 14) return '#8b5cf6';
    if (streak >= 7) return '#22c55e';
    return '#6b7280';
  };

  const getLevelIcon = (level: number) => {
    if (level >= 20) return 'diamond-outline';
    if (level >= 15) return 'star-outline';
    if (level >= 10) return 'trophy-outline';
    if (level >= 5) return 'medal-outline';
    return 'leaf-outline';
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  const ProgressBar: React.FC<{
    progress: number;
    color: string;
    height?: number;
    animated?: boolean;
    animatedValue?: Animated.Value;
  }> = ({ progress, color, height = 8, animated = false, animatedValue }) => (
    <View style={[styles.progressBarContainer, { height }]}>
      {animated && animatedValue ? (
        <Animated.View
          style={[
            styles.progressBarFill,
            {
              backgroundColor: color,
              width: animatedValue.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%'],
                extrapolate: 'clamp',
              }),
            },
          ]}
        />
      ) : (
        <View
          style={[
            styles.progressBarFill,
            {
              backgroundColor: color,
              width: `${Math.min(progress, 100)}%`,
            },
          ]}
        />
      )}
    </View>
  );

  const StatCard: React.FC<{
    title: string;
    value: string;
    subtitle?: string;
    icon: string;
    color: string;
    progress?: number;
    progressColor?: string;
    animatedValue?: Animated.Value;
  }> = ({ title, value, subtitle, icon, color, progress, progressColor, animatedValue }) => (
    <View style={[styles.statCard, compact && styles.compactStatCard]}>
      <View style={styles.statHeader}>
        <Ionicons name={icon} size={compact ? 16 : 20} color={color} />
        <Text style={[styles.statTitle, compact && styles.compactText]}>{title}</Text>
      </View>
      <Text style={[styles.statValue, compact && styles.compactValue]}>{value}</Text>
      {subtitle && (
        <Text style={[styles.statSubtitle, compact && styles.compactSubtitle]}>{subtitle}</Text>
      )}
      {progress !== undefined && (
        <View style={styles.statProgress}>
          <ProgressBar
            progress={progress}
            color={progressColor || color}
            height={compact ? 4 : 6}
            animated={!!animatedValue}
            animatedValue={animatedValue}
          />
        </View>
      )}
    </View>
  );

  const AchievementCard: React.FC<{
    achievement: Achievement;
    index: number;
  }> = ({ achievement, index }) => (
    <TouchableOpacity
      style={[
        styles.achievementCard,
        achievement.isUnlocked && styles.unlockedAchievement,
        compact && styles.compactAchievementCard,
      ]}
      onPress={() => onAchievementPress?.(achievement)}
    >
      <View style={styles.achievementHeader}>
        <View
          style={[
            styles.achievementIcon,
            { backgroundColor: achievement.isUnlocked ? achievement.color + '20' : '#f3f4f6' },
            compact && styles.compactAchievementIcon,
          ]}
        >
          <Ionicons
            name={achievement.icon}
            size={compact ? 16 : 24}
            color={achievement.isUnlocked ? achievement.color : '#9ca3af'}
          />
        </View>
        <View style={styles.achievementInfo}>
          <Text
            style={[
              styles.achievementTitle,
              !achievement.isUnlocked && styles.lockedText,
              compact && styles.compactText,
            ]}
          >
            {achievement.title}
          </Text>
          <Text
            style={[
              styles.achievementDescription,
              compact && styles.compactSubtitle,
            ]}
          >
            {achievement.description}
          </Text>
          {achievement.unlockedAt && (
            <Text style={[styles.unlockedDate, compact && styles.compactSubtitle]}>
              Unlocked {achievement.unlockedAt.toLocaleDateString()}
            </Text>
          )}
        </View>
        {achievement.isUnlocked && (
          <Ionicons name="checkmark-circle" size={20} color={achievement.color} />
        )}
      </View>
      
      {!achievement.isUnlocked && achievement.progress < 100 && (
        <View style={styles.achievementProgress}>
          <Text style={[styles.progressText, compact && styles.compactSubtitle]}>
            {achievement.progress}% ({achievement.progress * achievement.maxProgress / 100}/{achievement.maxProgress})
          </Text>
          <ProgressBar
            progress={achievement.progress}
            color={achievement.color}
            height={compact ? 4 : 6}
            animated
            animatedValue={animatedValues.achievements[index]}
          />
        </View>
      )}
    </TouchableOpacity>
  );

  const MilestoneCard: React.FC<{
    milestone: Milestone;
    index: number;
  }> = ({ milestone, index }) => (
    <TouchableOpacity
      style={[
        styles.milestoneCard,
        milestone.isCompleted && styles.completedMilestone,
        compact && styles.compactMilestoneCard,
      ]}
      onPress={() => onMilestonePress?.(milestone)}
    >
      <View style={styles.milestoneHeader}>
        <View
          style={[
            styles.milestoneIcon,
            { backgroundColor: milestone.isCompleted ? milestone.color + '20' : '#f3f4f6' },
            compact && styles.compactMilestoneIcon,
          ]}
        >
          <Ionicons
            name={milestone.icon}
            size={compact ? 16 : 20}
            color={milestone.isCompleted ? milestone.color : '#9ca3af'}
          />
        </View>
        <View style={styles.milestoneInfo}>
          <Text
            style={[
              styles.milestoneTitle,
              !milestone.isCompleted && styles.lockedText,
              compact && styles.compactText,
            ]}
          >
            {milestone.title}
          </Text>
          <Text
            style={[
              styles.milestoneDescription,
              compact && styles.compactSubtitle,
            ]}
          >
            {milestone.description}
          </Text>
        </View>
        <Text
          style={[
            styles.milestoneProgress,
            compact && styles.compactText,
          ]}
        >
          {milestone.currentValue}/{milestone.targetValue}
        </Text>
      </View>
      
      <ProgressBar
        progress={(milestone.currentValue / milestone.targetValue) * 100}
        color={milestone.color}
        height={compact ? 4 : 6}
        animated
        animatedValue={animatedValues.milestones[index]}
      />
    </TouchableOpacity>
  );

  const TabButton: React.FC<{
    tab: 'overview' | 'achievements' | 'milestones';
    label: string;
    icon: string;
  }> = ({ tab, label, icon }) => (
    <TouchableOpacity
      style={[styles.tabButton, selectedTab === tab && styles.activeTab]}
      onPress={() => setSelectedTab(tab)}
    >
      <Ionicons
        name={icon}
        size={16}
        color={selectedTab === tab ? '#ffffff' : '#6b7280'}
      />
      <Text
        style={[
          styles.tabText,
          selectedTab === tab && styles.activeTabText,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <View style={styles.compactStats}>
          <StatCard
            title="Sessions"
            value={stats.totalSessions.toString()}
            icon="checkmark-circle-outline"
            color="#22c55e"
          />
          <StatCard
            title="Streak"
            value={`${stats.currentStreak}d`}
            icon="flame-outline"
            color={getStreakColor(stats.currentStreak)}
          />
          <StatCard
            title="Time"
            value={formatTime(stats.totalMinutes)}
            icon="time-outline"
            color="#3b82f6"
          />
        </View>
        
        {showLevel && (
          <View style={styles.compactLevel}>
            <View style={styles.levelHeader}>
              <Ionicons name={getLevelIcon(stats.level)} size={16} color="#f59e0b" />
              <Text style={styles.compactLevelText}>Level {stats.level}</Text>
            </View>
            <ProgressBar
              progress={(stats.xp / (stats.xp + stats.xpToNextLevel)) * 100}
              color="#f59e0b"
              height={4}
              animated
              animatedValue={animatedValues.xp}
            />
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Level and XP */}
      {showLevel && (
        <View style={styles.levelCard}>
          <View style={styles.levelHeader}>
            <View style={styles.levelIconContainer}>
              <Ionicons name={getLevelIcon(stats.level)} size={24} color="#f59e0b" />
            </View>
            <View style={styles.levelInfo}>
              <Text style={styles.levelTitle}>Level {stats.level}</Text>
              <Text style={styles.xpText}>
                {stats.xp} / {stats.xp + stats.xpToNextLevel} XP
              </Text>
            </View>
          </View>
          <ProgressBar
            progress={(stats.xp / (stats.xp + stats.xpToNextLevel)) * 100}
            color="#f59e0b"
            height={8}
            animated
            animatedValue={animatedValues.xp}
          />
        </View>
      )}

      {/* Navigation Tabs */}
      <View style={styles.tabs}>
        <TabButton tab="overview" label="Overview" icon="analytics-outline" />
        {showAchievements && (
          <TabButton tab="achievements" label="Achievements" icon="trophy-outline" />
        )}
        {showMilestones && (
          <TabButton tab="milestones" label="Milestones" icon="flag-outline" />
        )}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {selectedTab === 'overview' && (
          <View style={styles.overview}>
            {/* Weekly Goal */}
            <View style={styles.weeklyGoal}>
              <View style={styles.goalHeader}>
                <Text style={styles.goalTitle}>Weekly Goal</Text>
                <Text style={styles.goalProgress}>
                  {stats.weeklyProgress}/{stats.weeklyGoal} sessions
                </Text>
              </View>
              <ProgressBar
                progress={(stats.weeklyProgress / stats.weeklyGoal) * 100}
                color="#22c55e"
                height={8}
                animated
                animatedValue={animatedValues.weekly}
              />
            </View>

            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              <StatCard
                title="Total Sessions"
                value={stats.totalSessions.toString()}
                icon="checkmark-circle-outline"
                color="#22c55e"
              />
              <StatCard
                title="Total Time"
                value={formatTime(stats.totalMinutes)}
                icon="time-outline"
                color="#3b82f6"
              />
              <StatCard
                title="Current Streak"
                value={`${stats.currentStreak} days`}
                subtitle={`Best: ${stats.longestStreak} days`}
                icon="flame-outline"
                color={getStreakColor(stats.currentStreak)}
              />
              <StatCard
                title="Avg Session"
                value={formatTime(stats.averageSessionLength)}
                icon="trending-up-outline"
                color="#8b5cf6"
              />
            </View>
          </View>
        )}

        {selectedTab === 'achievements' && showAchievements && (
          <View style={styles.achievementsContainer}>
            {achievements.map((achievement, index) => (
              <AchievementCard
                key={achievement.id}
                achievement={achievement}
                index={index}
              />
            ))}
          </View>
        )}

        {selectedTab === 'milestones' && showMilestones && (
          <View style={styles.milestonesContainer}>
            {milestones.map((milestone, index) => (
              <MilestoneCard
                key={milestone.id}
                milestone={milestone}
                index={index}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
  },
  compactContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
  },
  
  // Level styles
  levelCard: {
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  levelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  levelIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f59e0b',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  levelInfo: {
    flex: 1,
  },
  levelTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400e',
  },
  xpText: {
    fontSize: 12,
    color: '#d97706',
  },
  compactLevel: {
    marginTop: 8,
  },
  compactLevelText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#92400e',
    marginLeft: 6,
  },

  // Tab styles
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: '#3b82f6',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
    marginLeft: 4,
  },
  activeTabText: {
    color: '#ffffff',
  },

  content: {
    flex: 1,
  },

  // Overview styles
  overview: {
    flex: 1,
  },
  weeklyGoal: {
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  goalTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#166534',
  },
  goalProgress: {
    fontSize: 12,
    color: '#22c55e',
  },

  // Stats grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  compactStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  compactStatCard: {
    width: '30%',
    padding: 8,
    marginBottom: 0,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  statTitle: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 6,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 2,
  },
  compactValue: {
    fontSize: 14,
  },
  statSubtitle: {
    fontSize: 10,
    color: '#9ca3af',
  },
  compactSubtitle: {
    fontSize: 9,
  },
  compactText: {
    fontSize: 10,
  },
  statProgress: {
    marginTop: 6,
  },

  // Progress bar
  progressBarContainer: {
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },

  // Achievement styles
  achievementsContainer: {
    flex: 1,
  },
  achievementCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    opacity: 0.6,
  },
  compactAchievementCard: {
    padding: 8,
    marginBottom: 8,
  },
  unlockedAchievement: {
    opacity: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  achievementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  achievementIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  compactAchievementIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  achievementDescription: {
    fontSize: 12,
    color: '#6b7280',
  },
  unlockedDate: {
    fontSize: 10,
    color: '#22c55e',
    marginTop: 2,
  },
  lockedText: {
    color: '#9ca3af',
  },
  achievementProgress: {
    marginTop: 8,
  },
  progressText: {
    fontSize: 10,
    color: '#6b7280',
    marginBottom: 4,
  },

  // Milestone styles
  milestonesContainer: {
    flex: 1,
  },
  milestoneCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  compactMilestoneCard: {
    padding: 8,
    marginBottom: 8,
  },
  completedMilestone: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  milestoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  milestoneIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  compactMilestoneIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  milestoneInfo: {
    flex: 1,
  },
  milestoneTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  milestoneDescription: {
    fontSize: 12,
    color: '#6b7280',
  },
  milestoneProgress: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
});