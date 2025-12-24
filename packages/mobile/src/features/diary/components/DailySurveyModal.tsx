import React, { useState, useEffect, useRef } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert, Animated, Dimensions, StyleSheet } from 'react-native';
import { X, Check } from 'lucide-react-native';
import { DailySurveyData } from '../repositories/DailySurveyRepository';

interface DailySurveyModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: DailySurveyData) => void;
  date: string;
  initialData?: DailySurveyData | null;
}

// Вспомогательный компонент для группы кнопок выбора
const SelectionGroup = <T extends string>({ 
  label, 
  options, 
  value, 
  onChange,
  labels 
}: { 
  label: string; 
  options: T[]; 
  value: T | null; 
  onChange: (val: T) => void;
  labels?: Record<T, string>;
}) => (
  <View className="mb-6">
    <Text className="text-base font-semibold text-gray-900 mb-3">{label}</Text>
    <View className="flex-row flex-wrap gap-2">
      {options.map((opt) => {
        const isSelected = value === opt;
        return (
          <TouchableOpacity
            key={opt}
            onPress={() => onChange(opt)}
            className={`px-4 py-3 rounded-xl border shadow-sm ${
              isSelected 
                ? 'bg-green-600 border-green-600' 
                : 'bg-white border-gray-200'
            }`}
          >
            <Text className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-gray-700'}`}>
              {labels ? labels[opt] : opt}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  </View>
);

export const DailySurveyModal: React.FC<DailySurveyModalProps> = ({ visible, onClose, onSave, date, initialData }) => {
  // State
  const [weight, setWeight] = useState('');
  const [motivation, setMotivation] = useState<DailySurveyData['motivation'] | null>(null);
  const [sleep, setSleep] = useState<DailySurveyData['sleep'] | null>(null);
  const [stress, setStress] = useState<DailySurveyData['stress'] | null>(null);
  const [digestion, setDigestion] = useState<DailySurveyData['digestion'] | null>(null);
  const [water, setWater] = useState<DailySurveyData['water'] | null>(null);
  const [hunger, setHunger] = useState<DailySurveyData['hunger'] | null>(null);
  const [libido, setLibido] = useState<DailySurveyData['libido'] | null>(null);
  const [comment, setComment] = useState('');

  // Animation
  const screenHeight = Dimensions.get('window').height;
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      slideAnim.setValue(screenHeight);
      fadeAnim.setValue(0);
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600, // Медленнее (стандарт ~300ms)
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, screenHeight]);

  const handleCloseAnimation = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: screenHeight,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start(() => onClose());
  };

  // Load initial data if editing
  useEffect(() => {
    if (visible) {
      if (initialData) {
        setWeight(initialData.weight?.toString() || '');
        setMotivation(initialData.motivation);
        setSleep(initialData.sleep);
        setStress(initialData.stress);
        setDigestion(initialData.digestion);
        setWater(initialData.water);
        setHunger(initialData.hunger);
        setLibido(initialData.libido);
        setComment(initialData.comment || '');
      } else {
        // Reset defaults
        setWeight('');
        setMotivation(null);
        setSleep(null);
        setStress(null);
        setDigestion(null);
        setWater(null);
        setHunger(null);
        setLibido(null);
        setComment('');
      }
    }
  }, [visible, initialData]);

  const handleSubmit = () => {
    // Валидация веса
    const weightNum = parseFloat(weight.replace(',', '.'));
    const validWeight = (!weight || isNaN(weightNum) || weightNum <= 0) ? null : parseFloat(weightNum.toFixed(1));

    const surveyData: DailySurveyData = {
      date,
      weight: validWeight,
      motivation,
      sleep,
      stress,
      digestion,
      water,
      hunger,
      libido,
      comment: comment.trim() || undefined,
    };

    onSave(surveyData);
    handleCloseAnimation();
  };

  return (
    <Modal visible={visible} animationType="none" transparent={true} onRequestClose={handleCloseAnimation}>
      {/* Backdrop with fade animation */}
      <Animated.View 
        style={[
          StyleSheet.absoluteFill, 
          { backgroundColor: 'black', opacity: fadeAnim.interpolate({inputRange: [0, 1], outputRange: [0, 0.5]}) }
        ]} 
      >
        <TouchableOpacity style={{flex:1}} onPress={handleCloseAnimation} activeOpacity={1} />
      </Animated.View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        className="flex-1 justify-end"
        pointerEvents="box-none"
      >
        <Animated.View style={{ height: '75%', transform: [{ translateY: slideAnim }] }}>
        <View className="bg-gray-50 h-full rounded-t-3xl overflow-hidden">
          <View className="flex-row justify-between items-center p-4 bg-white border-b border-gray-100">
            <Text className="text-xl font-bold text-gray-900">Анкета</Text>
            <TouchableOpacity onPress={handleCloseAnimation} className="p-2 bg-gray-100 rounded-full">
              <X size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 p-4" contentContainerStyle={{ paddingBottom: 100 }}>
            
            {/* Вес */}
            <Text className="text-base font-semibold text-gray-900 mb-2">Вес (кг)</Text>
            <View className="bg-white p-4 rounded-2xl mb-6 shadow-sm border border-gray-100">
              <TextInput
                value={weight}
                onChangeText={setWeight}
                placeholder="0.0"
                keyboardType="decimal-pad"
                className="text-3xl font-bold text-green-600 border-b border-gray-200 py-2"
              />
            </View>

            {/* Вопросы */}
            <SelectionGroup
              label="Мотивация"
              options={['low', 'moderate', 'high']}
              labels={{ low: 'Низкая', moderate: 'Умеренная', high: 'Высокая' }}
              value={motivation}
              onChange={setMotivation}
            />

            <SelectionGroup
              label="Сон (часов)"
              options={['0-4', '4-6', '6-8', '8+']}
              value={sleep}
              onChange={setSleep}
            />

            <SelectionGroup
              label="Уровень стресса"
              options={['low', 'moderate', 'high']}
              labels={{ low: 'Низкий', moderate: 'Умеренный', high: 'Высокий' }}
              value={stress}
              onChange={setStress}
            />

            <SelectionGroup
              label="Пищеварение (стул)"
              options={['0', '1', '2+']}
              labels={{ '0': '0 раз', '1': '1 раз', '2+': '2+ раз' }}
              value={digestion}
              onChange={setDigestion}
            />

            <SelectionGroup
              label="Вода (литров)"
              options={['0-1', '1-2', '2-3', '2+']}
              value={water}
              onChange={setWater}
            />

            <SelectionGroup
              label="Чувство голода"
              options={['no_appetite', 'moderate', 'constant']}
              labels={{ no_appetite: 'Нет аппетита', moderate: 'Умеренно', constant: 'Постоянно' }}
              value={hunger}
              onChange={setHunger}
            />

            <SelectionGroup
              label="Либидо"
              options={['low', 'moderate', 'high']}
              labels={{ low: 'Низкое', moderate: 'Умеренное', high: 'Высокое' }}
              value={libido}
              onChange={setLibido}
            />

            {/* Комментарий */}
            <View className="mb-6">
              <Text className="text-base font-semibold text-gray-900 mb-3">Комментарий тренеру (опционально)</Text>
              <TextInput
                value={comment}
                onChangeText={setComment}
                placeholder="Напишите, если что-то беспокоит..."
                multiline
                numberOfLines={3}
                className="bg-white p-4 rounded-xl border border-gray-200 text-gray-900 h-24"
                textAlignVertical="top"
              />
            </View>

            {/* Кнопка сохранения */}
            <TouchableOpacity 
              onPress={handleSubmit}
              className="bg-green-600 py-3 rounded-xl flex-row justify-center items-center shadow-sm active:bg-green-700 mb-6"
            >
              <Check size={20} color="white" />
              <Text className="text-white font-bold text-lg">Сохранить</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};