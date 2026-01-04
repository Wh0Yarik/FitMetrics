import React, { useState, useEffect, useRef } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Animated, Dimensions, StyleSheet, Alert } from 'react-native';
import { X, Check, Minus, Plus, ChevronDown } from 'lucide-react-native';
import { COLORS } from '../../../constants/Colors';

// Типы порций (можно вынести в shared/types)
export interface PortionCount {
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
}

interface AddMealModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (name: string, portions: PortionCount) => void;
  nextMealNumber?: number;
  mode?: 'create' | 'edit';
  initialName?: string;
  initialPortions?: PortionCount;
}

const PORTION_TYPES = [
  { key: 'protein', label: 'Белки', accent: '#EF4444' },
  { key: 'fat', label: 'Жиры', accent: '#F59E0B' },
  { key: 'carbs', label: 'Углеводы', accent: '#3B82F6' },
  { key: 'fiber', label: 'Клетчатка', accent: '#50CA64' },
];

export const AddMealModal: React.FC<AddMealModalProps> = ({
  visible,
  onClose,
  onSave,
  nextMealNumber = 1,
  mode = 'create',
  initialName,
  initialPortions,
}) => {
  const [name, setName] = useState('');
  const [portions, setPortions] = useState<PortionCount>({ protein: 0, fat: 0, carbs: 0, fiber: 0 });

  // Animation refs
  const screenHeight = Dimensions.get('window').height;
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Reset or prefill state
      setName(initialName ?? '');
      setPortions(initialPortions ?? { protein: 0, fat: 0, carbs: 0, fiber: 0 });

      slideAnim.setValue(screenHeight);
      fadeAnim.setValue(0);
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, screenHeight, initialName, initialPortions]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: screenHeight, duration: 400, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start(() => onClose());
  };

  const handleIncrement = (key: keyof PortionCount) => {
    setPortions(prev => ({ ...prev, [key]: prev[key] + 1 }));
  };

  const handleDecrement = (key: keyof PortionCount) => {
    setPortions(prev => ({ ...prev, [key]: Math.max(0, prev[key] - 1) }));
  };

  const handleSubmit = () => {
    let finalName = name.trim();
    if (!finalName) {
      finalName = mode === 'create' ? `Прием пищи №${nextMealNumber}` : 'Прием пищи';
    }

    const totalPortions = portions.protein + portions.fat + portions.carbs + portions.fiber;
    if (totalPortions === 0) {
      Alert.alert('Ошибка', 'Укажите хотя бы одну порцию');
      return;
    }

    onSave(finalName, portions);
    handleClose();
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
      {/* Backdrop */}
      <Animated.View 
        style={[
          StyleSheet.absoluteFill, 
          { backgroundColor: 'black', opacity: fadeAnim.interpolate({inputRange: [0, 1], outputRange: [0, 0.5]}) }
        ]} 
      >
        <TouchableOpacity style={{flex:1}} onPress={handleClose} activeOpacity={1} />
      </Animated.View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 justify-end"
        pointerEvents="box-none"
      >
        <Animated.View style={{ height: '75%', transform: [{ translateY: slideAnim }] }}>
          <View style={styles.sheet}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>
                {mode === 'edit' ? 'Редактировать прием пищи' : 'Добавить прием пищи'}
              </Text>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <X size={18} color={COLORS.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent} contentContainerStyle={{ paddingBottom: 100 }}>
              {/* Name Input */}
              <View style={styles.inputGroup}>
                <View style={styles.pillInputRow}>
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    style={styles.pillInputText}
                    placeholder="Например: Завтрак, яблоко, перекус"
                    placeholderTextColor="#9CA3AF"
                  />
                  <View style={styles.pillIcon}>
                    <ChevronDown size={18} color={COLORS.primary} />
                  </View>
                </View>
              </View>

              {/* Portions Steppers */}
              <View style={styles.sectionBlock}>
                <Text style={styles.sectionTitle}>Порции</Text>
                <View style={styles.portionList}>
                  {PORTION_TYPES.map((type) => {
                    const count = portions[type.key as keyof PortionCount];
                    return (
                      <View key={type.key} style={styles.portionRow}>
                        <View style={styles.portionLabel}>
                          <View style={[styles.portionDot, { backgroundColor: type.accent }]} />
                          <Text style={styles.portionLabelText}>{type.label}</Text>
                        </View>
                        <View style={styles.stepperControls}>
                          <TouchableOpacity 
                            onPress={() => handleDecrement(type.key as keyof PortionCount)}
                            style={styles.stepperButton}
                          >
                            <Minus size={16} color="#6B7280" />
                          </TouchableOpacity>
                          
                          <Text style={styles.stepperCount}>{count}</Text>
                          
                          <TouchableOpacity 
                            onPress={() => handleIncrement(type.key as keyof PortionCount)}
                            style={styles.stepperButtonPrimary}
                          >
                            <Plus size={16} color="#FFFFFF" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>

              {/* Save Button */}
              <TouchableOpacity 
                onPress={handleSubmit}
                style={styles.primaryButton}
              >
                <Check size={20} color="#FFFFFF" />
                <Text style={styles.primaryButtonText}>
                  {mode === 'edit' ? 'Сохранить' : 'Добавить'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleClose} style={styles.secondaryButton}>
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
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  inputGroup: {
    marginBottom: 18,
  },
  pillInputRow: {
    backgroundColor: '#F9FAFB',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pillInputText: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    lineHeight: 20,
  },
  pillIcon: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: '#ECFDF3',
    borderWidth: 1,
    borderColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  sectionBlock: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 10,
  },
  portionList: {
    gap: 10,
  },
  portionRow: {
    width: '100%',
    borderRadius: 22,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  portionLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  portionDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
    marginRight: 8,
  },
  portionLabelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  stepperControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepperButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperButtonPrimary: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperCount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    minWidth: 24,
    textAlign: 'center',
  },
  primaryButton: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    backgroundColor: COLORS.primary,
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
