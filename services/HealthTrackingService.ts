// Comprehensive Health Tracking Data Types and Services
export interface CycleData {
  id: string;
  userId: string;
  startDate: Date;
  endDate?: Date;
  cycleLength: number;
  periodLength: number;
  flowLevel: 'light' | 'medium' | 'heavy';
  symptoms: string[];
  notes?: string;
}

export interface SymptomLog {
  id: string;
  userId: string;
  date: Date;
  cramps: 'none' | 'mild' | 'severe';
  fatigue: number; // 1-10 scale
  mood: 'happy' | 'sad' | 'angry' | 'anxious' | 'neutral' | 'irritable';
  moods?: string[]; // Array of moods (up to 2)
  symptoms: string[]; // nausea, headache, acne, etc.
  flowLevel: 'light' | 'medium' | 'heavy' | 'spotting' | 'none';
  notes?: string;
}

export interface BodyMetrics {
  id: string;
  userId: string;
  date: Date;
  weight?: number;
  basalBodyTemp?: number;
  heartRate?: number;
  sleepHours?: number;
  sleepQuality: 'poor' | 'fair' | 'good' | 'excellent';
  waterIntake: number; // glasses per day
}

export interface Reminder {
  id: string;
  userId: string;
  type: 'period' | 'pms' | 'medication' | 'water' | 'wellness' | 'stretch' | 'sleep';
  title: string;
  description: string;
  time: string; // HH:MM format
  isActive: boolean;
  daysOfWeek: number[]; // 0-6 (Sunday-Saturday)
}

export interface CycleInsight {
  averageCycleLength: number;
  averagePeriodLength: number;
  cycleRegularity: 'regular' | 'irregular' | 'very irregular';
  commonSymptoms: string[];
  moodPatterns: { [key: string]: number };
  fertileWindow: { start: Date; end: Date };
  nextPeriodPrediction: Date;
  irregularityAlerts: string[];
}

export interface SafetyAlert {
  id: string;
  userId: string;
  triggerType: 'severe_pain' | 'irregular_cycle' | 'emergency_symptom';
  message: string;
  timestamp: Date;
  isResolved: boolean;
  emergencyContactNotified: boolean;
}

// Health Tracking Service
export class HealthTrackingService {
  private static instance: HealthTrackingService;
  
  static getInstance(): HealthTrackingService {
    if (!HealthTrackingService.instance) {
      HealthTrackingService.instance = new HealthTrackingService();
    }
    return HealthTrackingService.instance;
  }

  // Cycle Tracking Methods
  async logCycleStart(userId: string, startDate: Date, flowLevel: 'light' | 'medium' | 'heavy'): Promise<CycleData> {
    const cycleData: CycleData = {
      id: this.generateId(),
      userId,
      startDate,
      cycleLength: 28, // Default, will be calculated based on history
      periodLength: 5, // Default
      flowLevel,
      symptoms: [],
    };
    
    // Store in local storage for now (can be moved to Supabase later)
    await this.storeCycleData(cycleData);
    return cycleData;
  }

  async logSymptom(userId: string, symptomData: Omit<SymptomLog, 'id' | 'userId'>): Promise<SymptomLog> {
    const symptomLog: SymptomLog = {
      id: this.generateId(),
      userId,
      ...symptomData,
    };
    
    await this.storeSymptomLog(symptomLog);
    return symptomLog;
  }

  async logBodyMetrics(userId: string, metricsData: Omit<BodyMetrics, 'id' | 'userId'>): Promise<BodyMetrics> {
    const bodyMetrics: BodyMetrics = {
      id: this.generateId(),
      userId,
      ...metricsData,
    };
    
    await this.storeBodyMetrics(bodyMetrics);
    return bodyMetrics;
  }

  async createReminder(userId: string, reminderData: Omit<Reminder, 'id' | 'userId'>): Promise<Reminder> {
    const reminder: Reminder = {
      id: this.generateId(),
      userId,
      ...reminderData,
    };
    
    await this.storeReminder(reminder);
    return reminder;
  }

