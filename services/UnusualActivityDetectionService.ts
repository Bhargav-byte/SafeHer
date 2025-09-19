// Unusual Activity Detection Service
export interface UnusualActivity {
  id: string;
  userId: string;
  eventType: 'late_night_exit' | 'route_deviation' | 'missed_checkin' | 'repeated_sos' | 'health_anomaly';
  details: string;
  timestamp: Date;
  status: 'active' | 'resolved' | 'investigating';
  severity: 'low' | 'medium' | 'high' | 'critical';
  location?: {
    latitude: number;
    longitude: number;
  };
  metadata?: any;
}

export interface UserSettings {
  id: string;
  userId: string;
  trackLateNightExit: boolean;
  trackRouteDeviation: boolean;
  trackMissedCheckin: boolean;
  trackRepeatedSos: boolean;
  trackHealthAnomaly: boolean;
  safeZoneRadius: number; // in meters
  lateNightStart: string; // HH:MM format
  lateNightEnd: string; // HH:MM format
  sosThreshold: number; // max SOS per day before flagging
  healthAnomalyThreshold: number; // max health anomalies per hour
  autoSosEnabled: boolean;
  notificationEnabled: boolean;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  timestamp: Date;
  accuracy?: number;
}

export interface HealthData {
  heartRate?: number;
  steps?: number;
  sleepHours?: number;
  timestamp: Date;
}

export class UnusualActivityDetectionService {
  private static instance: UnusualActivityDetectionService;
  private userSettings: UserSettings | null = null;
  private recentLocations: LocationData[] = [];
  private recentHealthData: HealthData[] = [];
  private sosCountToday: number = 0;
  private lastSosDate: string = '';
  private checkInHistory: Date[] = [];
  private normalRoutes: LocationData[][] = [];

  static getInstance(): UnusualActivityDetectionService {
    if (!UnusualActivityDetectionService.instance) {
      UnusualActivityDetectionService.instance = new UnusualActivityDetectionService();
    }
    return UnusualActivityDetectionService.instance;
  }

  // Initialize with user settings
  async initialize(userId: string): Promise<void> {
    await this.loadUserSettings(userId);
    await this.loadRecentData(userId);
  }

  // Main detection function - call this when new data arrives
  async detectUnusualEvent(
    userId: string,
    eventType: 'location' | 'checkin' | 'sos' | 'health',
    data: any
  ): Promise<UnusualActivity[]> {
    const activities: UnusualActivity[] = [];

    if (!this.userSettings) {
      await this.loadUserSettings(userId);
    }

    switch (eventType) {
      case 'location':
        activities.push(...await this.detectLocationAnomalies(userId, data));
        break;
      case 'checkin':
        activities.push(...await this.detectCheckInAnomalies(userId, data));
        break;
      case 'sos':
        activities.push(...await this.detectSosAnomalies(userId, data));
        break;
      case 'health':
        activities.push(...await this.detectHealthAnomalies(userId, data));
        break;
    }

    // Store detected activities
    for (const activity of activities) {
      await this.storeUnusualActivity(activity);
    }

    // Check for auto-SOS trigger
    await this.checkAutoSosTrigger(userId);

    return activities;
  }

  // Location-based anomaly detection
  private async detectLocationAnomalies(userId: string, locationData: LocationData): Promise<UnusualActivity[]> {
    const activities: UnusualActivity[] = [];

    // Add to recent locations
    this.recentLocations.push(locationData);
    if (this.recentLocations.length > 100) {
      this.recentLocations = this.recentLocations.slice(-100);
    }

    // 1. Late-night safe zone exit detection
    if (this.userSettings?.trackLateNightExit) {
      const isLateNight = this.isLateNightTime(locationData.timestamp);
      const isOutsideSafeZone = await this.isOutsideSafeZone(locationData);
      
      if (isLateNight && isOutsideSafeZone) {
        activities.push({
          id: this.generateId(),
          userId,
          eventType: 'late_night_exit',
          details: `User detected outside safe zone during late night hours (${locationData.timestamp.toLocaleTimeString()})`,
          timestamp: locationData.timestamp,
          status: 'active',
          severity: 'high',
          location: { latitude: locationData.latitude, longitude: locationData.longitude },
          metadata: { safeZoneRadius: this.userSettings?.safeZoneRadius }
        });
      }
    }

    // 2. Route deviation detection
    if (this.userSettings?.trackRouteDeviation) {
      const isRouteDeviation = await this.detectRouteDeviation(locationData);
      
      if (isRouteDeviation) {
        activities.push({
          id: this.generateId(),
          userId,
          eventType: 'route_deviation',
          details: 'Significant deviation from normal travel routes detected',
          timestamp: locationData.timestamp,
          status: 'active',
          severity: 'medium',
          location: { latitude: locationData.latitude, longitude: locationData.longitude },
          metadata: { deviationDistance: this.calculateDeviationDistance(locationData) }
        });
      }
    }

    return activities;
  }

