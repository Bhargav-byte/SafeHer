import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { saveUserProfile } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';

interface OnboardingStep1Props {
  onNext: (data: { name: string; age: string; height: string }) => void;
}

export const OnboardingStep1: React.FC<OnboardingStep1Props> = ({ onNext }) => {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');

  const handleNext = () => {
    if (!name || !age || !height) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const ageNum = parseInt(age);
    const heightNum = parseInt(height);

    if (isNaN(ageNum) || ageNum < 13 || ageNum > 100) {
      Alert.alert('Error', 'Please enter a valid age (13-100)');
      return;
    }

    if (isNaN(heightNum) || heightNum < 100 || heightNum > 250) {
      Alert.alert('Error', 'Please enter a valid height (100-250 cm)');
      return;
    }

    onNext({ name, age, height });
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Personal Details</Text>
          <Text style={styles.subtitle}>Step 1 of 3</Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter your full name"
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Age</Text>
            <TextInput
              style={styles.input}
              value={age}
              onChangeText={setAge}
              placeholder="Enter your age"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Height (cm)</Text>
            <TextInput
              style={styles.input}
              value={height}
              onChangeText={setHeight}
              placeholder="Enter your height in cm"
              keyboardType="numeric"
            />
          </View>

          <TouchableOpacity style={styles.button} onPress={handleNext}>
            <Text style={styles.buttonText}>Next</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

interface OnboardingStep2Props {
  onNext: (data: { goal: string; dietType: string }) => void;
  onBack: () => void;
}

export const OnboardingStep2: React.FC<OnboardingStep2Props> = ({ onNext, onBack }) => {
  const [goal, setGoal] = useState('');
  const [dietType, setDietType] = useState('');

  const goals = ['Maintain Weight', 'Weight Loss', 'Weight Gain', 'General Wellness'];
  const dietTypes = ['Vegetarian', 'Non-Vegetarian', 'Vegan', 'Other'];

  const handleNext = () => {
    if (!goal || !dietType) {
      Alert.alert('Error', 'Please select both options');
      return;
    }
    onNext({ goal, dietType });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Lifestyle & Goals</Text>
        <Text style={styles.subtitle}>Step 2 of 3</Text>
      </View>

      <View style={styles.formContainer}>
        <View style={styles.questionContainer}>
          <Text style={styles.questionLabel}>What is your main goal?</Text>
          {goals.map((option) => (
            <TouchableOpacity
              key={option}
              style={[styles.optionButton, goal === option && styles.optionButtonSelected]}
              onPress={() => setGoal(option)}
            >
              <Text style={[styles.optionText, goal === option && styles.optionTextSelected]}>
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.questionContainer}>
          <Text style={styles.questionLabel}>Diet Type</Text>
          {dietTypes.map((option) => (
            <TouchableOpacity
              key={option}
              style={[styles.optionButton, dietType === option && styles.optionButtonSelected]}
              onPress={() => setDietType(option)}
            >
              <Text style={[styles.optionText, dietType === option && styles.optionTextSelected]}>
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={handleNext}>
            <Text style={styles.buttonText}>Next</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

interface OnboardingStep3Props {
  onFinish: (contacts: Array<{ name: string; phone: string }>) => void;
  onBack: () => void;
}

export const OnboardingStep3: React.FC<OnboardingStep3Props> = ({ onFinish, onBack }) => {
  const [contacts, setContacts] = useState<Array<{ name: string; phone: string }>>([
    { name: '', phone: '' }
  ]);

  const addContact = () => {
    setContacts([...contacts, { name: '', phone: '' }]);
  };

  const updateContact = (index: number, field: 'name' | 'phone', value: string) => {
    const updatedContacts = [...contacts];
    updatedContacts[index][field] = value;
    setContacts(updatedContacts);
  };

  const removeContact = (index: number) => {
    if (contacts.length > 1) {
      setContacts(contacts.filter((_, i) => i !== index));
    }
  };

  const handleFinish = async () => {
    const validContacts = contacts.filter(contact => contact.name.trim() && contact.phone.trim());
    
    if (validContacts.length === 0) {
      Alert.alert('Error', 'Please add at least one emergency contact');
      return;
    }

    onFinish(validContacts);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Emergency Contacts</Text>
        <Text style={styles.subtitle}>Step 3 of 3</Text>
      </View>

      <View style={styles.formContainer}>
        <Text style={styles.questionLabel}>
          Add at least one emergency contact who can help you in case of an emergency.
        </Text>

        {contacts.map((contact, index) => (
          <View key={index} style={styles.contactContainer}>
            <View style={styles.contactHeader}>
              <Text style={styles.contactTitle}>Contact {index + 1}</Text>
              {contacts.length > 1 && (
                <TouchableOpacity onPress={() => removeContact(index)}>
                  <Text style={styles.removeButton}>Remove</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Name</Text>
              <TextInput
                style={styles.input}
                value={contact.name}
                onChangeText={(value) => updateContact(index, 'name', value)}
                placeholder="Enter contact name"
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <TextInput
                style={styles.input}
                value={contact.phone}
                onChangeText={(value) => updateContact(index, 'phone', value)}
                placeholder="Enter phone number"
                keyboardType="phone-pad"
              />
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.addButton} onPress={addContact}>
          <Text style={styles.addButtonText}>+ Add Another Contact</Text>
        </TouchableOpacity>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={handleFinish}>
            <Text style={styles.buttonText}>Finish</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  header: {
    backgroundColor: '#e91e63',
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'white',
    opacity: 0.9,
    fontWeight: '400',
  },
  formContainer: {
    backgroundColor: 'white',
    margin: 20,
    padding: 30,
    borderRadius: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  questionContainer: {
    marginBottom: 30,
  },
  questionLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  optionButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginBottom: 10,
    backgroundColor: '#f9f9f9',
  },
  optionButtonSelected: {
    borderColor: '#e91e63',
    backgroundColor: '#fde2e2',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  optionTextSelected: {
    color: '#e91e63',
    fontWeight: 'bold',
  },
  contactContainer: {
    marginBottom: 25,
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
  },
  contactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  removeButton: {
    color: '#e91e63',
    fontSize: 14,
    fontWeight: 'bold',
  },
  addButton: {
    borderWidth: 2,
    borderColor: '#e91e63',
    borderStyle: 'dashed',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 30,
  },
  addButtonText: {
    color: '#e91e63',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    backgroundColor: '#e91e63',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    alignItems: 'center',
    flex: 0.45,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  backButton: {
    backgroundColor: '#f5f5f5',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    alignItems: 'center',
    flex: 0.45,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  backButtonText: {
    color: '#666',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