  // Prediction Methods
  calculateNextPeriod(cycles: CycleData[]): Date {
    if (cycles.length === 0) {
      // Default to 28-day cycle if no history
      return new Date(Date.now() + 28 * 24 * 60 * 60 * 1000);
    }

    const avgCycleLength = cycles.reduce((sum, cycle) => sum + cycle.cycleLength, 0) / cycles.length;
    const lastCycle = cycles[cycles.length - 1];
    const nextPeriod = new Date(lastCycle.startDate);
    nextPeriod.setDate(nextPeriod.getDate() + avgCycleLength);
    
    return nextPeriod;
  }

  calculateFertileWindow(cycles: CycleData[]): { start: Date; end: Date } {
    const avgCycleLength = cycles.length > 0 
      ? cycles.reduce((sum, cycle) => sum + cycle.cycleLength, 0) / cycles.length 
      : 28;
    
    const ovulationDay = avgCycleLength - 14; // Typically 14 days before next period
    const fertileStart = ovulationDay - 5; // 5 days before ovulation
    const fertileEnd = ovulationDay + 1; // 1 day after ovulation
    
    const today = new Date();
    const fertileStartDate = new Date(today);
    fertileStartDate.setDate(fertileStartDate.getDate() + fertileStart);
    
    const fertileEndDate = new Date(today);
    fertileEndDate.setDate(fertileEndDate.getDate() + fertileEnd);
    
    return { start: fertileStartDate, end: fertileEndDate };
  }

  // Insight Generation
  async generateCycleInsights(userId: string): Promise<CycleInsight> {
    const cycles = await this.getCycleHistory(userId);
    const symptoms = await this.getSymptomHistory(userId);
    
    const avgCycleLength = cycles.length > 0 
      ? cycles.reduce((sum, cycle) => sum + cycle.cycleLength, 0) / cycles.length 
      : 28;
    
    const avgPeriodLength = cycles.length > 0 
      ? cycles.reduce((sum, cycle) => sum + cycle.periodLength, 0) / cycles.length 
      : 5;

    // Calculate cycle regularity
    let cycleRegularity: 'regular' | 'irregular' | 'very irregular' = 'regular';
    if (cycles.length >= 3) {
      const cycleLengths = cycles.map(c => c.cycleLength);
      const variance = this.calculateVariance(cycleLengths);
      if (variance > 7) cycleRegularity = 'irregular';
      if (variance > 14) cycleRegularity = 'very irregular';
    }

    // Analyze common symptoms
    const symptomCounts: { [key: string]: number } = {};
    symptoms.forEach(symptom => {
      symptom.symptoms.forEach(s => {
        symptomCounts[s] = (symptomCounts[s] || 0) + 1;
      });
    });
    const commonSymptoms = Object.entries(symptomCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([symptom]) => symptom);

    // Analyze mood patterns
    const moodCounts: { [key: string]: number } = {};
    symptoms.forEach(symptom => {
      moodCounts[symptom.mood] = (moodCounts[symptom.mood] || 0) + 1;
    });

    const fertileWindow = this.calculateFertileWindow(cycles);
    const nextPeriodPrediction = this.calculateNextPeriod(cycles);

    // Generate irregularity alerts
    const irregularityAlerts: string[] = [];
    if (cycleRegularity === 'irregular') {
      irregularityAlerts.push('Your cycles are showing irregular patterns. Consider consulting a healthcare provider.');
    }
    if (avgCycleLength < 21 || avgCycleLength > 35) {
      irregularityAlerts.push('Your cycle length is outside the normal range (21-35 days).');
    }

    return {
      averageCycleLength: Math.round(avgCycleLength),
      averagePeriodLength: Math.round(avgPeriodLength),
      cycleRegularity,
      commonSymptoms,
      moodPatterns: moodCounts,
      fertileWindow,
      nextPeriodPrediction,
      irregularityAlerts,
    };
  }

  // Safety Integration
  async checkSafetyTriggers(userId: string, symptomLog: SymptomLog): Promise<SafetyAlert[]> {
    const alerts: SafetyAlert[] = [];
    
    // Check for severe pain
    if (symptomLog.cramps === 'severe') {
      alerts.push({
        id: this.generateId(),
        userId,
        triggerType: 'severe_pain',
        message: 'Severe pain detected. Would you like to alert your emergency contacts?',
        timestamp: new Date(),
        isResolved: false,
        emergencyContactNotified: false,
      });
    }

    // Check for emergency symptoms
    const emergencySymptoms = ['severe bleeding', 'fainting', 'severe nausea', 'chest pain'];
    const hasEmergencySymptom = symptomLog.symptoms.some(symptom => 
      emergencySymptoms.some(emergency => symptom.toLowerCase().includes(emergency))
    );

    if (hasEmergencySymptom) {
      alerts.push({
        id: this.generateId(),
        userId,
        triggerType: 'emergency_symptom',
        message: 'Emergency symptom detected. Please seek medical attention immediately.',
        timestamp: new Date(),
        isResolved: false,
        emergencyContactNotified: false,
      });
    }

    return alerts;
  }