  // Check-in anomaly detection
  private async detectCheckInAnomalies(userId: string, checkInData: any): Promise<UnusualActivity[]> {
    const activities: UnusualActivity[] = [];

    if (this.userSettings?.trackMissedCheckin) {
      // Check if user missed expected check-ins
      const missedCheckIns = await this.detectMissedCheckIns();
      
      if (missedCheckIns > 0) {
        activities.push({
          id: this.generateId(),
          userId,
          eventType: 'missed_checkin',
          details: `User missed ${missedCheckIns} expected check-in(s)`,
          timestamp: new Date(),
          status: 'active',
          severity: missedCheckIns > 2 ? 'high' : 'medium'
        });
      }
    }

    return activities;
  }

  // SOS anomaly detection
  private async detectSosAnomalies(userId: string, sosData: any): Promise<UnusualActivity[]> {
    const activities: UnusualActivity[] = [];

    if (this.userSettings?.trackRepeatedSos) {
      const today = new Date().toDateString();
      
      // Reset counter if new day
      if (this.lastSosDate !== today) {
        this.sosCountToday = 0;
        this.lastSosDate = today;
      }

      this.sosCountToday++;

      // Check if SOS count exceeds threshold
      if (this.sosCountToday >= (this.userSettings?.sosThreshold || 2)) {
        activities.push({
          id: this.generateId(),
          userId,
          eventType: 'repeated_sos',
          details: `Multiple SOS triggers detected (${this.sosCountToday} times today)`,
          timestamp: new Date(),
          status: 'active',
          severity: this.sosCountToday >= 5 ? 'critical' : 'high',
          metadata: { sosCount: this.sosCountToday }
        });
      }
    }

    return activities;
  }

  // Health anomaly detection
  private async detectHealthAnomalies(userId: string, healthData: HealthData): Promise<UnusualActivity[]> {
    const activities: UnusualActivity[] = [];

    if (this.userSettings?.trackHealthAnomaly) {
      // Add to recent health data
      this.recentHealthData.push(healthData);
      if (this.recentHealthData.length > 50) {
        this.recentHealthData = this.recentHealthData.slice(-50);
      }

      // Detect multiple health anomalies within short time
      const recentAnomalies = this.detectRecentHealthAnomalies();
      
      if (recentAnomalies.length >= (this.userSettings?.healthAnomalyThreshold || 3)) {
        activities.push({
          id: this.generateId(),
          userId,
          eventType: 'health_anomaly',
          details: `Multiple health anomalies detected: ${recentAnomalies.join(', ')}`,
          timestamp: new Date(),
          status: 'active',
          severity: 'medium',
          metadata: { anomalies: recentAnomalies }
        });
      }
    }

    return activities;
  }

  // Helper methods
  private isLateNightTime(timestamp: Date): boolean {
    if (!this.userSettings) return false;
    
    const hour = timestamp.getHours();
    const startHour = parseInt(this.userSettings.lateNightStart.split(':')[0]);
    const endHour = parseInt(this.userSettings.lateNightEnd.split(':')[0]);
    
    return hour >= startHour || hour < endHour;
  }

  private async isOutsideSafeZone(location: LocationData): Promise<boolean> {
    // This would typically check against user's defined safe zones
    // For now, we'll use a simple radius check from home location
    const homeLocation = { latitude: 40.7128, longitude: -74.0060 }; // Default NYC
    const distance = this.calculateDistance(homeLocation, location);
    
    return distance > (this.userSettings?.safeZoneRadius || 1000);
  }

  private async detectRouteDeviation(location: LocationData): Promise<boolean> {
    if (this.normalRoutes.length < 3) return false;

    // Check if current location significantly deviates from normal routes
    const recentRoute = this.recentLocations.slice(-10); // Last 10 locations
    const deviationThreshold = 500; // 500 meters

    for (const normalRoute of this.normalRoutes) {
      const avgDeviation = this.calculateRouteDeviation(recentRoute, normalRoute);
      if (avgDeviation > deviationThreshold) {
        return true;
      }
    }

    return false;
  }

  private async detectMissedCheckIns(): Promise<number> {
    // Check if user has missed expected check-ins based on patterns
    const now = new Date();
    const expectedCheckIns = this.calculateExpectedCheckIns(now);
    const actualCheckIns = this.checkInHistory.filter(
      checkIn => this.isSameDay(checkIn, now)
    ).length;

    return Math.max(0, expectedCheckIns - actualCheckIns);
  }

