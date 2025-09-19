import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { SymptomLog } from '../services/HealthTrackingService';

interface SymptomTrackingProps {
  onSymptomLogged: (symptomLog: SymptomLog) => void;
}

export default function SymptomTracking({ onSymptomLogged }: SymptomTrackingProps) {
  const [cramps, setCramps] = useState<'none' | 'mild' | 'severe'>('none');
  const [fatigue, setFatigue] = useState(5);
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [flowLevel, setFlowLevel] = useState<'light' | 'medium' | 'heavy' | 'spotting' | 'none'>('none');
  const [notes, setNotes] = useState('');
  const [showSymptomModal, setShowSymptomModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  const availableSymptoms = [
    'Nausea', 'Headache', 'Acne', 'Bloating', 'Breast tenderness',
    'Mood swings', 'Food cravings', 'Back pain', 'Insomnia', 'Hot flashes',
    'Dizziness', 'Constipation', 'Diarrhea', 'Gas', 'Swelling'
  ];

  const moodOptions = [
    { key: 'happy', emoji: '😊', label: 'Happy' },
    { key: 'sad', emoji: '😢', label: 'Sad' },
    { key: 'angry', emoji: '😠', label: 'Angry' },
    { key: 'anxious', emoji: '😰', label: 'Anxious' },
    { key: 'neutral', emoji: '😐', label: 'Neutral' },
    { key: 'irritable', emoji: '😤', label: 'Irritable' },
  ];

  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms(prev => 
      prev.includes(symptom) 
        ? prev.filter(s => s !== symptom)
        : [...prev, symptom]
    );
  };

  const toggleMood = (moodKey: string) => {
    setSelectedMoods(prev => {
      if (prev.includes(moodKey)) {
        // Remove mood if already selected
        return prev.filter(m => m !== moodKey);
      } else if (prev.length < 2) {
        // Add mood if less than 2 selected
        return [...prev, moodKey];
      } else {
        // Replace first mood if 2 already selected
        return [prev[1], moodKey];
      }
    });
  };

  const checkNow = () => {
    const symptomLog: Omit<SymptomLog, 'id' | 'userId'> = {
      date: new Date(),
      cramps,
      fatigue,
      mood: selectedMoods.length > 0 ? selectedMoods[0] as any : 'neutral', // Use first selected mood for compatibility
      moods: selectedMoods, // Add new moods array
      symptoms: selectedSymptoms,
      flowLevel,
      notes: notes.trim() || undefined,
    };

    // Perform health analysis
    const analysis = performHealthAnalysis(symptomLog);
    setAnalysisResult(analysis);
    setShowAnalysisModal(true);

    // Log the symptoms
    onSymptomLogged(symptomLog as SymptomLog);
  };

  const performHealthAnalysis = (symptomLog: Omit<SymptomLog, 'id' | 'userId'> & { moods?: string[] }) => {
    const analysis = {
      overallHealth: 'good',
      concerns: [] as string[],
      recommendations: [] as string[],
      moodAnalysis: '',
      symptomSeverity: 'mild',
      cyclePhase: 'unknown'
    };

    // Analyze mood(s) - check both single mood and moods array
    const moodsToAnalyze = symptomLog.moods || [symptomLog.mood];
    const hasNegativeMoods = moodsToAnalyze.some(mood => ['anxious', 'angry', 'irritable', 'sad'].includes(mood));
    const hasPositiveMoods = moodsToAnalyze.some(mood => ['happy', 'neutral'].includes(mood));
    
    if (hasNegativeMoods) {
      if (moodsToAnalyze.length > 1) {
        analysis.moodAnalysis = `You're experiencing mixed emotions: ${moodsToAnalyze.join(' and ')}. This suggests you might be going through hormonal changes or stress.`;
      } else {
        analysis.moodAnalysis = 'Your mood suggests you might be experiencing stress or hormonal changes.';
      }
      analysis.concerns.push('Mood fluctuations');
      analysis.recommendations.push('Practice relaxation techniques like deep breathing or meditation');
      analysis.recommendations.push('Consider gentle exercise like yoga or walking');
    } else if (hasPositiveMoods) {
      if (moodsToAnalyze.length > 1) {
        analysis.moodAnalysis = `You're feeling ${moodsToAnalyze.join(' and ')} - that's great! Your emotional state appears balanced.`;
      } else {
        analysis.moodAnalysis = 'Your mood appears stable and positive!';
      }
    }

    // Analyze fatigue
    if (symptomLog.fatigue >= 8) {
      analysis.concerns.push('High fatigue levels');
      analysis.recommendations.push('Ensure you\'re getting 7-9 hours of quality sleep');
      analysis.recommendations.push('Consider iron-rich foods or supplements');
      analysis.symptomSeverity = 'moderate';
    } else if (symptomLog.fatigue <= 3) {
      analysis.moodAnalysis += ' You have good energy levels!';
    }

    // Analyze cramps
    if (symptomLog.cramps === 'severe') {
      analysis.concerns.push('Severe cramping');
      analysis.recommendations.push('Apply heat therapy (heating pad or warm bath)');
      analysis.recommendations.push('Consider over-the-counter pain relief');
      analysis.recommendations.push('Gentle stretching or light exercise may help');
      analysis.symptomSeverity = 'severe';
    } else if (symptomLog.cramps === 'mild') {
      analysis.concerns.push('Mild discomfort');
      analysis.recommendations.push('Light exercise and staying hydrated can help');
    }

    // Analyze symptoms
    const severeSymptoms = ['Headache', 'Dizziness', 'Hot flashes', 'Insomnia'];
    const moderateSymptoms = ['Nausea', 'Back pain', 'Bloating', 'Breast tenderness'];
    
    const hasSevereSymptoms = symptomLog.symptoms.some(s => severeSymptoms.includes(s));
    const hasModerateSymptoms = symptomLog.symptoms.some(s => moderateSymptoms.includes(s));
    
    if (hasSevereSymptoms) {
      analysis.concerns.push('Multiple severe symptoms');
      analysis.recommendations.push('Consider consulting with a healthcare provider');
      analysis.symptomSeverity = 'severe';
    } else if (hasModerateSymptoms) {
      analysis.concerns.push('Some moderate symptoms');
      analysis.symptomSeverity = 'moderate';
    }

    // Determine overall health
    if (analysis.concerns.length >= 3 || analysis.symptomSeverity === 'severe') {
      analysis.overallHealth = 'needs_attention';
    } else if (analysis.concerns.length >= 1 || analysis.symptomSeverity === 'moderate') {
      analysis.overallHealth = 'fair';
    } else {
      analysis.overallHealth = 'good';
    }

    // Add general recommendations based on overall health
    if (analysis.overallHealth === 'good') {
      analysis.recommendations.push('Keep up the great work! Continue your healthy habits');
    } else {
      analysis.recommendations.push('Stay hydrated throughout the day');
      analysis.recommendations.push('Maintain a balanced diet with plenty of fruits and vegetables');
    }

    return analysis;
  };

  const renderFatigueSlider = () => {
    return (
      <View style={styles.sliderContainer}>
        <Text style={styles.sliderLabel}>Fatigue Level: {fatigue}/10</Text>
        <View style={styles.sliderTrack}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
            <TouchableOpacity
              key={value}
              style={[
                styles.sliderDot,
                value <= fatigue && styles.sliderDotActive
              ]}
              onPress={() => setFatigue(value)}
            />
          ))}
        </View>
        <View style={styles.sliderLabels}>
          <Text style={styles.sliderLabelText}>Low Energy</Text>
          <Text style={styles.sliderLabelText}>High Energy</Text>
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Symptom Tracking</Text>
        <Text style={styles.subtitle}>Log your daily symptoms and mood</Text>
      </View>

      {/* Cramps */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🩸 Cramps</Text>
        <View style={styles.optionContainer}>
          {(['none', 'mild', 'severe'] as const).map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.optionButton,
                cramps === option && styles.optionButtonActive
              ]}
              onPress={() => setCramps(option)}
            >
              <Text style={[
                styles.optionText,
                cramps === option && styles.optionTextActive
              ]}>
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Fatigue Level */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>😴 Fatigue Level</Text>
        {renderFatigueSlider()}
      </View>

      {/* Mood */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>😊 Mood (Select up to 2)</Text>
        <View style={styles.moodContainer}>
          {moodOptions.map((moodOption) => (
            <TouchableOpacity
              key={moodOption.key}
              style={[
                styles.moodButton,
                selectedMoods.includes(moodOption.key) && styles.moodButtonActive
              ]}
              onPress={() => toggleMood(moodOption.key)}
            >
              <Text style={styles.moodEmoji}>{moodOption.emoji}</Text>
              <Text style={[
                styles.moodLabel,
                selectedMoods.includes(moodOption.key) && styles.moodLabelActive
              ]}>
                {moodOption.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {selectedMoods.length > 0 && (
          <View style={styles.selectedMoodsContainer}>
            <Text style={styles.selectedMoodsText}>
              Selected: {selectedMoods.map(mood => moodOptions.find(m => m.key === mood)?.label).join(', ')}
            </Text>
          </View>
        )}
      </View>

      {/* Flow Level */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🩸 Flow Level</Text>
        <View style={styles.optionContainer}>
          {(['none', 'spotting', 'light', 'medium', 'heavy'] as const).map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.optionButton,
                flowLevel === option && styles.optionButtonActive
              ]}
              onPress={() => setFlowLevel(option)}
            >
              <Text style={[
                styles.optionText,
                flowLevel === option && styles.optionTextActive
              ]}>
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Symptoms */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🤕 Other Symptoms</Text>
        <TouchableOpacity 
          style={styles.addSymptomButton}
          onPress={() => setShowSymptomModal(true)}
        >
          <Text style={styles.addSymptomText}>
            {selectedSymptoms.length > 0 
              ? `${selectedSymptoms.length} symptoms selected` 
              : 'Select symptoms'
            }
          </Text>
        </TouchableOpacity>
        
        {selectedSymptoms.length > 0 && (
          <View style={styles.selectedSymptomsContainer}>
            {selectedSymptoms.map((symptom) => (
              <TouchableOpacity
                key={symptom}
                style={styles.selectedSymptomTag}
                onPress={() => toggleSymptom(symptom)}
              >
                <Text style={styles.selectedSymptomText}>{symptom}</Text>
                <Text style={styles.removeIcon}>×</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Notes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📝 Notes</Text>
        <TouchableOpacity 
          style={styles.notesButton}
          onPress={() => setShowNotesModal(true)}
        >
          <Text style={styles.notesText}>
            {notes ? 'Edit notes' : 'Add notes (optional)'}
          </Text>
        </TouchableOpacity>
        {notes && (
          <Text style={styles.notesPreview}>{notes}</Text>
        )}
      </View>

      {/* Check Now Button */}
      <TouchableOpacity style={styles.checkButton} onPress={checkNow}>
        <Text style={styles.checkButtonText}>Check Now</Text>
      </TouchableOpacity>

      {/* Symptom Selection Modal */}
      <Modal
        visible={showSymptomModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Symptoms</Text>
            <TouchableOpacity onPress={() => setShowSymptomModal(false)}>
              <Text style={styles.closeButton}>Done</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.symptomsGrid}>
              {availableSymptoms.map((symptom) => (
                <TouchableOpacity
                  key={symptom}
                  style={[
                    styles.symptomOption,
                    selectedSymptoms.includes(symptom) && styles.symptomOptionSelected
                  ]}
                  onPress={() => toggleSymptom(symptom)}
                >
                  <Text style={[
                    styles.symptomOptionText,
                    selectedSymptoms.includes(symptom) && styles.symptomOptionTextSelected
                  ]}>
                    {symptom}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Notes Modal */}
      <Modal
        visible={showNotesModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Notes</Text>
            <TouchableOpacity onPress={() => setShowNotesModal(false)}>
              <Text style={styles.closeButton}>Done</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            <TextInput
              style={styles.notesInput}
              value={notes}
              onChangeText={setNotes}
              placeholder="How are you feeling? Any specific concerns or observations?"
              placeholderTextColor="#999"
              multiline
              textAlignVertical="top"
            />
          </View>
        </View>
      </Modal>

      {/* Health Analysis Modal */}
      <Modal
        visible={showAnalysisModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Health Analysis</Text>
            <TouchableOpacity onPress={() => {
              setShowAnalysisModal(false);
              // Reset form after analysis
              setCramps('none');
              setFatigue(5);
              setSelectedMoods([]);
              setSelectedSymptoms([]);
              setFlowLevel('none');
              setNotes('');
            }}>
              <Text style={styles.closeButton}>Done</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            {analysisResult && (
              <View>
                {/* Overall Health Status */}
                <View style={styles.analysisSection}>
                  <Text style={styles.analysisSectionTitle}>Overall Health Status</Text>
                  <View style={[
                    styles.healthStatusCard,
                    { backgroundColor: getHealthStatusColor(analysisResult.overallHealth) }
                  ]}>
                    <Text style={styles.healthStatusIcon}>
                      {getHealthStatusIcon(analysisResult.overallHealth)}
                    </Text>
                    <Text style={styles.healthStatusText}>
                      {getHealthStatusText(analysisResult.overallHealth)}
                    </Text>
                  </View>
                </View>

                {/* Mood Analysis */}
                {analysisResult.moodAnalysis && (
                  <View style={styles.analysisSection}>
                    <Text style={styles.analysisSectionTitle}>Mood Analysis</Text>
                    <View style={styles.analysisCard}>
                      <Text style={styles.analysisText}>{analysisResult.moodAnalysis}</Text>
                    </View>
                  </View>
                )}

                {/* Concerns */}
                {analysisResult.concerns.length > 0 && (
                  <View style={styles.analysisSection}>
                    <Text style={styles.analysisSectionTitle}>Areas of Concern</Text>
                    {analysisResult.concerns.map((concern: string, index: number) => (
                      <View key={index} style={styles.concernCard}>
                        <Text style={styles.concernIcon}>⚠️</Text>
                        <Text style={styles.concernText}>{concern}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Recommendations */}
                <View style={styles.analysisSection}>
                  <Text style={styles.analysisSectionTitle}>Recommendations</Text>
                  {analysisResult.recommendations.map((recommendation: string, index: number) => (
                    <View key={index} style={styles.recommendationCard}>
                      <Text style={styles.recommendationIcon}>💡</Text>
                      <Text style={styles.recommendationText}>{recommendation}</Text>
                    </View>
                  ))}
                </View>

                {/* Action Button */}
                <TouchableOpacity 
                  style={styles.trackAgainButton}
                  onPress={() => {
                    setShowAnalysisModal(false);
                    // Reset form
                    setCramps('none');
                    setFatigue(5);
                    setSelectedMoods([]);
                    setSelectedSymptoms([]);
                    setFlowLevel('none');
                    setNotes('');
                  }}
                >
                  <Text style={styles.trackAgainButtonText}>Track Again Tomorrow</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
}

// Helper functions for health analysis display
const getHealthStatusColor = (status: string) => {
  switch (status) {
    case 'good': return '#4CAF50';
    case 'fair': return '#ff9800';
    case 'needs_attention': return '#f44336';
    default: return '#666';
  }
};

const getHealthStatusIcon = (status: string) => {
  switch (status) {
    case 'good': return '✅';
    case 'fair': return '⚠️';
    case 'needs_attention': return '🚨';
    default: return '❓';
  }
};

const getHealthStatusText = (status: string) => {
  switch (status) {
    case 'good': return 'You\'re doing great!';
    case 'fair': return 'Some areas to focus on';
    case 'needs_attention': return 'Consider consulting a healthcare provider';
    default: return 'Unknown status';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fef7f7',
  },
  header: {
    backgroundColor: '#e91e63',
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  subtitle: {
    fontSize: 14,
    color: 'white',
    marginTop: 5,
    opacity: 0.9,
  },
  section: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  optionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f8f8f8',
  },
  optionButtonActive: {
    backgroundColor: '#e91e63',
    borderColor: '#e91e63',
  },
  optionText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  optionTextActive: {
    color: 'white',
  },
  sliderContainer: {
    marginVertical: 10,
  },
  sliderLabel: {
    fontSize: 16,
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  sliderTrack: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sliderDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ddd',
    borderWidth: 2,
    borderColor: '#ccc',
  },
  sliderDotActive: {
    backgroundColor: '#e91e63',
    borderColor: '#e91e63',
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sliderLabelText: {
    fontSize: 12,
    color: '#666',
  },
  moodContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  moodButton: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f8f8f8',
    minWidth: 80,
  },
  moodButtonActive: {
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
  selectedMoodsContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#e91e63',
  },
  selectedMoodsText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  addSymptomButton: {
    backgroundColor: '#f8f8f8',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  addSymptomText: {
    fontSize: 16,
    color: '#666',
  },
  selectedSymptomsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 8,
  },
  selectedSymptomTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e91e63',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  selectedSymptomText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 6,
  },
  removeIcon: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  notesButton: {
    backgroundColor: '#f8f8f8',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  notesText: {
    fontSize: 16,
    color: '#666',
  },
  checkButton: {
    backgroundColor: '#e91e63',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 30,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  checkButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  notesPreview: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    padding: 12,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    lineHeight: 20,
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
    minHeight: 120,
    textAlignVertical: 'top',
  },
  // Health Analysis Styles
  analysisSection: {
    marginBottom: 20,
  },
  analysisSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  healthStatusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  healthStatusIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  healthStatusText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
  },
  analysisCard: {
    backgroundColor: '#f8f8f8',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#e91e63',
  },
  analysisText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  concernCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3cd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  concernIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  concernText: {
    fontSize: 14,
    color: '#856404',
    flex: 1,
    fontWeight: '600',
  },
  recommendationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#e8f5e8',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  recommendationIcon: {
    fontSize: 16,
    marginRight: 8,
    marginTop: 2,
  },
  recommendationText: {
    fontSize: 14,
    color: '#2e7d32',
    flex: 1,
    lineHeight: 20,
  },
  trackAgainButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  trackAgainButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
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
  symptomsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  symptomOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f8f8f8',
  },
  symptomOptionSelected: {
    backgroundColor: '#e91e63',
    borderColor: '#e91e63',
  },
  symptomOptionText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  symptomOptionTextSelected: {
    color: 'white',
  },
});
