import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { UnusualActivityDetectionService, UnusualActivity } from '../services/UnusualActivityDetectionService';

interface UnusualActivitiesProps {
  userId: string;
}

export default function UnusualActivities({ userId }: UnusualActivitiesProps) {
  const [activities, setActivities] = useState<UnusualActivity[]>([]);
  const [unresolvedCount, setUnresolvedCount] = useState(0);
  const [showAllModal, setShowAllModal] = useState(false);
  const [allActivities, setAllActivities] = useState<UnusualActivity[]>([]);

  const detectionService = UnusualActivityDetectionService.getInstance();

  useEffect(() => {
    loadActivities();
  }, [userId]);

  const loadActivities = async () => {
    try {
      const recentActivities = await detectionService.getRecentActivities(userId, 3);
      const unresolvedCount = await detectionService.getUnresolvedActivitiesCount(userId);
      
      setActivities(recentActivities);
      setUnresolvedCount(unresolvedCount);
    } catch (error) {
      console.error('Error loading activities:', error);
    }
  };

  const loadAllActivities = async () => {
    try {
      const allActivities = await detectionService.getRecentActivities(userId, 20);
      setAllActivities(allActivities);
    } catch (error) {
      console.error('Error loading all activities:', error);
    }
  };

  const markAsResolved = async (activityId: string) => {
    try {
      await detectionService.markActivityResolved(activityId);
      await loadActivities();
      Alert.alert('Success', 'Activity marked as resolved');
    } catch (error) {
      console.error('Error marking activity as resolved:', error);
      Alert.alert('Error', 'Failed to mark activity as resolved');
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#f44336';
      case 'high': return '#ff9800';
      case 'medium': return '#ffc107';
      case 'low': return '#4caf50';
      default: return '#666';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return '🚨';
      case 'high': return '⚠️';
      case 'medium': return '⚡';
      case 'low': return 'ℹ️';
      default: return '📋';
    }
  };

  const getEventTypeIcon = (eventType: string) => {
    switch (eventType) {
      case 'late_night_exit': return '🌙';
      case 'route_deviation': return '🛣️';
      case 'missed_checkin': return '⏰';
      case 'repeated_sos': return '🚨';
      case 'health_anomaly': return '❤️';
      default: return '📋';
    }
  };

  const getEventTypeLabel = (eventType: string) => {
    switch (eventType) {
      case 'late_night_exit': return 'Late Night Exit';
      case 'route_deviation': return 'Route Deviation';
      case 'missed_checkin': return 'Missed Check-in';
      case 'repeated_sos': return 'Repeated SOS';
      case 'health_anomaly': return 'Health Anomaly';
      default: return 'Unknown Event';
    }
  };

  const renderActivityCard = (activity: UnusualActivity, showActions: boolean = true) => (
    <View key={activity.id} style={styles.activityCard}>
      <View style={styles.activityHeader}>
        <View style={styles.activityType}>
          <Text style={styles.activityTypeIcon}>{getEventTypeIcon(activity.eventType)}</Text>
          <Text style={styles.activityTypeLabel}>{getEventTypeLabel(activity.eventType)}</Text>
        </View>
        <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(activity.severity) }]}>
          <Text style={styles.severityIcon}>{getSeverityIcon(activity.severity)}</Text>
          <Text style={styles.severityText}>{activity.severity.toUpperCase()}</Text>
        </View>
      </View>
      
      <Text style={styles.activityDetails}>{activity.details}</Text>
      
      <View style={styles.activityFooter}>
        <Text style={styles.activityTime}>
          {activity.timestamp.toLocaleString()}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: activity.status === 'active' ? '#f44336' : '#4caf50' }]}>
          <Text style={styles.statusText}>{activity.status.toUpperCase()}</Text>
        </View>
      </View>
      
      {showActions && activity.status === 'active' && (
        <TouchableOpacity
          style={styles.resolveButton}
          onPress={() => markAsResolved(activity.id)}
        >
          <Text style={styles.resolveButtonText}>Mark as Resolved</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderActivitiesList = () => {
    if (activities.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateIcon}>✅</Text>
          <Text style={styles.emptyStateTitle}>All Clear!</Text>
          <Text style={styles.emptyStateText}>No unusual activities detected recently</Text>
        </View>
      );
    }

    return (
      <View>
        {activities.map(activity => renderActivityCard(activity))}
        
        {activities.length >= 3 && (
          <TouchableOpacity
            style={styles.viewAllButton}
            onPress={() => {
              loadAllActivities();
              setShowAllModal(true);
            }}
          >
            <Text style={styles.viewAllButtonText}>View All Activities</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerIcon}>🔍</Text>
          <Text style={styles.headerTitle}>Unusual Activities</Text>
        </View>
        {unresolvedCount > 0 && (
          <View style={styles.badgeContainer}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unresolvedCount}</Text>
            </View>
          </View>
        )}
      </View>

      {renderActivitiesList()}

      {/* All Activities Modal */}
      <Modal
        visible={showAllModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>All Unusual Activities</Text>
            <TouchableOpacity onPress={() => setShowAllModal(false)}>
              <Text style={styles.closeButton}>Close</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            {allActivities.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateIcon}>📋</Text>
                <Text style={styles.emptyStateTitle}>No Activities</Text>
                <Text style={styles.emptyStateText}>No unusual activities found</Text>
              </View>
            ) : (
              allActivities.map(activity => renderActivityCard(activity, true))
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  badgeContainer: {
    position: 'relative',
  },
  badge: {
    backgroundColor: '#f44336',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  activityCard: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#e91e63',
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  activityType: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityTypeIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  activityTypeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  severityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  severityIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  severityText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  activityDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  activityFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  activityTime: {
    fontSize: 12,
    color: '#999',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  resolveButton: {
    backgroundColor: '#e91e63',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-end',
  },
  resolveButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  viewAllButton: {
    backgroundColor: '#f8f8f8',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  viewAllButtonText: {
    color: '#e91e63',
    fontSize: 14,
    fontWeight: '600',
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
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    fontSize: 16,
    color: '#e91e63',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
});
