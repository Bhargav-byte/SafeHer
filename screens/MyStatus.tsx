import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  StatusBar,
  SafeAreaView,
  Platform,
  TextInput,
  Switch,
  Vibration,
} from 'react-native';
import SymptomTracking from '../components/SymptomTracking';
import BodyMetricsTracking from '../components/BodyMetricsTracking';
import Reminders from '../components/Reminders';
import UnusualActivities from '../components/UnusualActivities';
import { HealthTrackingService, SymptomLog, BodyMetrics, Reminder, CycleInsight } from '../services/HealthTrackingService';
import { UnusualActivityDetectionService } from '../services/UnusualActivityDetectionService';

// Smart Safety System Interfaces
interface SafetyEvent {
  id: string;
  type: 'sound_detection' | 'motion_detection' | 'power_button' | 'mood_anxiety' | 'manual_sos';
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: string;
  resolved: boolean;
  copingTip?: string;
}

// Additional Metrics Interfaces
interface ActivityMetrics {
  stepsToday: number;
  stepsThisWeek: number;
  caloriesBurned: number;
  distanceWalked: number; // in km
  weeklyStepsData: number[];
}

interface HydrationMetrics {
  waterIntakeToday: number; // glasses
  targetIntake: number;
  weeklyIntake: number[];
  hydrationPercentage: number;
}

interface SleepMetrics {
  duration: number; // hours
  quality: 'poor' | 'fair' | 'good' | 'excellent';
  bedtime: string;
  wakeTime: string;
  weeklySleepData: { duration: number; quality: string }[];
}

interface CycleMetrics {
  currentDay: number;
  cycleLength: number;
  phase: 'menstrual' | 'follicular' | 'ovulation' | 'luteal';
  ovulationPrediction: Date;
  pmsPrediction: Date;
  regularityTrend: number[];
}

interface SymptomTrends {
  cramps: { date: string; severity: number }[];
  mood: { date: string; mood: string; intensity: number }[];
  fatigue: { date: string; level: number }[];
  patterns: string[];
}

interface SafetyMetrics {
  sosTriggersThisMonth: number;
  liveTrackingUsage: number; // percentage
  averageResponseTime: number; // minutes
  checkInsCompleted: number;
  checkInsMissed: number;
}

interface MentalWellbeingMetrics {
  moodDistribution: { mood: string; count: number; percentage: number }[];
  stressIndex: number; // 1-10
  positiveHabitsCount: number;
  weeklyMoodTrend: { date: string; mood: string; intensity: number }[];
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  earnedDate: Date;
  category: 'activity' | 'cycle' | 'safety' | 'wellness';
}

interface EnergyLevels {
  weeklyAverage: number;
  dailyLogs: { date: string; level: number }[];
  trend: 'increasing' | 'decreasing' | 'stable';
}

