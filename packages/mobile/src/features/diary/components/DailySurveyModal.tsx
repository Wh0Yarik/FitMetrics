import React, { useState, useEffect, useRef } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Animated, Dimensions, StyleSheet } from 'react-native';
import { X, Check } from 'lucide-react-native';
import { DailySurveyData } from '../repositories/DailySurveyRepository';
import { COLORS } from '../../../constants/Colors';

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
    <Text style={styles.sectionLabel}>{label}</Text>
    <View style={styles.selectionRow}>
      {options.map((opt) => {
        const isSelected = value === opt;
        return (
          <TouchableOpacity
            key={opt}
            onPress={() => onChange(opt)}
            style={[
              styles.selectionButton,
              isSelected ? styles.selectionButtonActive : null,
            ]}
          >
            <Text style={[styles.selectionText, isSelected ? styles.selectionTextActive : null]}>
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
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Анкета</Text>
            <TouchableOpacity onPress={handleCloseAnimation} style={styles.closeButton}>
              <X size={18} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 p-4" contentContainerStyle={{ paddingBottom: 100 }}>
            
            {/* Вес */}
            <Text style={styles.sectionLabel}>Вес (кг)</Text>
            <View style={styles.pillInputRow}>
              <TextInput
                value={weight}
                onChangeText={setWeight}
                placeholder="0.0"
                keyboardType="decimal-pad"
                style={styles.pillInputText}
              />
              <Text style={styles.pillUnit}>кг</Text>
              <View style={styles.pillIcon}>
                <View style={styles.pillIconDot} />
              </View>
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
                style={styles.commentInput}
                textAlignVertical="top"
              />
            </View>

            {/* Кнопка сохранения */}
            <TouchableOpacity 
              onPress={handleSubmit}
              style={styles.primaryButton}
            >
              <Check size={20} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>Сохранить</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleCloseAnimation} style={styles.secondaryButton}>
              <X size={18} color="#EF4444" />
              <Text style={styles.secondaryButtonText}>Отмена</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  sheet: {
    backgroundColor: '#FFFFFF',
    height: '100%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: '#ECFDF3',
    borderWidth: 1,
    borderColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 10,
  },
  pillInputRow: {
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  pillInputText: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  pillUnit: {
    fontSize: 14,
    color: '#9CA3AF',
    marginRight: 10,
  },
  pillIcon: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: '#ECFDF3',
    borderWidth: 1,
    borderColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillIconDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: COLORS.primary,
  },
  selectionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  selectionButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 22,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 8,
    marginBottom: 8,
  },
  selectionButtonActive: {
    backgroundColor: '#ECFDF3',
    borderColor: '#D1FAE5',
  },
  selectionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  selectionTextActive: {
    color: '#166534',
  },
  commentInput: {
    backgroundColor: '#F9FAFB',
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    color: '#111827',
    height: 96,
    textAlignVertical: 'top',
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  primaryButtonText: {
    marginLeft: 8,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FECACA',
    marginBottom: 16,
  },
  secondaryButtonText: {
    marginLeft: 8,
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
  },
});
