import React, { useState, useEffect, useRef } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Animated, Dimensions, StyleSheet, Alert } from 'react-native';
import { X, Check, Minus, Plus } from 'lucide-react-native';
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
  { key: 'protein', label: 'Белки', color: 'bg-red-100', textColor: 'text-red-700', borderColor: 'border-red-200' },
  { key: 'fat', label: 'Жиры', color: 'bg-yellow-100', textColor: 'text-yellow-700', borderColor: 'border-yellow-200' },
  { key: 'carbs', label: 'Углеводы', color: 'bg-blue-100', textColor: 'text-blue-700', borderColor: 'border-blue-200' },
  { key: 'fiber', label: 'Клетчатка', color: 'bg-green-100', textColor: 'text-green-700', borderColor: 'border-green-200' },
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
            
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>
                {mode === 'edit' ? 'Редактировать прием пищи' : 'Добавить прием пищи'}
              </Text>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <X size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 p-4" contentContainerStyle={{ paddingBottom: 100 }}>
              {/* Name Input */}
              <View className="mb-6">
                <TextInput
                  value={name}
                  onChangeText={setName}
                  style={styles.inputCard}
                  placeholder="Например: Завтрак, яблоко, перекус"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              {/* Portions Steppers */}
              <View className="mb-6">
                <Text className="text-base font-semibold text-gray-900 mb-3">Порции</Text>
                <View className="gap-4 w-full">
                  {PORTION_TYPES.map((type) => {
                    const count = portions[type.key as keyof PortionCount];
                    return (
                      <View key={type.key} style={styles.stepperCard}>
                        <View className={`px-4 py-4 rounded ${type.color}`}>
                          <Text className={`text-base font-bold ${type.textColor}`}>{type.label}</Text>
                        </View>
                        
                        <View className="flex-row items-center gap-2 px-4">
                          <TouchableOpacity 
                            onPress={() => handleDecrement(type.key as keyof PortionCount)}
                            style={styles.stepperButton}
                          >
                            <Minus size={16} color="#6B7280" />
                          </TouchableOpacity>
                          
                          <Text className="font-bold text-lg text-xl w-6 text-center">{count}</Text>
                          
                          <TouchableOpacity 
                            onPress={() => handleIncrement(type.key as keyof PortionCount)}
                            style={styles.stepperButtonPrimary}
                          >
                            <Plus size={16} color="white" />
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
                <Check size={20} color="white" />
                <Text style={styles.primaryButtonText}>
                  {mode === 'edit' ? 'Сохранить' : 'Добавить'}
                </Text>
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
    backgroundColor: '#F7FAF8',
    height: '100%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  closeButton: {
    padding: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 999,
  },
  inputCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 14,
    fontSize: 16,
    color: '#111827',
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
  },
  stepperCard: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
  },
  stepperButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperButtonPrimary: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 6 },
  },
  primaryButtonText: {
    marginLeft: 8,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
