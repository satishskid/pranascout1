import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Dimensions,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const { width: screenWidth } = Dimensions.get('window');

interface Activity {
  id: string;
  name: string;
  description: string;
  duration: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  type: 'pranayama' | 'meditation';
  icon: string;
  color: string;
  breathPattern?: {
    inhale: number;
    hold: number;
    exhale: number;
    pause: number;
  };
  benefits: string[];
  instructions: string[];
}

interface ActivitySelectorProps {
  visible: boolean;
  onClose: () => void;
  onSelectActivity: (activity: Activity) => void;
  selectedType?: 'pranayama' | 'meditation' | 'all';
}

export const ActivitySelector: React.FC<ActivitySelectorProps> = ({
  visible,
  onClose,
  onSelectActivity,
  selectedType = 'all',
}) => {
  const [activeTab, setActiveTab] = useState<'pranayama' | 'meditation' | 'all'>(selectedType);
  const [selectedDifficulty, setSelectedDifficulty] = useState<'all' | 'beginner' | 'intermediate' | 'advanced'>('all');

  const activities: Activity[] = [
    {
      id: 'nadi-shodhana',
      name: 'Nadi Shodhana',
      description: 'Alternate nostril breathing for balance and focus',
      duration: 10,
      difficulty: 'beginner',
      type: 'pranayama',
      icon: 'leaf-outline',
      color: '#22c55e',
      breathPattern: { inhale: 4, hold: 0, exhale: 4, pause: 0 },
      benefits: ['Balances nervous system', 'Improves focus', 'Reduces stress'],
      instructions: [
        'Sit comfortably with spine straight',
        'Use right thumb to close right nostril',
        'Inhale through left nostril for 4 counts',
        'Close left nostril with ring finger, release thumb',
        'Exhale through right nostril for 4 counts',
        'Inhale through right nostril, then switch',
      ],
    },
    {
      id: 'box-breathing',
      name: 'Box Breathing',
      description: 'Four-part breath for calm and concentration',
      duration: 15,
      difficulty: 'beginner',
      type: 'pranayama',
      icon: 'square-outline',
      color: '#3b82f6',
      breathPattern: { inhale: 4, hold: 4, exhale: 4, pause: 4 },
      benefits: ['Calms mind', 'Reduces anxiety', 'Improves concentration'],
      instructions: [
        'Sit or lie in a comfortable position',
        'Inhale slowly for 4 counts',
        'Hold your breath for 4 counts',
        'Exhale slowly for 4 counts',
        'Hold empty for 4 counts',
        'Repeat the cycle',
      ],
    },
    {
      id: 'ujjayi',
      name: 'Ujjayi Pranayama',
      description: 'Ocean breath for deep relaxation',
      duration: 20,
      difficulty: 'intermediate',
      type: 'pranayama',
      icon: 'water-outline',
      color: '#06b6d4',
      breathPattern: { inhale: 6, hold: 0, exhale: 6, pause: 0 },
      benefits: ['Deep relaxation', 'Improves focus', 'Generates internal heat'],
      instructions: [
        'Breathe through your nose only',
        'Slightly constrict throat muscles',
        'Create a soft ocean-like sound',
        'Inhale for 6 counts with the sound',
        'Exhale for 6 counts maintaining the sound',
        'Keep the breath steady and rhythmic',
      ],
    },
    {
      id: 'bhramari',
      name: 'Bhramari Pranayama',
      description: 'Humming bee breath for tranquility',
      duration: 12,
      difficulty: 'intermediate',
      type: 'pranayama',
      icon: 'musical-note-outline',
      color: '#f59e0b',
      breathPattern: { inhale: 4, hold: 0, exhale: 8, pause: 0 },
      benefits: ['Calms nervous system', 'Reduces stress', 'Improves concentration'],
      instructions: [
        'Sit comfortably with eyes closed',
        'Place thumbs in ears, index fingers above eyebrows',
        'Place remaining fingers over closed eyes',
        'Inhale normally through nose',
        'Exhale while humming like a bee',
        'Focus on the vibration and sound',
      ],
    },
    {
      id: '4-7-8-breathing',
      name: '4-7-8 Breathing',
      description: 'Natural tranquilizer for the nervous system',
      duration: 8,
      difficulty: 'advanced',
      type: 'pranayama',
      icon: 'timer-outline',
      color: '#8b5cf6',
      breathPattern: { inhale: 4, hold: 7, exhale: 8, pause: 0 },
      benefits: ['Promotes sleep', 'Reduces anxiety', 'Lowers heart rate'],
      instructions: [
        'Exhale completely through mouth',
        'Close mouth, inhale through nose for 4 counts',
        'Hold breath for 7 counts',
        'Exhale through mouth for 8 counts with whoosh sound',
        'This completes one cycle',
        'Repeat for 3-4 cycles initially',
      ],
    },
    {
      id: 'mindfulness-meditation',
      name: 'Mindfulness Meditation',
      description: 'Present moment awareness practice',
      duration: 20,
      difficulty: 'beginner',
      type: 'meditation',
      icon: 'flower-outline',
      color: '#ec4899',
      benefits: ['Increases awareness', 'Reduces stress', 'Improves emotional regulation'],
      instructions: [
        'Sit comfortably with back straight',
        'Close eyes or soften gaze',
        'Focus on your natural breath',
        'When mind wanders, gently return to breath',
        'Observe thoughts without judgment',
        'Maintain kind awareness throughout',
      ],
    },
    {
      id: 'body-scan',
      name: 'Body Scan Meditation',
      description: 'Progressive relaxation through body awareness',
      duration: 30,
      difficulty: 'beginner',
      type: 'meditation',
      icon: 'scan-outline',
      color: '#10b981',
      benefits: ['Deep relaxation', 'Body awareness', 'Stress relief'],
      instructions: [
        'Lie down in a comfortable position',
        'Start with toes of left foot',
        'Slowly move attention up through body',
        'Notice sensations without changing them',
        'Spend 1-2 minutes on each body part',
        'End with awareness of whole body',
      ],
    },
    {
      id: 'loving-kindness',
      name: 'Loving-Kindness Meditation',
      description: 'Cultivate compassion and goodwill',
      duration: 25,
      difficulty: 'intermediate',
      type: 'meditation',
      icon: 'heart-outline',
      color: '#f97316',
      benefits: ['Increases compassion', 'Improves relationships', 'Enhances well-being'],
      instructions: [
        'Sit comfortably and breathe naturally',
        'Start by sending love to yourself',
        'Repeat: "May I be happy, may I be healthy"',
        'Extend love to loved ones',
        'Include neutral people, then difficult people',
        'End by sending love to all beings',
      ],
    },
  ];

  const filteredActivities = activities.filter(activity => {
    const typeMatch = activeTab === 'all' || activity.type === activeTab;
    const difficultyMatch = selectedDifficulty === 'all' || activity.difficulty === selectedDifficulty;
    return typeMatch && difficultyMatch;
  });

  const getDifficultyColor = (difficulty: string) => {
    const colors = {
      beginner: '#22c55e',
      intermediate: '#f59e0b',
      advanced: '#ef4444',
    };
    return colors[difficulty] || '#6b7280';
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  const ActivityCard: React.FC<{ activity: Activity }> = ({ activity }) => (
    <TouchableOpacity
      style={[styles.activityCard, { borderLeftColor: activity.color }]}
      onPress={() => onSelectActivity(activity)}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.activityIcon, { backgroundColor: activity.color + '20' }]}>
          <Ionicons name={activity.icon} size={24} color={activity.color} />
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.activityName}>{activity.name}</Text>
          <Text style={styles.activityDescription}>{activity.description}</Text>
        </View>
        <View style={styles.cardMeta}>
          <Text style={styles.duration}>{formatDuration(activity.duration)}</Text>
          <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(activity.difficulty) + '20' }]}>
            <Text style={[styles.difficultyText, { color: getDifficultyColor(activity.difficulty) }]}>
              {activity.difficulty}
            </Text>
          </View>
        </View>
      </View>

      {activity.breathPattern && (
        <View style={styles.breathPattern}>
          <Text style={styles.patternLabel}>Breath Pattern:</Text>
          <Text style={styles.patternText}>
            {activity.breathPattern.inhale}-{activity.breathPattern.hold}-{activity.breathPattern.exhale}
            {activity.breathPattern.pause > 0 && `-${activity.breathPattern.pause}`}
          </Text>
        </View>
      )}

      <View style={styles.benefits}>
        <Text style={styles.benefitsLabel}>Benefits:</Text>
        <Text style={styles.benefitsText}>
          {activity.benefits.slice(0, 2).join(', ')}
          {activity.benefits.length > 2 && '...'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const TabButton: React.FC<{ type: 'all' | 'pranayama' | 'meditation'; label: string; icon: string }> = ({
    type,
    label,
    icon,
  }) => (
    <TouchableOpacity
      style={[styles.tabButton, activeTab === type && styles.activeTab]}
      onPress={() => setActiveTab(type)}
    >
      <Ionicons
        name={icon}
        size={20}
        color={activeTab === type ? '#ffffff' : '#6b7280'}
      />
      <Text style={[styles.tabText, activeTab === type && styles.activeTabText]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const DifficultyFilter: React.FC = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.difficultyFilter}>
      {(['all', 'beginner', 'intermediate', 'advanced'] as const).map((difficulty) => (
        <TouchableOpacity
          key={difficulty}
          style={[
            styles.difficultyButton,
            selectedDifficulty === difficulty && styles.activeDifficultyButton,
            difficulty !== 'all' && { borderColor: getDifficultyColor(difficulty) },
          ]}
          onPress={() => setSelectedDifficulty(difficulty)}
        >
          <Text
            style={[
              styles.difficultyButtonText,
              selectedDifficulty === difficulty && styles.activeDifficultyText,
              difficulty !== 'all' && selectedDifficulty === difficulty && { color: getDifficultyColor(difficulty) },
            ]}
          >
            {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="chevron-down" size={24} color="#6b7280" />
          </TouchableOpacity>
          <Text style={styles.title}>Choose Activity</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.tabs}>
          <TabButton type="all" label="All" icon="apps-outline" />
          <TabButton type="pranayama" label="Pranayama" icon="leaf-outline" />
          <TabButton type="meditation" label="Meditation" icon="flower-outline" />
        </View>

        <DifficultyFilter />

        <View style={styles.stats}>
          <Text style={styles.statsText}>
            {filteredActivities.length} activities • {Math.round(filteredActivities.reduce((sum, a) => sum + a.duration, 0) / filteredActivities.length)} min avg
          </Text>
        </View>

        <ScrollView style={styles.activitiesList} showsVerticalScrollIndicator={false}>
          {filteredActivities.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={48} color="#9ca3af" />
              <Text style={styles.emptyStateText}>No activities found</Text>
              <Text style={styles.emptyStateSubtext}>
                Try adjusting your filters to see more options
              </Text>
            </View>
          ) : (
            filteredActivities.map((activity) => (
              <ActivityCard key={activity.id} activity={activity} />
            ))
          )}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.customButton} onPress={() => {}}>
            <Ionicons name="add-circle-outline" size={20} color="#3b82f6" />
            <Text style={styles.customButtonText}>Create Custom Session</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  activeTab: {
    backgroundColor: '#3b82f6',
  },
  tabText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  activeTabText: {
    color: '#ffffff',
  },
  difficultyFilter: {
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    paddingLeft: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  difficultyButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
  },
  activeDifficultyButton: {
    backgroundColor: '#f3f4f6',
  },
  difficultyButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
  },
  activeDifficultyText: {
    color: '#111827',
  },
  stats: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  statsText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  activitiesList: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  activityCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardInfo: {
    flex: 1,
  },
  activityName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  activityDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  cardMeta: {
    alignItems: 'flex-end',
  },
  duration: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  breathPattern: {
    marginBottom: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  patternLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  patternText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
    fontFamily: 'monospace',
  },
  benefits: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  benefitsLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  benefitsText: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
    textAlign: 'center',
  },
  footer: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  customButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  customButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#3b82f6',
  },
});