  // Cycle Day Calculation
  calculateCurrentCycleDay(userId: string, lastPeriodDate: Date, cycleLength: number = 28): { cycleDay: number; phase: string; phaseDay: number } {
    const today = new Date();
    const daysSinceLastPeriod = Math.floor((today.getTime() - lastPeriodDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Calculate cycle day (reset to 1 when cycle length is reached)
    let cycleDay = (daysSinceLastPeriod % cycleLength) + 1;
    
    // If we're past the expected next period, reset to 1
    const expectedNextPeriod = new Date(lastPeriodDate);
    expectedNextPeriod.setDate(expectedNextPeriod.getDate() + cycleLength);
    
    if (today > expectedNextPeriod) {
      cycleDay = 1; // New cycle started
    }
    
    // Determine cycle phase
    let phase: string;
    let phaseDay: number;
    
    if (cycleDay <= 5) {
      phase = 'Menstrual';
      phaseDay = cycleDay;
    } else if (cycleDay <= 13) {
      phase = 'Follicular';
      phaseDay = cycleDay - 5;
    } else if (cycleDay <= 16) {
      phase = 'Ovulation';
      phaseDay = cycleDay - 13;
    } else {
      phase = 'Luteal';
      phaseDay = cycleDay - 16;
    }
    
    return { cycleDay, phase, phaseDay };
  }

  // Wellness Recommendations
  getWellnessRecommendations(cyclePhase: string, symptoms: string[]): string[] {
    const recommendations: string[] = [];
    
    switch (cyclePhase) {
      case 'Menstrual':
        recommendations.push('Stay hydrated and rest more');
        recommendations.push('Gentle yoga or stretching');
        recommendations.push('Iron-rich foods for energy');
        if (symptoms.includes('cramps')) {
          recommendations.push('Heat therapy for cramps');
          recommendations.push('Magnesium supplements');
        }
        break;
      case 'Follicular':
        recommendations.push('Light to moderate exercise');
        recommendations.push('Focus on protein-rich foods');
        recommendations.push('Good time for new habits');
        break;
      case 'Ovulation':
        recommendations.push('Peak energy - great for intense workouts');
        recommendations.push('High-protein, balanced meals');
        recommendations.push('Social activities and networking');
        break;
      case 'Luteal':
        recommendations.push('Comfort foods in moderation');
        recommendations.push('Stress management techniques');
        recommendations.push('Prepare for upcoming period');
        if (symptoms.includes('mood swings')) {
          recommendations.push('Meditation and mindfulness');
          recommendations.push('Limit caffeine and sugar');
        }
        break;
    }

    return recommendations;
  }

  // Private helper methods
  private generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  private calculateVariance(numbers: number[]): number {
    const mean = numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
    const variance = numbers.reduce((sum, num) => sum + Math.pow(num - mean, 2), 0) / numbers.length;
    return Math.sqrt(variance);
  }

  // Storage methods (can be replaced with Supabase later)
  private async storeCycleData(cycleData: CycleData): Promise<void> {
    // Implementation for local storage or Supabase
    console.log('Storing cycle data:', cycleData);
  }

  private async storeSymptomLog(symptomLog: SymptomLog): Promise<void> {
    console.log('Storing symptom log:', symptomLog);
  }

  private async storeBodyMetrics(bodyMetrics: BodyMetrics): Promise<void> {
    console.log('Storing body metrics:', bodyMetrics);
  }

  private async storeReminder(reminder: Reminder): Promise<void> {
    console.log('Storing reminder:', reminder);
  }

  private async getCycleHistory(userId: string): Promise<CycleData[]> {
    // Implementation to retrieve cycle history
    return [];
  }

  private async getSymptomHistory(userId: string): Promise<SymptomLog[]> {
    // Implementation to retrieve symptom history
    return [];
  }
}

export default HealthTrackingService;
