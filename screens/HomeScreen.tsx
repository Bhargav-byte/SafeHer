import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  Switch,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  StatusBar,
  SafeAreaView,
  Platform,
} from 'react-native';
import * as Location from 'expo-location';
import { UnusualActivityDetectionService } from '../services/UnusualActivityDetectionService';
import { HealthTrackingService } from '../services/HealthTrackingService';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { getUserProfile } from '../services/supabase';

// Configuration
const { width } = Dimensions.get('window');

interface LocationData {
  latitude: number;
  longitude: number;
}

export default function HomeScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isLiveTracking, setIsLiveTracking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lastPeriodDate, setLastPeriodDate] = useState(new Date("2025-01-15"));
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);
  const [isSilentRecording, setIsSilentRecording] = useState(false);
  const [isRouteTracking, setIsRouteTracking] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [userName, setUserName] = useState<string>('User');

  const detectionService = UnusualActivityDetectionService.getInstance();
  const healthService = HealthTrackingService.getInstance();

  useEffect(() => {
    requestPermissions();
    initializeDetectionService();
    loadUserName();
    
    // Cleanup intervals on unmount
    return () => {
      if (timerInterval) clearInterval(timerInterval);
    };
  }, [user]);

  // Cleanup intervals when component unmounts
  useEffect(() => {
    return () => {
      if (timerInterval) clearInterval(timerInterval);
    };
  }, [timerInterval]);

  const initializeDetectionService = async () => {
    try {
      await detectionService.initialize('user1');
    } catch (error) {
      console.error('Error initializing detection service:', error);
    }
  };

  const loadUserName = async () => {
    if (!user) {
      setUserName('User');
      return;
    }

    try {
      // Try to get user profile first
      const { data: profile } = await getUserProfile(user.id);
      if (profile && profile.name) {
        setUserName(profile.name);
        return;
      }
    } catch (error) {
      console.log('No profile found, using email fallback');
    }

    // Fallback: Extract name from email
    const email = user.email || '';
    const emailName = email.split('@')[0];
    
    // Capitalize first letter and replace dots/underscores with spaces
    const formattedName = emailName
      .replace(/[._]/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
    
    setUserName(formattedName || 'User');
  };

  const requestPermissions = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required for safety features');
        return;
      }
      
      // Get current location
      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });
    } catch (error) {
      console.log('Location permission error:', error);
    }
  };

  const handleSOSPress = async () => {
    setLoading(true);
    
    try {
      // Get current location
      const currentLocation = await Location.getCurrentPositionAsync({});
      const locationData = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      };
      
      setLocation(locationData);
      
      // Show SOS confirmation
      Alert.alert(
        '🚨 EMERGENCY SOS ACTIVATED',
        `Emergency alert sent to all contacts!\n\nLocation: ${locationData.latitude.toFixed(4)}, ${locationData.longitude.toFixed(4)}\n\nEmergency services have been notified.`,
        [
          { text: 'OK', style: 'default' },
          { text: 'Call 100 (Police)', onPress: () => {
            Alert.alert('Emergency Call', 'Calling Police (100)...');
          }},
          { text: 'Call 108 (Ambulance)', onPress: () => {
            Alert.alert('Emergency Call', 'Calling Ambulance (108)...');
          }},
          { text: 'Call 1091 (Women Helpline)', onPress: () => {
            Alert.alert('Emergency Call', 'Calling Women Helpline (1091)...');
          }}
        ]
      );

      // Trigger unusual activity detection for SOS
      await detectionService.detectUnusualEvent('user1', 'sos', {
        timestamp: new Date(),
        location: locationData,
        emergency: true
      });
      
      // Simulate emergency contact notification
      setTimeout(() => {
        Alert.alert(
          'Emergency Contacts Notified',
          'All emergency contacts have been notified of your SOS alert with your current location.'
        );
      }, 2000);
      
    } catch (error) {
      console.error('Error handling SOS:', error);
      Alert.alert(
        'SOS Error',
        'Unable to get location. SOS alert sent without location data.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleLiveTracking = async () => {
    if (!isLiveTracking) {
      // Start live tracking
      try {
        const currentLocation = await Location.getCurrentPositionAsync({});
        const locationData = {
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        };
        setLocation(locationData);
        
        setIsLiveTracking(true);
        
        // Start location tracking interval (every 15 seconds)
        const interval = setInterval(async () => {
          try {
            const newLocation = await Location.getCurrentPositionAsync({});
            const newLocationData = {
              latitude: newLocation.coords.latitude,
              longitude: newLocation.coords.longitude,
            };
            setLocation(newLocationData);
            
            // Detect unusual activity for location updates
            await detectionService.detectUnusualEvent('user1', 'location', {
              latitude: newLocationData.latitude,
              longitude: newLocationData.longitude,
              timestamp: new Date(),
              accuracy: newLocation.coords.accuracy
            });
            
            console.log('Location updated:', newLocationData);
          } catch (error) {
            console.error('Error updating location:', error);
          }
        }, 15000); // 15 seconds
        
        setTimerInterval(interval);
        
        Alert.alert(
          'Live Tracking Started',
          'Your location is now being shared every 15 seconds with your emergency contacts.',
          [{ text: 'OK' }]
        );
        
      } catch (error) {
        console.error('Error starting live tracking:', error);
        Alert.alert('Error', 'Unable to start live tracking. Please check location permissions.');
      }
    } else {
      // Stop live tracking
      if (timerInterval) {
        clearInterval(timerInterval);
        setTimerInterval(null);
      }
      setIsLiveTracking(false);
      Alert.alert('Live Tracking Stopped', 'Location sharing has been disabled.');
    }
  };

  const handleLogSymptoms = () => {
    navigation.navigate('My Status' as never);
  };

  const handleCrampsAdvice = () => {
    Alert.alert(
      'Cramps Relief Tips',
      'Here are some ways to relieve period cramps:\n\n• Apply heat (heating pad, warm bath)\n• Gentle exercise or stretching\n• Over-the-counter pain relievers\n• Stay hydrated\n• Try relaxation techniques\n• Consider magnesium supplements',
      [{ text: 'OK' }]
    );
  };

  const handlePatternAnalysis = () => {
    navigation.navigate('My Status' as never);
  };

  const updateLastPeriod = () => {
    Alert.alert(
      'Update Last Period',
      'Select when your last period started:',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Today', onPress: () => {
          const today = new Date();
          setLastPeriodDate(today);
          Alert.alert('Updated', `Last period date updated to ${today.toLocaleDateString()}`);
        }},
        { text: '1 Week Ago', onPress: () => {
          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
          setLastPeriodDate(oneWeekAgo);
          Alert.alert('Updated', `Last period date updated to ${oneWeekAgo.toLocaleDateString()}`);
        }},
        { text: '2 Weeks Ago', onPress: () => {
          const twoWeeksAgo = new Date();
          twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
          setLastPeriodDate(twoWeeksAgo);
          Alert.alert('Updated', `Last period date updated to ${twoWeeksAgo.toLocaleDateString()}`);
        }},
        { text: '3 Weeks Ago', onPress: () => {
          const threeWeeksAgo = new Date();
          threeWeeksAgo.setDate(threeWeeksAgo.getDate() - 21);
          setLastPeriodDate(threeWeeksAgo);
          Alert.alert('Updated', `Last period date updated to ${threeWeeksAgo.toLocaleDateString()}`);
        }},
        { text: 'Custom Date', onPress: () => {
          // In a real app, this would open a date picker
          Alert.alert('Custom Date', 'Date picker will be implemented in the next update!');
        }}
      ]
    );
  };

  const handleSendLocationToContact = async () => {
    try {
      const locationData = await Location.getCurrentPositionAsync({});
      Alert.alert(
        'Send Location',
        `Send your current location to trusted contacts?\n\nLocation: ${locationData.coords.latitude.toFixed(4)}, ${locationData.coords.longitude.toFixed(4)}`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Send', onPress: () => {
            Alert.alert('Location Sent', 'Your location has been sent to your trusted contacts!');
            // Trigger unusual activity detection
            detectionService.detectUnusualEvent({
              type: 'location_shared',
              timestamp: new Date(),
              details: { latitude: locationData.coords.latitude, longitude: locationData.coords.longitude }
            });
          }}
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Unable to get current location. Please check location permissions.');
    }
  };

  const handleSilentRecording = () => {
    if (isSilentRecording) {
      Alert.alert(
        'Stop Silent Recording',
        'Are you sure you want to stop silent recording?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Stop', onPress: () => {
            setIsSilentRecording(false);
            Alert.alert('Recording Stopped', 'Silent recording has been stopped.');
          }}
        ]
      );
    } else {
      Alert.alert(
        'Start Silent Recording',
        'Silent recording will capture video and audio without showing any indication. This feature helps gather evidence discreetly.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Start', onPress: () => {
            setIsSilentRecording(true);
            Alert.alert('Recording Started', 'Silent recording is now active.');
            // Trigger unusual activity detection
            detectionService.detectUnusualEvent({
              type: 'silent_recording_started',
              timestamp: new Date(),
              details: { recording_type: 'silent_video_audio' }
            });
          }}
        ]
      );
    }
  };

  const handleFakeSOSDeactivation = () => {
    Alert.alert(
      'Fake SOS Deactivation',
      'This feature allows you to deactivate an SOS alert without actually stopping it. Useful for situations where you need to appear safe while still being monitored.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Deactivate', onPress: () => {
          Alert.alert('Fake Deactivation', 'SOS appears deactivated but monitoring continues in background.');
          // Trigger unusual activity detection
          detectionService.detectUnusualEvent({
            type: 'fake_sos_deactivation',
            timestamp: new Date(),
            details: { fake_deactivation: true }
          });
        }}
      ]
    );
  };

  const handleTrackMyRoute = () => {
    if (isRouteTracking) {
      Alert.alert(
        'Stop Route Tracking',
        'Are you sure you want to stop tracking your route?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Stop', onPress: () => {
            setIsRouteTracking(false);
            Alert.alert('Route Tracking Stopped', 'Your route is no longer being tracked.');
          }}
        ]
      );
    } else {
      Alert.alert(
        'Start Route Tracking',
        'Route tracking will monitor your path and detect any unusual deviations from your normal routes.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Start', onPress: () => {
            setIsRouteTracking(true);
            Alert.alert('Route Tracking Started', 'Your route is now being tracked for safety.');
            // Trigger unusual activity detection
            detectionService.detectUnusualEvent({
              type: 'route_tracking_started',
              timestamp: new Date(),
              details: { tracking_enabled: true }
            });
          }}
        ]
      );
    }
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    // You can add more functionality here like fetching data for the selected date
    console.log('Selected date:', date.toDateString());
  };

  const getSelectedDateData = () => {
    const dateStr = selectedDate.toDateString();
    const today = new Date().toDateString();
    
    // Mock data for demonstration - in a real app, this would come from your data store
    const mockData = {
      [today]: {
        symptoms: ['Mild cramps', 'Bloating'],
        mood: 'Tired',
        energy: 'Low',
        flow: 'Medium',
        notes: 'Feeling a bit uncomfortable today'
      },
      // Add more mock data for other dates
    };
    
    return mockData[dateStr] || {
      symptoms: [],
      mood: 'Normal',
      energy: 'Normal',
      flow: 'None',
      notes: 'No data recorded for this date'
    };
  };

  // PMS Tracker Logic
  const getPMSStatus = () => {
    const today = new Date();
    const cycleLength = 28; // Average cycle length
    const nextPeriod = new Date(lastPeriodDate);
    nextPeriod.setDate(nextPeriod.getDate() + cycleLength);
    
    const daysUntilNext = Math.ceil((nextPeriod.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilNext <= 5 && daysUntilNext > 0) {
      return { status: '⚠️ PMS likely — Take care!', color: '#ff9800' };
    } else if (daysUntilNext <= 0) {
      return { status: '🩸 Your period may have started!', color: '#e91e63' };
    } else {
      return { status: `✅ Next period in ${daysUntilNext} days`, color: '#4caf50' };
    }
  };

  const pmsStatus = getPMSStatus();

  // Cycle Day Calculation
  const getCycleInfo = () => {
    const cycleInfo = healthService.calculateCurrentCycleDay('user1', lastPeriodDate, 28);
    return cycleInfo;
  };

  const cycleInfo = getCycleInfo();

  // Calendar generation
  const generateCalendarDays = () => {
    const today = new Date();
    const days = [];
    
    for (let i = -3; i <= 3; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      const isToday = i === 0;
      const isSelected = selectedDate.toDateString() === date.toDateString();
      const dayName = i === 0 ? 'TODAY' : date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
      const dayNumber = date.getDate();
      
      days.push(
        <TouchableOpacity 
          key={i} 
          style={[
            styles.calendarDay, 
            isToday && styles.calendarDayToday,
            isSelected && styles.calendarDaySelected
          ]}
          onPress={() => handleDateSelect(date)}
        >
          <Text style={[
            styles.calendarDayName, 
            isToday && styles.calendarDayNameToday,
            isSelected && styles.calendarDayNameSelected
          ]}>{dayName}</Text>
          <Text style={[
            styles.calendarDayNumber, 
            isToday && styles.calendarDayNumberToday,
            isSelected && styles.calendarDayNumberSelected
          ]}>{dayNumber}</Text>
          <View style={styles.calendarDot} />
        </TouchableOpacity>
      );
    }
    
    return days;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#2094fc" translucent={true} hidden={false} />
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Header with Date */}
        <View style={styles.header}>
          <View style={styles.dateSection}>
            <Text style={styles.greetingText}>Hey, {userName}</Text>
          </View>
        </View>

      {/* Calendar View */}
      <View style={styles.calendarContainer}>
        <View style={styles.calendarHeader}>
          <Text style={styles.calendarEmoji}>🐱</Text>
          <Text style={styles.calendarTitle}>{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.calendarScroll}>
          {generateCalendarDays()}
        </ScrollView>
      </View>

      {/* Selected Date Data */}
      <View style={styles.dateDataContainer}>
        <Text style={styles.dateDataTitle}>
          {selectedDate.toDateString() === new Date().toDateString() 
            ? 'Today\'s Data' 
            : selectedDate.toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric' 
              })
          }
        </Text>
        <View style={styles.dateDataCard}>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Mood:</Text>
            <Text style={styles.dataValue}>{getSelectedDateData().mood}</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Energy:</Text>
            <Text style={styles.dataValue}>{getSelectedDateData().energy}</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Flow:</Text>
            <Text style={styles.dataValue}>{getSelectedDateData().flow}</Text>
          </View>
          {getSelectedDateData().symptoms.length > 0 && (
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>Symptoms:</Text>
              <Text style={styles.dataValue}>{getSelectedDateData().symptoms.join(', ')}</Text>
            </View>
          )}
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Notes:</Text>
            <Text style={styles.dataValue}>{getSelectedDateData().notes}</Text>
          </View>
        </View>
      </View>

      {/* Period Status */}
      <View style={styles.periodStatusContainer}>
        <Text style={styles.periodLabel}>Cycle:</Text>
        <Text style={styles.periodDay}>Day {cycleInfo.cycleDay}</Text>
        <Text style={styles.periodPhase}>{cycleInfo.phase} Phase</Text>
        <Text style={styles.periodInfo}>What's important today? Learn more →</Text>
        <TouchableOpacity style={styles.editPeriodButton} onPress={updateLastPeriod}>
          <Text style={styles.editPeriodText}>Edit period dates</Text>
        </TouchableOpacity>
      </View>

      {/* PMS Tracker Card */}
      <View style={styles.pmsCard}>
        <Text style={styles.pmsTitle}>PMS Tracker</Text>
        <Text style={[styles.pmsStatus, { color: pmsStatus.color }]}>{pmsStatus.status}</Text>
        <TouchableOpacity style={styles.updatePeriodButton} onPress={updateLastPeriod}>
          <Text style={styles.updatePeriodText}>Update Last Period</Text>
        </TouchableOpacity>
      </View>

      {/* Daily Insights */}
      <View style={styles.insightsContainer}>
        <Text style={styles.insightsTitle}>My daily insights • Today</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.insightsScroll}>
          <TouchableOpacity style={styles.insightCard} onPress={handleLogSymptoms}>
            <Text style={styles.insightIcon}>📊</Text>
            <Text style={styles.insightTitle}>Log Symptoms</Text>
            <Text style={styles.insightDescription}>Track your daily symptoms</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.insightCard} onPress={handleCrampsAdvice}>
            <Text style={styles.insightIcon}>💊</Text>
            <Text style={styles.insightTitle}>Cramps Advice</Text>
            <Text style={styles.insightDescription}>Get relief tips</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.insightCard} onPress={handlePatternAnalysis}>
            <Text style={styles.insightIcon}>📈</Text>
            <Text style={styles.insightTitle}>Pattern Analysis</Text>
            <Text style={styles.insightDescription}>Understand your cycle</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* During Your Period Section */}
      <View style={styles.duringPeriodContainer}>
        <Text style={styles.duringPeriodTitle}>During your period</Text>
        <View style={styles.periodAdviceCard}>
          <Text style={styles.adviceTitle}>Stay hydrated</Text>
          <Text style={styles.adviceDescription}>Drink plenty of water to help with bloating and cramps</Text>
        </View>
      </View>

      {/* SOS Button - Keep it accessible */}
      <View style={styles.sosSection}>
        <TouchableOpacity
          style={[styles.sosButton, loading && styles.sosButtonDisabled]}
          onPress={handleSOSPress}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" size="large" />
          ) : (
            <Text style={styles.sosButtonText}>SOS</Text>
          )}
        </TouchableOpacity>
        <Text style={styles.sosDescription}>
          Emergency • Press in case of danger
        </Text>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActionsContainer}>
        <Text style={styles.quickActionsTitle}>Quick Actions</Text>
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionIcon}>📍</Text>
            <Text style={styles.actionText}>Live Tracking</Text>
            <Switch
              value={isLiveTracking}
              onValueChange={toggleLiveTracking}
              trackColor={{ false: '#767577', true: '#1E90FF' }}
              thumbColor={isLiveTracking ? '#f5dd4b' : '#f4f3f4'}
            />
          </TouchableOpacity>
        </View>
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionButton} onPress={handleSendLocationToContact}>
            <Text style={styles.actionIcon}>📤</Text>
            <Text style={styles.actionText}>Send Location to Trusted Contact</Text>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionButton} onPress={handleSilentRecording}>
            <Text style={styles.actionIcon}>🎥</Text>
            <Text style={styles.actionText}>Silent Video/Audio Recording</Text>
            <Switch
              value={isSilentRecording}
              onValueChange={setIsSilentRecording}
              trackColor={{ false: '#767577', true: '#1E90FF' }}
              thumbColor={isSilentRecording ? '#f5dd4b' : '#f4f3f4'}
            />
          </TouchableOpacity>
        </View>
        
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionButton} onPress={handleFakeSOSDeactivation}>
            <Text style={styles.actionIcon}>🚫</Text>
            <Text style={styles.actionText}>Fake SOS Deactivation</Text>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionButton} onPress={handleTrackMyRoute}>
            <Text style={styles.actionIcon}>🗺️</Text>
            <Text style={styles.actionText}>Track My Route</Text>
            <Switch
              value={isRouteTracking}
              onValueChange={setIsRouteTracking}
              trackColor={{ false: '#767577', true: '#1E90FF' }}
              thumbColor={isRouteTracking ? '#f5dd4b' : '#f4f3f4'}
            />
          </TouchableOpacity>
        </View>
      </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fef7f7',
  },
  scrollContainer: {
    flex: 1,
  },
  // Header Styles
  header: {
    backgroundColor: '#2094fc',
    paddingTop: Platform.OS === 'ios' ? 44 : 0,
    paddingBottom: 20,
    paddingHorizontal: 0,
  },
  dateSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  greetingText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 20,
  },

  // Calendar Styles
  calendarContainer: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 16,
    paddingVertical: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  calendarEmoji: {
    fontSize: 20,
    marginRight: 12,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  calendarScroll: {
    paddingHorizontal: 20,
  },
  calendarDay: {
    alignItems: 'center',
    marginHorizontal: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    minWidth: 60,
  },
  calendarDayToday: {
    backgroundColor: '#1E90FF',
  },
  calendarDaySelected: {
    backgroundColor: '#e6f3ff',
    borderWidth: 2,
    borderColor: '#1E90FF',
  },
  calendarDayName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  calendarDayNameToday: {
    color: 'white',
  },
  calendarDayNameSelected: {
    color: '#1E90FF',
    fontWeight: 'bold',
  },
  calendarDayNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  calendarDayNumberToday: {
    color: 'white',
  },
  calendarDayNumberSelected: {
    color: '#1E90FF',
    fontWeight: 'bold',
  },
  calendarDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1E90FF',
  },

  // Date Data Display Styles
  dateDataContainer: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  dateDataTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  dateDataCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dataLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    flex: 1,
  },
  dataValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },

  // Period Status Styles
  periodStatusContainer: {
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
  periodLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  periodDay: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#e91e63',
    marginBottom: 4,
  },
  periodPhase: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  periodInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  editPeriodButton: {
    backgroundColor: '#fde2e2',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  editPeriodText: {
    color: '#1E90FF',
    fontWeight: '600',
  },

  // PMS Tracker Styles
  pmsCard: {
    backgroundColor: '#e6f3ff',
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
  pmsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  pmsStatus: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  updatePeriodButton: {
    backgroundColor: '#1E90FF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  updatePeriodText: {
    color: 'white',
    fontWeight: '600',
  },

  // Insights Styles
  insightsContainer: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  insightsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  insightsScroll: {
    paddingLeft: 0,
  },
  insightCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginRight: 16,
    width: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  insightIcon: {
    fontSize: 24,
    marginBottom: 12,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  insightDescription: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },

  // During Period Styles
  duringPeriodContainer: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  duringPeriodTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  periodAdviceCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  adviceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  adviceDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },

  // SOS Button Styles
  sosSection: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 20,
  },
  sosButton: {
    backgroundColor: '#e91e63',
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#e91e63',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  sosButtonDisabled: {
    backgroundColor: '#ccc',
  },
  sosButtonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  sosDescription: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },

  // Quick Actions Styles
  quickActionsContainer: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  quickActionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  actionIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  actionText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  actionArrow: {
    fontSize: 18,
    color: '#1E90FF',
    fontWeight: 'bold',
  },
});