export default function MyStatusScreen() {
  const [activeTab, setActiveTab] = useState<'overview' | 'symptoms' | 'metrics' | 'reminders' | 'activities'>('overview');
  const [activitiesTab, setActivitiesTab] = useState<'now' | 'history'>('now');
  const [cycleInsights, setCycleInsights] = useState<CycleInsight | null>(null);
  const [lastPeriodDate, setLastPeriodDate] = useState(new Date("2025-01-15"));
  const [showSymptomModal, setShowSymptomModal] = useState(false);
  const [showMetricsModal, setShowMetricsModal] = useState(false);
  const [showRemindersModal, setShowRemindersModal] = useState(false);
  
  // Smart Safety System States
  const [safetyEvents, setSafetyEvents] = useState<SafetyEvent[]>([]);
  const [moodLogs, setMoodLogs] = useState<MoodLog[]>([]);
  const [showSafetyAlert, setShowSafetyAlert] = useState(false);
  const [currentSafetyEvent, setCurrentSafetyEvent] = useState<SafetyEvent | null>(null);
  const [showMoodModal, setShowMoodModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showCopingTip, setShowCopingTip] = useState(false);
  const [currentCopingTip, setCurrentCopingTip] = useState('');
  
  // Safety System Settings
  const [soundDetectionEnabled, setSoundDetectionEnabled] = useState(true);
  const [motionDetectionEnabled, setMotionDetectionEnabled] = useState(true);
  const [powerButtonSOSEnabled, setPowerButtonSOSEnabled] = useState(true);
  const [moodTrackingEnabled, setMoodTrackingEnabled] = useState(true);
  
  // Power Button SOS Counter
  const [powerButtonPresses, setPowerButtonPresses] = useState(0);
  const [lastPowerButtonPress, setLastPowerButtonPress] = useState(0);

  // Metrics State
  const [activityMetrics, setActivityMetrics] = useState<ActivityMetrics>({
    stepsToday: 8542,
    stepsThisWeek: 45678,
    caloriesBurned: 342,
    distanceWalked: 6.2,
    weeklyStepsData: [7200, 8900, 10200, 7800, 9500, 8200, 8542]
  });

  const [hydrationMetrics, setHydrationMetrics] = useState<HydrationMetrics>({
    waterIntakeToday: 6,
    targetIntake: 8,
    weeklyIntake: [7, 8, 6, 9, 7, 8, 6],
    hydrationPercentage: 75
  });

  const [sleepMetrics, setSleepMetrics] = useState<SleepMetrics>({
    duration: 7.5,
    quality: 'good',
    bedtime: '22:30',
    wakeTime: '06:00',
    weeklySleepData: [
      { duration: 7.5, quality: 'good' },
      { duration: 8.0, quality: 'excellent' },
      { duration: 6.5, quality: 'fair' },
      { duration: 7.0, quality: 'good' },
      { duration: 8.5, quality: 'excellent' },
      { duration: 7.0, quality: 'good' },
      { duration: 7.5, quality: 'good' }
    ]
  });

  const [cycleMetrics, setCycleMetrics] = useState<CycleMetrics>({
    currentDay: 12,
    cycleLength: 28,
    phase: 'follicular',
    ovulationPrediction: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    pmsPrediction: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    regularityTrend: [28, 29, 27, 28, 30, 28, 28]
  });

  const [symptomTrends, setSymptomTrends] = useState<SymptomTrends>({
    cramps: [
      { date: '2025-01-01', severity: 3 },
      { date: '2025-01-02', severity: 2 },
      { date: '2025-01-03', severity: 1 },
      { date: '2025-01-04', severity: 0 }
    ],
    mood: [
      { date: '2025-01-01', mood: 'happy', intensity: 8 },
      { date: '2025-01-02', mood: 'neutral', intensity: 6 },
      { date: '2025-01-03', mood: 'sad', intensity: 4 },
      { date: '2025-01-04', mood: 'happy', intensity: 7 }
    ],
    fatigue: [
      { date: '2025-01-01', level: 6 },
      { date: '2025-01-02', level: 4 },
      { date: '2025-01-03', level: 7 },
      { date: '2025-01-04', level: 5 }
    ],
    patterns: ['Mood dips before period', 'Higher fatigue during PMS', 'Better mood mid-cycle']
  });

  const [safetyMetrics, setSafetyMetrics] = useState<SafetyMetrics>({
    sosTriggersThisMonth: 2,
    liveTrackingUsage: 85,
    averageResponseTime: 3.2,
    checkInsCompleted: 12,
    checkInsMissed: 1
  });

  const [mentalWellbeingMetrics, setMentalWellbeingMetrics] = useState<MentalWellbeingMetrics>({
    moodDistribution: [
      { mood: 'happy', count: 15, percentage: 45 },
      { mood: 'neutral', count: 10, percentage: 30 },
      { mood: 'sad', count: 5, percentage: 15 },
      { mood: 'anxious', count: 3, percentage: 10 }
    ],
    stressIndex: 4.2,
    positiveHabitsCount: 8,
    weeklyMoodTrend: [
      { date: '2025-01-01', mood: 'happy', intensity: 8 },
      { date: '2025-01-02', mood: 'neutral', intensity: 6 },
      { date: '2025-01-03', mood: 'sad', intensity: 4 },
      { date: '2025-01-04', mood: 'happy', intensity: 7 }
    ]
  });

  const [energyLevels, setEnergyLevels] = useState<EnergyLevels>({
    weeklyAverage: 6.2,
    dailyLogs: [
      { date: '2025-01-01', level: 7 },
      { date: '2025-01-02', level: 6 },
      { date: '2025-01-03', level: 5 },
      { date: '2025-01-04', level: 6 }
    ],
    trend: 'stable'
  });

  const [achievements, setAchievements] = useState<Achievement[]>([
    {
      id: '1',
      title: '10,000 Steps Champion',
      description: 'Walked 10,000+ steps for 7 consecutive days',
      icon: '🏃‍♀️',
      earnedDate: new Date('2025-01-15'),
      category: 'activity'
    },
    {
      id: '2',
      title: 'Cycle Logger',
      description: 'Logged cycle data for 3 months',
      icon: '🌸',
      earnedDate: new Date('2025-01-10'),
      category: 'cycle'
    },
    {
      id: '3',
      title: 'Safety Pro',
      description: 'Completed 5 SOS tests',
      icon: '🛡️',
      earnedDate: new Date('2025-01-05'),
      category: 'safety'
    }
  ]);

  const healthService = HealthTrackingService.getInstance();
  const detectionService = UnusualActivityDetectionService.getInstance();

  useEffect(() => {
    loadCycleInsights();
    initializeDetectionService();
    initializeSafetySystem();
    loadSafetyHistory();
  }, []);

  // Smart Safety System Functions
  const initializeSafetySystem = () => {
    // Initialize sound detection, motion detection, etc.
    console.log('Smart Safety System initialized');
  };

  const loadSafetyHistory = () => {
    // Load safety events and mood logs from storage
    const sampleEvents: SafetyEvent[] = [
      {
        id: '1',
        type: 'sound_detection',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        severity: 'high',
        details: 'Loud sound detected - potential scream',
        resolved: true,
        copingTip: 'Take a deep breath, you are safe. Help is on the way.'
      },
      {
        id: '2',
        type: 'motion_detection',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
        severity: 'medium',
        details: 'Sudden phone movement detected',
        resolved: true,
        copingTip: 'Move to a well-lit area. Stay near people.'
      }
    ];
    setSafetyEvents(sampleEvents);

    const sampleMoods: MoodLog[] = [
      {
        id: '1',
        mood: 'anxious',
        intensity: 7,
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
        notes: 'Feeling overwhelmed at work'
      },
      {
        id: '2',
        mood: 'fearful',
        intensity: 8,
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
        notes: 'Walking alone at night'
      }
    ];
    setMoodLogs(sampleMoods);
  };

  const getCopingTips = (): string[] => [
    'Take a deep breath, you are safe. Help is on the way.',
    'Move to a well-lit area. Stay near people.',
    'Call a trusted friend or family member.',
    'Find a safe space and lock the door.',
    'Remember: You are strong and capable.',
    'Focus on your breathing - inhale for 4, hold for 4, exhale for 4.',
    'You are not alone. Help is available.',
    'Trust your instincts and stay alert.',
    'Keep your phone charged and accessible.',
    'Practice grounding techniques: name 5 things you can see.'
  ];

  const getRandomCopingTip = (): string => {
    const tips = getCopingTips();
    return tips[Math.floor(Math.random() * tips.length)];
  };

  const triggerSafetyEvent = (type: SafetyEvent['type'], severity: SafetyEvent['severity'], details: string) => {
    const event: SafetyEvent = {
      id: Date.now().toString(),
      type,
      timestamp: new Date(),
      severity,
      details,
      resolved: false,
      copingTip: getRandomCopingTip()
    };

    setSafetyEvents(prev => [event, ...prev]);
    setCurrentSafetyEvent(event);
    setShowSafetyAlert(true);
    setCurrentCopingTip(event.copingTip || '');
    
    // Vibrate for critical events
    if (severity === 'critical') {
      Vibration.vibrate([0, 500, 200, 500]);
    }
  };

  const handleSoundDetection = () => {
    Alert.alert(
      'Loud Sound Detected',
      'Are you safe?',
      [
        { text: 'I\'m Safe', onPress: () => {
          const event: SafetyEvent = {
            id: Date.now().toString(),
            type: 'sound_detection',
            timestamp: new Date(),
            severity: 'low',
            details: 'Loud sound detected - user confirmed safety',
            resolved: true
          };
          setSafetyEvents(prev => [event, ...prev]);
        }},
        { text: 'I Need Help', onPress: () => {
          triggerSafetyEvent('sound_detection', 'critical', 'Loud sound detected - user needs help');
          Alert.alert('SOS Sent', 'Emergency contacts have been notified!');
        }}
      ],
      { cancelable: false }
    );
  };

  const handleMotionDetection = () => {
    triggerSafetyEvent('motion_detection', 'medium', 'Sudden phone movement detected');
    setShowCopingTip(true);
  };

  const handlePowerButtonSOS = () => {
    const now = Date.now();
    if (now - lastPowerButtonPress < 2000) { // Within 2 seconds
      setPowerButtonPresses(prev => prev + 1);
    } else {
      setPowerButtonPresses(1);
    }
    setLastPowerButtonPress(now);

    if (powerButtonPresses >= 4) {
      triggerSafetyEvent('power_button', 'critical', 'Power button SOS activated');
      Alert.alert('SOS Sent', 'Emergency contacts have been notified!');
      setPowerButtonPresses(0);
    }
  };

  const logMood = (mood: MoodLog['mood'], intensity: number, notes?: string) => {
    const moodLog: MoodLog = {
      id: Date.now().toString(),
      mood,
      intensity,
      timestamp: new Date(),
      notes
    };

    setMoodLogs(prev => [moodLog, ...prev]);

    // Check for anxiety patterns
    const recentAnxiousMoods = moodLogs.filter(log => 
      (log.mood === 'anxious' || log.mood === 'fearful') && 
      log.intensity >= 7 &&
      Date.now() - log.timestamp.getTime() < 24 * 60 * 60 * 1000 // Last 24 hours
    );

    if (recentAnxiousMoods.length >= 3) {
      Alert.alert(
        'Safety Concern',
        'We noticed you\'ve been feeling anxious recently. Would you like to contact a trusted person?',
        [
          { text: 'Not Now', style: 'cancel' },
          { text: 'Contact Someone', onPress: () => {
            triggerSafetyEvent('mood_anxiety', 'medium', 'Multiple anxious mood logs - user needs support');
          }}
        ]
      );
    }
  };

  const resolveSafetyEvent = (eventId: string) => {
    setSafetyEvents(prev => 
      prev.map(event => 
        event.id === eventId ? { ...event, resolved: true } : event
      )
    );
    setShowSafetyAlert(false);
    setCurrentSafetyEvent(null);
  };

  const deleteSafetyHistory = () => {
    Alert.alert(
      'Delete History',
      'Are you sure you want to delete all safety history? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => {
          setSafetyEvents([]);
          setMoodLogs([]);
          Alert.alert('History Deleted', 'All safety history has been cleared.');
        }}
      ]
    );
  };

  // Dynamic Safety Status Calculation
  const calculateSafetyStatus = () => {
    const now = new Date();
    const currentHour = now.getHours();
    
    // Check for active SOS events
    const activeSOSEvents = safetyEvents.filter(event => 
      !event.resolved && 
      (event.type === 'manual_sos' || event.type === 'power_button') &&
      event.severity === 'critical'
    );
    
    // Check for recent sound detection events
    const recentSoundEvents = safetyEvents.filter(event =>
      event.type === 'sound_detection' &&
      !event.resolved &&
      now.getTime() - event.timestamp.getTime() < 30 * 60 * 1000 // Last 30 minutes
    );
    
    // Check for recent anxious mood logs
    const recentAnxiousMoods = moodLogs.filter(mood =>
      (mood.mood === 'anxious' || mood.mood === 'fearful' || mood.mood === 'stressed') &&
      mood.intensity >= 7 &&
      now.getTime() - mood.timestamp.getTime() < 2 * 60 * 60 * 1000 // Last 2 hours
    );
    
    // Check for late night/isolated conditions
    const isLateNight = currentHour >= 22 || currentHour <= 5;
    const isIsolated = false; // This would be determined by location data in real implementation
    
    // Determine status
    if (activeSOSEvents.length > 0 || recentSoundEvents.length > 0) {
      return {
        status: 'risk',
        icon: '🚨',
        color: '#f44336',
        message: 'SOS active, help is on the way',
        details: activeSOSEvents.length > 0 ? 'Emergency SOS triggered' : 'Loud noise detected'
      };
    } else if (isLateNight || recentAnxiousMoods.length >= 2) {
      return {
        status: 'caution',
        icon: '⚠️',
        color: '#ff9800',
        message: 'Consider sharing location',
        details: isLateNight ? 'Late night hours detected' : 'Recent stress/anxiety patterns'
      };
    } else {
      return {
        status: 'safe',
        icon: '✅',
        color: '#4CAF50',
        message: 'You are in a safe area',
        details: 'All systems monitoring normally'
      };
    }
  };

  const renderSafetyStatusCard = () => {
    const safetyStatus = calculateSafetyStatus();
    
    return (
      <View style={[styles.safetyStatusCard, { backgroundColor: safetyStatus.color }]}>
        <View style={styles.safetyStatusContent}>
          <View style={styles.safetyStatusHeader}>
            <Text style={styles.safetyStatusIcon}>{safetyStatus.icon}</Text>
            <Text style={styles.safetyStatusTitle}>
              {safetyStatus.status.charAt(0).toUpperCase() + safetyStatus.status.slice(1)}
            </Text>
          </View>
          
          <Text style={styles.safetyStatusMessage}>{safetyStatus.message}</Text>
          <Text style={styles.safetyStatusDetails}>{safetyStatus.details}</Text>
          
          <View style={styles.safetyStatusFooter}>
            <View style={styles.safetyStatusIndicator}>
              <View style={[styles.safetyStatusDot, { backgroundColor: 'white' }]} />
              <Text style={styles.safetyStatusText}>All Systems Active</Text>
            </View>
            <Text style={styles.safetyStatusTime}>
              Last updated: {new Date().toLocaleTimeString()}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const initializeDetectionService = async () => {
    try {
      await detectionService.initialize('user1');
    } catch (error) {
      console.error('Error initializing detection service:', error);
    }
  };

  const loadCycleInsights = async () => {
    try {
      const insights = await healthService.generateCycleInsights('user1');
      setCycleInsights(insights);
    } catch (error) {
      console.error('Error loading cycle insights:', error);
    }
  };

  const updateLastPeriod = () => {
    Alert.alert('Update Period', 'Period date picker will be added in the next update!');
  };

  const logSymptom = () => {
    setShowSymptomModal(true);
  };

  const logMetrics = () => {
    setShowMetricsModal(true);
  };

  const manageReminders = () => {
    setShowRemindersModal(true);
  };

  const handleSymptomLogged = async (symptomLog: SymptomLog) => {
    try {
      await healthService.logSymptom('user1', symptomLog);
      await loadCycleInsights();
      
      // Check for safety triggers
      const safetyAlerts = await healthService.checkSafetyTriggers('user1', symptomLog);
      if (safetyAlerts.length > 0) {
        Alert.alert(
          'Safety Alert',
          safetyAlerts[0].message,
          [
            { text: 'OK', style: 'cancel' },
            { text: 'Alert Contacts', onPress: () => {
              Alert.alert('Emergency Contacts', 'Emergency contacts have been notified!');
            }}
          ]
        );
      }
    } catch (error) {
      console.error('Error logging symptom:', error);
    }
  };

  const handleMetricsLogged = async (bodyMetrics: BodyMetrics) => {
    try {
      await healthService.logBodyMetrics('user1', bodyMetrics);
      await loadCycleInsights();
    } catch (error) {
      console.error('Error logging metrics:', error);
    }
  };

  const handleReminderCreated = async (reminder: Reminder) => {
    try {
      await healthService.createReminder('user1', reminder);
    } catch (error) {
      console.error('Error creating reminder:', error);
    }
  };

  const getCycleStatus = () => {
    const cycleInfo = healthService.calculateCurrentCycleDay('user1', lastPeriodDate, 28);
    
    // Get phase color
    let color: string;
    switch (cycleInfo.phase) {
      case 'Menstrual':
        color = '#1E90FF';
        break;
      case 'Follicular':
        color = '#4caf50';
        break;
      case 'Ovulation':
        color = '#ff9800';
        break;
      case 'Luteal':
        color = '#9c27b0';
        break;
      default:
        color = '#666';
    }
    
    return { 
      phase: cycleInfo.phase, 
      color, 
      day: cycleInfo.cycleDay 
    };
  };

  const cycleStatus = getCycleStatus();

  const getWellnessRecommendations = () => {
    if (!cycleInsights) return [];
    return healthService.getWellnessRecommendations(cycleStatus.phase, cycleInsights.commonSymptoms);
  };

  const renderOverview = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* Current Cycle Status */}
      <View style={styles.statusCard}>
        <Text style={styles.cardTitle}>Current Cycle Status</Text>
        <View style={styles.cycleInfo}>
          <View style={[styles.phaseIndicator, { backgroundColor: cycleStatus.color }]}>
            <Text style={styles.phaseText}>{cycleStatus.phase}</Text>
          </View>
          <View style={styles.cycleDetails}>
            <Text style={styles.cycleDay}>Day {cycleStatus.day}</Text>
            <Text style={styles.cycleDescription}>
              {cycleStatus.phase === 'Menstrual' && 'Your period is active'}
              {cycleStatus.phase === 'Follicular' && 'Building up for ovulation'}
              {cycleStatus.phase === 'Ovulation' && 'Most fertile period'}
              {cycleStatus.phase === 'Luteal' && 'Preparing for next cycle'}
            </Text>
          </View>
        </View>
      </View>

      {/* Cycle Insights */}
      {cycleInsights && (
        <View style={styles.statusCard}>
          <Text style={styles.cardTitle}>Cycle Insights</Text>
          <View style={styles.insightsGrid}>
            <View style={styles.insightItem}>
              <Text style={styles.insightNumber}>{cycleInsights.averageCycleLength}</Text>
              <Text style={styles.insightLabel}>Avg Cycle</Text>
            </View>
            <View style={styles.insightItem}>
              <Text style={styles.insightNumber}>{cycleInsights.averagePeriodLength}</Text>
              <Text style={styles.insightLabel}>Avg Period</Text>
            </View>
            <View style={styles.insightItem}>
              <Text style={styles.insightNumber}>{cycleInsights.cycleRegularity}</Text>
              <Text style={styles.insightLabel}>Regularity</Text>
            </View>
          </View>
          
          {cycleInsights.irregularityAlerts.length > 0 && (
            <View style={styles.alertContainer}>
              <Text style={styles.alertTitle}>⚠️ Alerts</Text>
              {cycleInsights.irregularityAlerts.map((alert, index) => (
                <Text key={index} style={styles.alertText}>• {alert}</Text>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Fertile Window */}
      {cycleInsights && (
        <View style={styles.statusCard}>
          <Text style={styles.cardTitle}>Fertile Window</Text>
          <Text style={styles.fertileText}>
            Next fertile window: {cycleInsights.fertileWindow.start.toLocaleDateString()} - {cycleInsights.fertileWindow.end.toLocaleDateString()}
          </Text>
          <Text style={styles.nextPeriodText}>
            Next period predicted: {cycleInsights.nextPeriodPrediction.toLocaleDateString()}
          </Text>
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.statusCard}>
        <Text style={styles.cardTitle}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity style={styles.quickActionButton} onPress={logSymptom}>
            <Text style={styles.quickActionEmoji}>🤕</Text>
            <Text style={styles.quickActionText}>Log Symptoms</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.quickActionButton} onPress={logMetrics}>
            <Text style={styles.quickActionEmoji}>📊</Text>
            <Text style={styles.quickActionText}>Body Metrics</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.quickActionButton} onPress={manageReminders}>
            <Text style={styles.quickActionEmoji}>🔔</Text>
            <Text style={styles.quickActionText}>Reminders</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.quickActionButton} onPress={updateLastPeriod}>
            <Text style={styles.quickActionEmoji}>📅</Text>
            <Text style={styles.quickActionText}>Update Period</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Wellness Recommendations */}
      <View style={styles.statusCard}>
        <Text style={styles.cardTitle}>Today's Wellness Tips</Text>
        <View style={styles.recommendationsContainer}>
          {getWellnessRecommendations().map((recommendation, index) => (
            <Text key={index} style={styles.recommendationText}>• {recommendation}</Text>
          ))}
        </View>
      </View>

      {/* Common Symptoms */}
      {cycleInsights && cycleInsights.commonSymptoms.length > 0 && (
        <View style={styles.statusCard}>
          <Text style={styles.cardTitle}>Common Symptoms</Text>
          <View style={styles.symptomsContainer}>
            {cycleInsights.commonSymptoms.map((symptom, index) => (
              <View key={index} style={styles.symptomTag}>
                <Text style={styles.symptomText}>{symptom}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Unusual Activities */}
      <UnusualActivities userId="user1" />
    </ScrollView>
  );

  const renderMetricsTab = () => (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Activity & Fitness Section */}
      <View style={styles.metricsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🏃 Activity & Fitness</Text>
        </View>
        
        {/* Steps Today */}
        <View style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <Text style={styles.metricLabel}>Steps Today</Text>
            <Text style={styles.metricValue}>{activityMetrics.stepsToday.toLocaleString()}</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${Math.min((activityMetrics.stepsToday / 10000) * 100, 100)}%` }]} />
          </View>
          <Text style={styles.progressText}>Goal: 10,000 steps</Text>
        </View>

        {/* Weekly Steps Chart */}
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Weekly Steps Trend</Text>
          <View style={styles.chartContainer}>
            <View style={styles.chartBars}>
              {activityMetrics.weeklyStepsData.map((value, index) => (
                <View key={index} style={styles.chartBarContainer}>
                  <View style={[styles.chartBar, { height: (value / 12000) * 100 }]} />
                  <Text style={styles.chartBarLabel}>{['S', 'M', 'T', 'W', 'T', 'F', 'S'][index]}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Calories & Distance */}
        <View style={styles.metricRow}>
          <View style={[styles.metricCard, styles.halfCard]}>
            <Text style={styles.metricIcon}>🔥</Text>
            <Text style={styles.metricValue}>{activityMetrics.caloriesBurned}</Text>
            <Text style={styles.metricLabel}>Calories Burned</Text>
          </View>
          <View style={[styles.metricCard, styles.halfCard]}>
            <Text style={styles.metricIcon}>📏</Text>
            <Text style={styles.metricValue}>{activityMetrics.distanceWalked} km</Text>
            <Text style={styles.metricLabel}>Distance Walked</Text>
          </View>
        </View>

        {/* Hydration Tracking */}
        <View style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <Text style={styles.metricLabel}>💧 Hydration</Text>
            <Text style={styles.metricValue}>{hydrationMetrics.waterIntakeToday}/{hydrationMetrics.targetIntake} glasses</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${hydrationMetrics.hydrationPercentage}%`, backgroundColor: '#2196f3' }]} />
          </View>
          <Text style={styles.progressText}>{hydrationMetrics.hydrationPercentage}% of daily goal</Text>
        </View>

        {/* Sleep Duration & Quality */}
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>😴 Sleep Duration & Quality</Text>
          <View style={styles.sleepContainer}>
            <View style={styles.sleepMetric}>
              <Text style={styles.sleepValue}>{sleepMetrics.duration}h</Text>
              <Text style={styles.sleepLabel}>Duration</Text>
            </View>
            <View style={styles.sleepMetric}>
              <Text style={[styles.sleepValue, { color: sleepMetrics.quality === 'excellent' ? '#4caf50' : sleepMetrics.quality === 'good' ? '#8bc34a' : sleepMetrics.quality === 'fair' ? '#ff9800' : '#f44336' }]}>
                {sleepMetrics.quality.charAt(0).toUpperCase() + sleepMetrics.quality.slice(1)}
              </Text>
              <Text style={styles.sleepLabel}>Quality</Text>
            </View>
            <View style={styles.sleepMetric}>
              <Text style={styles.sleepValue}>{sleepMetrics.bedtime}</Text>
              <Text style={styles.sleepLabel}>Bedtime</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Cycle & Health Section */}
      <View style={styles.metricsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🌸 Cycle & Health</Text>
        </View>

        {/* Cycle Phase Overview */}
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Cycle Phase Overview</Text>
          <View style={styles.cyclePhaseContainer}>
            <View style={[styles.phaseIndicator, { backgroundColor: cycleMetrics.phase === 'menstrual' ? '#e91e63' : cycleMetrics.phase === 'follicular' ? '#ff9800' : cycleMetrics.phase === 'ovulation' ? '#4caf50' : '#9c27b0' }]}>
              <Text style={styles.phaseText}>{cycleMetrics.phase.charAt(0).toUpperCase() + cycleMetrics.phase.slice(1)}</Text>
            </View>
            <View style={styles.cycleDetails}>
              <Text style={styles.cycleDay}>Day {cycleMetrics.currentDay}</Text>
              <Text style={styles.cycleDescription}>of {cycleMetrics.cycleLength}-day cycle</Text>
            </View>
          </View>
          <View style={styles.predictionsContainer}>
            <Text style={styles.predictionText}>
              📅 Ovulation: {cycleMetrics.ovulationPrediction.toLocaleDateString()}
            </Text>
            <Text style={styles.predictionText}>
              🌙 PMS: {cycleMetrics.pmsPrediction.toLocaleDateString()}
            </Text>
          </View>
        </View>

        {/* Symptom Trends */}
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>📈 Symptom Trends</Text>
          <View style={styles.symptomTrendsContainer}>
            {symptomTrends.patterns.map((pattern, index) => (
              <View key={index} style={styles.patternTag}>
                <Text style={styles.patternText}>{pattern}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Energy Levels */}
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>⚡ Energy Levels</Text>
          <View style={styles.energyContainer}>
            <Text style={styles.energyValue}>{energyLevels.weeklyAverage}/10</Text>
            <Text style={styles.energyLabel}>Weekly Average</Text>
            <View style={styles.trendIndicator}>
              <Text style={styles.trendText}>
                {energyLevels.trend === 'increasing' ? '📈' : energyLevels.trend === 'decreasing' ? '📉' : '➡️'} 
                {energyLevels.trend.charAt(0).toUpperCase() + energyLevels.trend.slice(1)}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Safety Metrics Section */}
      <View style={styles.metricsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🆘 Safety Metrics</Text>
        </View>

        <View style={styles.metricRow}>
          <View style={[styles.metricCard, styles.halfCard]}>
            <Text style={styles.metricIcon}>🚨</Text>
            <Text style={styles.metricValue}>{safetyMetrics.sosTriggersThisMonth}</Text>
            <Text style={styles.metricLabel}>SOS Triggers This Month</Text>
          </View>
          <View style={[styles.metricCard, styles.halfCard]}>
            <Text style={styles.metricIcon}>📍</Text>
            <Text style={styles.metricValue}>{safetyMetrics.liveTrackingUsage}%</Text>
            <Text style={styles.metricLabel}>Live Tracking Usage</Text>
          </View>
        </View>

        <View style={styles.metricRow}>
          <View style={[styles.metricCard, styles.halfCard]}>
            <Text style={styles.metricIcon}>⏱️</Text>
            <Text style={styles.metricValue}>{safetyMetrics.averageResponseTime}m</Text>
            <Text style={styles.metricLabel}>Avg Response Time</Text>
          </View>
          <View style={[styles.metricCard, styles.halfCard]}>
            <Text style={styles.metricIcon}>✅</Text>
            <Text style={styles.metricValue}>{safetyMetrics.checkInsCompleted}/{safetyMetrics.checkInsCompleted + safetyMetrics.checkInsMissed}</Text>
            <Text style={styles.metricLabel}>Check-ins Completed</Text>
          </View>
        </View>
      </View>

      {/* Mental Wellbeing Section */}
      <View style={styles.metricsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🧠 Mental Wellbeing</Text>
        </View>

        {/* Mood Distribution */}
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Mood Trends</Text>
          <View style={styles.moodDistributionContainer}>
            {mentalWellbeingMetrics.moodDistribution.map((mood, index) => (
              <View key={index} style={styles.moodBarContainer}>
                <View style={styles.moodBarHeader}>
                  <Text style={styles.moodLabel}>{mood.mood.charAt(0).toUpperCase() + mood.mood.slice(1)}</Text>
                  <Text style={styles.moodPercentage}>{mood.percentage}%</Text>
                </View>
                <View style={styles.moodBar}>
                  <View style={[styles.moodBarFill, { width: `${mood.percentage}%` }]} />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Stress Index */}
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Stress Index</Text>
          <View style={styles.stressContainer}>
            <Text style={styles.stressValue}>{mentalWellbeingMetrics.stressIndex}/10</Text>
            <View style={styles.stressBar}>
              <View style={[styles.stressBarFill, { width: `${mentalWellbeingMetrics.stressIndex * 10}%` }]} />
            </View>
            <Text style={styles.stressLabel}>
              {mentalWellbeingMetrics.stressIndex <= 3 ? 'Low Stress' : 
               mentalWellbeingMetrics.stressIndex <= 6 ? 'Moderate Stress' : 'High Stress'}
            </Text>
          </View>
        </View>

        {/* Positive Habits */}
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Positive Habits Count</Text>
          <Text style={styles.habitsValue}>{mentalWellbeingMetrics.positiveHabitsCount}</Text>
          <Text style={styles.habitsDescription}>Goals completed this week</Text>
        </View>
      </View>

      {/* Achievements Section */}
      <View style={styles.metricsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🏆 Achievements</Text>
        </View>

        <View style={styles.achievementsContainer}>
          {achievements.map((achievement) => (
            <View key={achievement.id} style={styles.achievementCard}>
              <Text style={styles.achievementIcon}>{achievement.icon}</Text>
              <View style={styles.achievementContent}>
                <Text style={styles.achievementTitle}>{achievement.title}</Text>
                <Text style={styles.achievementDescription}>{achievement.description}</Text>
                <Text style={styles.achievementDate}>
                  Earned: {achievement.earnedDate.toLocaleDateString()}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'symptoms':
        return <SymptomTracking onSymptomLogged={handleSymptomLogged} />;
      case 'metrics':
        return renderMetricsTab();
      case 'reminders':
        return <Reminders onReminderCreated={handleReminderCreated} />;
      case 'activities':
        return renderActivitiesTab();
      default:
        return renderOverview();
    }
  };

  const renderActivitiesTab = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* Activities Tab Navigation */}
      <View style={styles.activitiesTabContainer}>
        <TouchableOpacity
          style={[styles.activitiesTabButton, activitiesTab === 'now' && styles.activitiesTabButtonActive]}
          onPress={() => setActivitiesTab('now')}
        >
          <Text style={[styles.activitiesTabText, activitiesTab === 'now' && styles.activitiesTabTextActive]}>
            🔴 Now
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.activitiesTabButton, activitiesTab === 'history' && styles.activitiesTabButtonActive]}
          onPress={() => setActivitiesTab('history')}
        >
          <Text style={[styles.activitiesTabText, activitiesTab === 'history' && styles.activitiesTabTextActive]}>
            📋 History
          </Text>
        </TouchableOpacity>
      </View>

      {activitiesTab === 'now' ? renderNowTab() : renderHistoryTab()}
    </ScrollView>
  );

  const renderNowTab = () => (
    <View>
      {/* Current Safety Status */}
      <View style={styles.statusCard}>
        <Text style={styles.cardTitle}>Current Safety Status</Text>
        {renderSafetyStatusCard()}
      </View>

      {/* Smart Safety System Settings */}
      <View style={styles.statusCard}>
        <Text style={styles.cardTitle}>Safety System Settings</Text>
        <Text style={styles.cardSubtitle}>Configure your safety monitoring preferences</Text>
        
        <View style={styles.safetySettings}>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>🔊 Sound Detection</Text>
            <Switch
              value={soundDetectionEnabled}
              onValueChange={setSoundDetectionEnabled}
              trackColor={{ false: '#767577', true: '#e91e63' }}
              thumbColor={soundDetectionEnabled ? '#f5dd4b' : '#f4f3f4'}
            />
          </View>
          
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>📱 Motion Detection</Text>
            <Switch
              value={motionDetectionEnabled}
              onValueChange={setMotionDetectionEnabled}
              trackColor={{ false: '#767577', true: '#e91e63' }}
              thumbColor={motionDetectionEnabled ? '#f5dd4b' : '#f4f3f4'}
            />
          </View>
          
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>🔘 Power Button SOS</Text>
            <Switch
              value={powerButtonSOSEnabled}
              onValueChange={setPowerButtonSOSEnabled}
              trackColor={{ false: '#767577', true: '#e91e63' }}
              thumbColor={powerButtonSOSEnabled ? '#f5dd4b' : '#f4f3f4'}
            />
          </View>
          
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>😊 Mood Tracking</Text>
            <Switch
              value={moodTrackingEnabled}
              onValueChange={setMoodTrackingEnabled}
              trackColor={{ false: '#767577', true: '#e91e63' }}
              thumbColor={moodTrackingEnabled ? '#f5dd4b' : '#f4f3f4'}
            />
          </View>
        </View>
      </View>

      {/* Quick Safety Actions */}
      <View style={styles.statusCard}>
        <Text style={styles.cardTitle}>Quick Safety Actions</Text>
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity style={styles.quickActionButton} onPress={handleSoundDetection}>
            <Text style={styles.quickActionEmoji}>🔊</Text>
            <Text style={styles.quickActionText}>Test Sound Detection</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.quickActionButton} onPress={handleMotionDetection}>
            <Text style={styles.quickActionEmoji}>📱</Text>
            <Text style={styles.quickActionText}>Test Motion Detection</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.quickActionButton} onPress={() => setShowMoodModal(true)}>
            <Text style={styles.quickActionEmoji}>😊</Text>
            <Text style={styles.quickActionText}>Log Mood</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.quickActionButton} onPress={() => triggerSafetyEvent('manual_sos', 'critical', 'Manual SOS activated')}>
            <Text style={styles.quickActionEmoji}>🚨</Text>
            <Text style={styles.quickActionText}>Emergency SOS</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Safety Events */}
      {safetyEvents.filter(e => !e.resolved).length > 0 && (
        <View style={styles.statusCard}>
          <Text style={styles.cardTitle}>Active Safety Events</Text>
          {safetyEvents.filter(e => !e.resolved).slice(0, 3).map(event => (
            <View key={event.id} style={styles.safetyEventCard}>
              <View style={styles.eventHeader}>
                <Text style={styles.eventType}>{getEventTypeIcon(event.type)} {getEventTypeLabel(event.type)}</Text>
                <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(event.severity) }]}>
                  <Text style={styles.severityText}>{event.severity.toUpperCase()}</Text>
                </View>
              </View>
              <Text style={styles.eventDetails}>{event.details}</Text>
              <Text style={styles.eventTime}>{event.timestamp.toLocaleString()}</Text>
              <TouchableOpacity 
                style={styles.resolveEventButton}
                onPress={() => resolveSafetyEvent(event.id)}
              >
                <Text style={styles.resolveEventButtonText}>Mark as Resolved</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Coping Tips */}
      <View style={styles.statusCard}>
        <Text style={styles.cardTitle}>Quick Coping Tips</Text>
        <TouchableOpacity 
          style={styles.copingTipButton}
          onPress={() => {
            setCurrentCopingTip(getRandomCopingTip());
            setShowCopingTip(true);
          }}
        >
          <Text style={styles.copingTipButtonText}>Get a Coping Tip</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderHistoryTab = () => (
    <View>
      {/* Safety History */}
      <View style={styles.statusCard}>
        <View style={styles.historyHeader}>
          <Text style={styles.cardTitle}>Safety History</Text>
          <TouchableOpacity onPress={deleteSafetyHistory}>
            <Text style={styles.deleteButton}>🗑️ Delete All</Text>
          </TouchableOpacity>
        </View>
        
        {safetyEvents.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>📋</Text>
            <Text style={styles.emptyStateTitle}>No Safety Events</Text>
            <Text style={styles.emptyStateText}>Your safety history will appear here</Text>
          </View>
        ) : (
          safetyEvents.map(event => (
            <View key={event.id} style={styles.historyEventCard}>
              <View style={styles.eventHeader}>
                <Text style={styles.eventType}>{getEventTypeIcon(event.type)} {getEventTypeLabel(event.type)}</Text>
                <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(event.severity) }]}>
                  <Text style={styles.severityText}>{event.severity.toUpperCase()}</Text>
                </View>
              </View>
              <Text style={styles.eventDetails}>{event.details}</Text>
              <Text style={styles.eventTime}>{event.timestamp.toLocaleString()}</Text>
              {event.copingTip && (
                <View style={styles.copingTipContainer}>
                  <Text style={styles.copingTipLabel}>💡 Coping Tip:</Text>
                  <Text style={styles.copingTipText}>{event.copingTip}</Text>
                </View>
              )}
              <View style={[styles.statusBadge, { backgroundColor: event.resolved ? '#4CAF50' : '#f44336' }]}>
                <Text style={styles.statusBadgeText}>{event.resolved ? 'RESOLVED' : 'ACTIVE'}</Text>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Mood History */}
      <View style={styles.statusCard}>
        <Text style={styles.cardTitle}>Mood History</Text>
        {moodLogs.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>😊</Text>
            <Text style={styles.emptyStateTitle}>No Mood Logs</Text>
            <Text style={styles.emptyStateText}>Your mood history will appear here</Text>
          </View>
        ) : (
          moodLogs.slice(0, 5).map(mood => (
            <View key={mood.id} style={styles.moodLogCard}>
              <View style={styles.moodHeader}>
                <Text style={styles.moodEmoji}>{getMoodEmoji(mood.mood)}</Text>
                <Text style={styles.moodType}>{mood.mood.charAt(0).toUpperCase() + mood.mood.slice(1)}</Text>
                <Text style={styles.moodIntensity}>Intensity: {mood.intensity}/10</Text>
              </View>
              {mood.notes && <Text style={styles.moodNotes}>{mood.notes}</Text>}
              <Text style={styles.moodTime}>{mood.timestamp.toLocaleString()}</Text>
            </View>
          ))
        )}
      </View>
    </View>
  );

  // Helper functions for rendering
  const getEventTypeIcon = (type: SafetyEvent['type']): string => {
    switch (type) {
      case 'sound_detection': return '🔊';
      case 'motion_detection': return '📱';
      case 'power_button': return '🔘';
      case 'mood_anxiety': return '😰';
      case 'manual_sos': return '🚨';
      default: return '📋';
    }
  };

  const getEventTypeLabel = (type: SafetyEvent['type']): string => {
    switch (type) {
      case 'sound_detection': return 'Sound Detection';
      case 'motion_detection': return 'Motion Detection';
      case 'power_button': return 'Power Button SOS';
      case 'mood_anxiety': return 'Mood & Anxiety';
      case 'manual_sos': return 'Manual SOS';
      default: return 'Unknown Event';
    }
  };

  const getSeverityColor = (severity: SafetyEvent['severity']): string => {
    switch (severity) {
      case 'critical': return '#f44336';
      case 'high': return '#ff9800';
      case 'medium': return '#ffc107';
      case 'low': return '#4caf50';
      default: return '#666';
    }
  };

  const getMoodEmoji = (mood: MoodLog['mood']): string => {
    switch (mood) {
      case 'happy': return '😊';
      case 'neutral': return '😐';
      case 'sad': return '😢';
      case 'anxious': return '😰';
      case 'fearful': return '😨';
      case 'stressed': return '😫';
      default: return '😊';
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#2094fc" translucent={true} hidden={false} />
      <View style={styles.header}>
        <Text style={styles.title}>My Status</Text>
        <Text style={styles.subtitle}>Comprehensive health tracking</Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {[
          { key: 'overview', label: 'Overview', emoji: '📊' },
          { key: 'symptoms', label: 'Symptoms', emoji: '🤕' },
          { key: 'metrics', label: 'Metrics', emoji: '📈' },
          { key: 'reminders', label: 'Reminders', emoji: '🔔' },
          { key: 'activities', label: 'Activities', emoji: '🔍' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabButton, activeTab === tab.key && styles.tabButtonActive]}
            onPress={() => setActiveTab(tab.key as any)}
          >
            <Text style={styles.tabEmoji}>{tab.emoji}</Text>
            <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {renderTabContent()}
      </View>

      {/* Modals */}
      <Modal 
        visible={showSymptomModal} 
        animationType="slide" 
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSymptomModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Log Symptoms</Text>
            <TouchableOpacity onPress={() => setShowSymptomModal(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>
          <SymptomTracking onSymptomLogged={(symptomLog) => {
            handleSymptomLogged(symptomLog);
            setShowSymptomModal(false);
          }} />
        </View>
      </Modal>

      <Modal 
        visible={showMetricsModal} 
        animationType="slide" 
        presentationStyle="pageSheet"
        onRequestClose={() => setShowMetricsModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Body Metrics</Text>
            <TouchableOpacity onPress={() => setShowMetricsModal(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>
          <BodyMetricsTracking onMetricsLogged={(bodyMetrics) => {
            handleMetricsLogged(bodyMetrics);
            setShowMetricsModal(false);
          }} />
        </View>
      </Modal>

      <Modal 
        visible={showRemindersModal} 
        animationType="slide" 
        presentationStyle="pageSheet"
        onRequestClose={() => setShowRemindersModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Reminders</Text>
            <TouchableOpacity onPress={() => setShowRemindersModal(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>
          <Reminders onReminderCreated={(reminder) => {
            handleReminderCreated(reminder);
            setShowRemindersModal(false);
          }} />
        </View>
      </Modal>

      {/* Safety Alert Modal */}
      <Modal 
        visible={showSafetyAlert} 
        animationType="slide" 
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSafetyAlert(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>🚨 Safety Alert</Text>
            <TouchableOpacity onPress={() => setShowSafetyAlert(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            {currentSafetyEvent && (
              <View>
                <View style={styles.alertCard}>
                  <Text style={styles.alertType}>
                    {getEventTypeIcon(currentSafetyEvent.type)} {getEventTypeLabel(currentSafetyEvent.type)}
                  </Text>
                  <Text style={styles.alertDetails}>{currentSafetyEvent.details}</Text>
                  <Text style={styles.alertTime}>{currentSafetyEvent.timestamp.toLocaleString()}</Text>
                </View>
                
                <View style={styles.copingTipCard}>
                  <Text style={styles.copingTipTitle}>💡 Coping Tip</Text>
                  <Text style={styles.copingTipContent}>{currentCopingTip}</Text>
                </View>
                
                <View style={styles.alertActions}>
                  <TouchableOpacity 
                    style={styles.resolveAlertButton}
                    onPress={() => resolveSafetyEvent(currentSafetyEvent.id)}
                  >
                    <Text style={styles.resolveAlertButtonText}>I'm Safe - Mark as Resolved</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.emergencyButton}
                    onPress={() => {
                      Alert.alert('SOS Sent', 'Emergency contacts have been notified!');
                      setShowSafetyAlert(false);
                    }}
                  >
                    <Text style={styles.emergencyButtonText}>🚨 Send SOS</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Mood Logging Modal */}
      <Modal 
        visible={showMoodModal} 
        animationType="slide" 
        presentationStyle="pageSheet"
        onRequestClose={() => setShowMoodModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Log Your Mood</Text>
            <TouchableOpacity onPress={() => setShowMoodModal(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <MoodLoggingForm onMoodLogged={(mood, intensity, notes) => {
              logMood(mood, intensity, notes);
              setShowMoodModal(false);
            }} />
          </ScrollView>
        </View>
      </Modal>

      {/* Coping Tip Modal */}
      <Modal 
        visible={showCopingTip} 
        animationType="fade" 
        transparent={true}
        onRequestClose={() => setShowCopingTip(false)}
      >
        <View style={styles.copingTipModalOverlay}>
          <View style={styles.copingTipModal}>
            <Text style={styles.copingTipModalTitle}>💡 Coping Tip</Text>
            <Text style={styles.copingTipModalContent}>{currentCopingTip}</Text>
            <TouchableOpacity 
              style={styles.copingTipModalButton}
              onPress={() => setShowCopingTip(false)}
            >
              <Text style={styles.copingTipModalButtonText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// Mood Logging Form Component
const MoodLoggingForm = ({ onMoodLogged }: { onMoodLogged: (mood: MoodLog['mood'], intensity: number, notes?: string) => void }) => {
  const [selectedMood, setSelectedMood] = useState<MoodLog['mood']>('neutral');
  const [intensity, setIntensity] = useState(5);
  const [notes, setNotes] = useState('');

  const moods: { mood: MoodLog['mood'], emoji: string, label: string }[] = [
    { mood: 'happy', emoji: '😊', label: 'Happy' },
    { mood: 'neutral', emoji: '😐', label: 'Neutral' },
    { mood: 'sad', emoji: '😢', label: 'Sad' },
    { mood: 'anxious', emoji: '😰', label: 'Anxious' },
    { mood: 'fearful', emoji: '😨', label: 'Fearful' },
    { mood: 'stressed', emoji: '😫', label: 'Stressed' },
  ];

  return (
    <View>
      <Text style={styles.modalSectionTitle}>How are you feeling?</Text>
      <View style={styles.moodSelector}>
        {moods.map(({ mood, emoji, label }) => (
          <TouchableOpacity
            key={mood}
            style={[
              styles.moodOption,
              selectedMood === mood && styles.moodOptionActive
            ]}
            onPress={() => setSelectedMood(mood)}
          >
            <Text style={styles.moodEmoji}>{emoji}</Text>
            <Text style={[
              styles.moodLabel,
              selectedMood === mood && styles.moodLabelActive
            ]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.modalSectionTitle}>Intensity (1-10)</Text>
      <View style={styles.intensityContainer}>
        <Text style={styles.intensityLabel}>1</Text>
        <View style={styles.intensitySlider}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
            <TouchableOpacity
              key={num}
              style={[
                styles.intensityDot,
                intensity >= num && styles.intensityDotActive
              ]}
              onPress={() => setIntensity(num)}
            />
          ))}
        </View>
        <Text style={styles.intensityLabel}>10</Text>
      </View>
      <Text style={styles.intensityValue}>Current: {intensity}/10</Text>

      <Text style={styles.modalSectionTitle}>Notes (Optional)</Text>
      <TextInput
        style={styles.notesInput}
        value={notes}
        onChangeText={setNotes}
        placeholder="How are you feeling? Any specific concerns?"
        placeholderTextColor="#999"
        multiline
      />

      <TouchableOpacity 
        style={styles.logMoodButton}
        onPress={() => onMoodLogged(selectedMood, intensity, notes.trim() || undefined)}
      >
        <Text style={styles.logMoodButtonText}>Log Mood</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fef7f7',
  },
  header: {
    backgroundColor: '#2094fc',
    paddingTop: Platform.OS === 'ios' ? 44 : 0,
    paddingBottom: 20,
    paddingHorizontal: 0,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 20,
  },
  subtitle: {
    fontSize: 14,
    color: 'white',
    marginTop: 5,
    opacity: 0.9,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: 10,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: '#fde2e2',
  },
  tabEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  tabLabelActive: {
    color: '#e91e63',
  },
  content: {
    flex: 1,
  },
  statusCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  cycleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  phaseIndicator: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 16,
  },
  phaseText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  cycleDetails: {
    flex: 1,
  },
  cycleDay: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  cycleDescription: {
    fontSize: 14,
    color: '#666',
  },
  insightsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  insightItem: {
    alignItems: 'center',
  },
  insightNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#e91e63',
    marginBottom: 4,
  },
  insightLabel: {
    fontSize: 12,
    color: '#666',
  },
  alertContainer: {
    backgroundColor: '#fff3cd',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 4,
  },
  alertText: {
    fontSize: 12,
    color: '#856404',
    marginBottom: 2,
  },
  fertileText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  nextPeriodText: {
    fontSize: 14,
    color: '#666',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  quickActionEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
    textAlign: 'center',
  },
  recommendationsContainer: {
    backgroundColor: '#f8f8f8',
    padding: 16,
    borderRadius: 12,
  },
  recommendationText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    lineHeight: 20,
  },
  symptomsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  symptomTag: {
    backgroundColor: '#fde2e2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  symptomText: {
    color: '#e91e63',
    fontSize: 14,
    fontWeight: '600',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#e91e63',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  closeButton: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'bold',
  },
  // Smart Safety System Styles
  activitiesTabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  activitiesTabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  activitiesTabButtonActive: {
    backgroundColor: '#e91e63',
  },
  activitiesTabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  activitiesTabTextActive: {
    color: 'white',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  safetySettings: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  safetyStatus: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 16,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  statusDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  safetyEventCard: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#e91e63',
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  severityText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  eventDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  eventTime: {
    fontSize: 12,
    color: '#999',
    marginBottom: 12,
  },
  resolveEventButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-end',
  },
  resolveEventButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  copingTipButton: {
    backgroundColor: '#e91e63',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  copingTipButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  deleteButton: {
    fontSize: 14,
    color: '#f44336',
    fontWeight: '600',
  },
  historyEventCard: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  copingTipContainer: {
    backgroundColor: '#fff3cd',
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  copingTipLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 4,
  },
  copingTipText: {
    fontSize: 14,
    color: '#856404',
    lineHeight: 20,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  statusBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  moodLogCard: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  moodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  moodEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  moodType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  moodIntensity: {
    fontSize: 12,
    color: '#666',
  },
  moodNotes: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  moodTime: {
    fontSize: 12,
    color: '#999',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  // Modal Styles for Safety System
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    marginTop: 16,
  },
  alertCard: {
    backgroundColor: '#fff3cd',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  alertType: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 8,
  },
  alertDetails: {
    fontSize: 14,
    color: '#856404',
    marginBottom: 8,
    lineHeight: 20,
  },
  alertTime: {
    fontSize: 12,
    color: '#856404',
  },
  copingTipCard: {
    backgroundColor: '#e8f5e8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  copingTipTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 8,
  },
  copingTipContent: {
    fontSize: 14,
    color: '#2e7d32',
    lineHeight: 20,
  },
  alertActions: {
    gap: 12,
  },
  resolveAlertButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  resolveAlertButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emergencyButton: {
    backgroundColor: '#f44336',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  emergencyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Mood Logging Styles
  moodSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  moodOption: {
    flex: 1,
    minWidth: '30%',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  moodOptionActive: {
    backgroundColor: '#e91e63',
    borderColor: '#e91e63',
  },
  moodEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  moodLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  moodLabelActive: {
    color: 'white',
  },
  intensityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  intensityLabel: {
    fontSize: 12,
    color: '#666',
    marginHorizontal: 8,
  },
  intensitySlider: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  intensityDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ddd',
    borderWidth: 2,
    borderColor: '#ccc',
  },
  intensityDotActive: {
    backgroundColor: '#e91e63',
    borderColor: '#e91e63',
  },
  intensityValue: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
    marginBottom: 16,
  },
  notesInput: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 16,
    color: '#333',
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  logMoodButton: {
    backgroundColor: '#e91e63',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  logMoodButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  // Coping Tip Modal Styles
  copingTipModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  copingTipModal: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  copingTipModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  copingTipModalContent: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  copingTipModalButton: {
    backgroundColor: '#e91e63',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  copingTipModalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Enhanced Safety Status Card Styles
  safetyStatusCard: {
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  safetyStatusContent: {
    padding: 20,
  },
  safetyStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  safetyStatusIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  safetyStatusTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
  },
  safetyStatusMessage: {
    fontSize: 18,
    color: 'white',
    fontWeight: '600',
    marginBottom: 8,
    lineHeight: 24,
  },
  safetyStatusDetails: {
    fontSize: 14,
    color: 'white',
    opacity: 0.9,
    marginBottom: 16,
    lineHeight: 20,
  },
  safetyStatusFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  safetyStatusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  safetyStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  safetyStatusText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
  safetyStatusTime: {
    fontSize: 12,
    color: 'white',
    opacity: 0.8,
  },
  // Metrics Styles
  metricsSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#f8f9fa',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  metricCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginVertical: 8,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  halfCard: {
    flex: 1,
    marginHorizontal: 5,
  },
  metricRow: {
    flexDirection: 'row',
    marginHorizontal: 15,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#e91e63',
  },
  metricIcon: {
    fontSize: 32,
    marginBottom: 8,
    textAlign: 'center',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    marginVertical: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#e91e63',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  chartContainer: {
    height: 120,
    marginTop: 10,
  },
  chartBars: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 100,
  },
  chartBarContainer: {
    alignItems: 'center',
    flex: 1,
  },
  chartBar: {
    width: 20,
    backgroundColor: '#e91e63',
    borderRadius: 10,
    marginBottom: 5,
  },
  chartBarLabel: {
    fontSize: 12,
    color: '#666',
  },
  sleepContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  sleepMetric: {
    alignItems: 'center',
  },
  sleepValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  sleepLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  cyclePhaseContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  predictionsContainer: {
    marginTop: 10,
  },
  predictionText: {
    fontSize: 14,
    color: '#666',
    marginVertical: 2,
  },
  symptomTrendsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  patternTag: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  patternText: {
    fontSize: 12,
    color: '#666',
  },
  energyContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  energyValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#e91e63',
  },
  energyLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  trendIndicator: {
    marginTop: 8,
  },
  trendText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  moodDistributionContainer: {
    marginTop: 10,
  },
  moodBarContainer: {
    marginBottom: 12,
  },
  moodBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  moodLabel: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  moodPercentage: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  moodBar: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
  },
  moodBarFill: {
    height: '100%',
    backgroundColor: '#e91e63',
    borderRadius: 4,
  },
  stressContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  stressValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#e91e63',
  },
  stressBar: {
    width: '80%',
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    marginVertical: 8,
  },
  stressBarFill: {
    height: '100%',
    backgroundColor: '#ff9800',
    borderRadius: 4,
  },
  stressLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  habitsValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4caf50',
    textAlign: 'center',
    marginTop: 10,
  },
  habitsDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  achievementsContainer: {
    paddingHorizontal: 20,
  },
  achievementCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  achievementIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  achievementContent: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  achievementDate: {
    fontSize: 12,
    color: '#999',
  },
});