  private detectRecentHealthAnomalies(): string[] {
    const anomalies: string[] = [];
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const recentHealthData = this.recentHealthData.filter(
      data => data.timestamp >= oneHourAgo
    );

    // Check for elevated heart rate
    const elevatedHeartRate = recentHealthData.some(data => 
      data.heartRate && data.heartRate > 100
    );
    if (elevatedHeartRate) anomalies.push('Elevated Heart Rate');

    // Check for missed steps
    const missedSteps = recentHealthData.some(data => 
      data.steps && data.steps < 1000
    );
    if (missedSteps) anomalies.push('Low Step Count');

    // Check for poor sleep
    const poorSleep = recentHealthData.some(data => 
      data.sleepHours && data.sleepHours < 4
    );
    if (poorSleep) anomalies.push('Poor Sleep Quality');

    return anomalies;
  }

  private calculateDistance(loc1: LocationData, loc2: LocationData): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = loc1.latitude * Math.PI / 180;
    const φ2 = loc2.latitude * Math.PI / 180;
    const Δφ = (loc2.latitude - loc1.latitude) * Math.PI / 180;
    const Δλ = (loc2.longitude - loc1.longitude) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }

  private calculateRouteDeviation(route1: LocationData[], route2: LocationData[]): number {
    if (route1.length === 0 || route2.length === 0) return 0;

    let totalDeviation = 0;
    const minLength = Math.min(route1.length, route2.length);

    for (let i = 0; i < minLength; i++) {
      totalDeviation += this.calculateDistance(route1[i], route2[i]);
    }

    return totalDeviation / minLength;
  }

  private calculateDeviationDistance(location: LocationData): number {
    if (this.normalRoutes.length === 0) return 0;

    let minDistance = Infinity;
    for (const route of this.normalRoutes) {
      for (const routePoint of route) {
        const distance = this.calculateDistance(location, routePoint);
        minDistance = Math.min(minDistance, distance);
      }
    }

    return minDistance;
  }

  private calculateExpectedCheckIns(date: Date): number {
    // Simple logic: expect check-ins every 2 hours during active hours (8 AM - 10 PM)
    const hour = date.getHours();
    if (hour < 8 || hour > 22) return 0;
    
    return Math.floor((hour - 8) / 2) + 1;
  }

  private isSameDay(date1: Date, date2: Date): boolean {
    return date1.toDateString() === date2.toDateString();
  }

  private async checkAutoSosTrigger(userId: string): Promise<void> {
    if (!this.userSettings?.autoSosEnabled) return;

    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    const recentActivities = await this.getUnusualActivities(userId, thirtyMinutesAgo);

    if (recentActivities.length >= 3) {
      // Trigger auto-SOS
      await this.triggerAutoSos(userId, recentActivities);
    }
  }

  private async triggerAutoSos(userId: string, activities: UnusualActivity[]): Promise<void> {
    console.log('🚨 AUTO-SOS TRIGGERED:', activities);
    
    // This would integrate with your existing SOS system
    // For now, we'll just log it
    const sosData = {
      userId,
      triggerType: 'unusual_activities',
      activities: activities.map(a => a.eventType),
      timestamp: new Date(),
      location: activities[0]?.location
    };

    // Call your existing SOS API
    // await this.callSosApi(sosData);
  }

  // Data management methods
  private async loadUserSettings(userId: string): Promise<void> {
    // Load from Supabase or use defaults
    this.userSettings = {
      id: 'default',
      userId,
      trackLateNightExit: true,
      trackRouteDeviation: true,
      trackMissedCheckin: true,
      trackRepeatedSos: true,
      trackHealthAnomaly: true,
      safeZoneRadius: 1000,
      lateNightStart: '22:00',
      lateNightEnd: '05:00',
      sosThreshold: 2,
      healthAnomalyThreshold: 3,
      autoSosEnabled: true,
      notificationEnabled: true
    };
  }

  private async loadRecentData(userId: string): Promise<void> {
    // Load recent locations, health data, etc. from storage
    // This would typically come from Supabase
  }

  private async storeUnusualActivity(activity: UnusualActivity): Promise<void> {
    console.log('Storing unusual activity:', activity);
    // Store in Supabase unusual_activities table
  }

  private async getUnusualActivities(userId: string, since: Date): Promise<UnusualActivity[]> {
    // Get activities from Supabase
    return [];
  }

  private generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  // Public methods for UI
  async getUnresolvedActivitiesCount(userId: string): Promise<number> {
    const activities = await this.getUnusualActivities(userId, new Date(Date.now() - 24 * 60 * 60 * 1000));
    return activities.filter(a => a.status === 'active').length;
  }

  async getRecentActivities(userId: string, limit: number = 3): Promise<UnusualActivity[]> {
    const activities = await this.getUnusualActivities(userId, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
    return activities.slice(0, limit);
  }

  async markActivityResolved(activityId: string): Promise<void> {
    console.log('Marking activity as resolved:', activityId);
    // Update in Supabase
  }

  async updateUserSettings(settings: Partial<UserSettings>): Promise<void> {
    if (this.userSettings) {
      this.userSettings = { ...this.userSettings, ...settings };
      // Save to Supabase
    }
  }
}

export default UnusualActivityDetectionService;
