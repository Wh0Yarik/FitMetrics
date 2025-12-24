import React, { useState, useEffect, useRef } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Animated, Dimensions, StyleSheet, Alert } from 'react-native';
import { X, Check, Minus, Plus } from 'lucide-react-native';

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
}

const PORTION_TYPES = [
  { key: 'protein', label: 'Белки', color: 'bg-red-100', textColor: 'text-red-700', borderColor: 'border-red-200' },
  { key: 'fat', label: 'Жиры', color: 'bg-yellow-100', textColor: 'text-yellow-700', borderColor: 'border-yellow-200' },
  { key: 'carbs', label: 'Углеводы', color: 'bg-blue-100', textColor: 'text-blue-700', borderColor: 'border-blue-200' },
  { key: 'fiber', label: 'Клетчатка', color: 'bg-green-100', textColor: 'text-green-700', borderColor: 'border-green-200' },
];

export const AddMealModal: React.FC<AddMealModalProps> = ({ visible, onClose, onSave, nextMealNumber = 1 }) => {
  const [name, setName] = useState('');
  const [portions, setPortions] = useState<PortionCount>({ protein: 0, fat: 0, carbs: 0, fiber: 0 });

  // Animation refs
  const screenHeight = Dimensions.get('window').height;
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Reset state
      setName('');
      setPortions({ protein: 0, fat: 0, carbs: 0, fiber: 0 });

      slideAnim.setValue(screenHeight);
      fadeAnim.setValue(0);
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, screenHeight]);

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
      finalName = `Прием пищи №${nextMealNumber}`;
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
          <View className="bg-gray-50 h-full rounded-t-3xl overflow-hidden">
            
            {/* Header */}
            <View className="flex-row justify-between items-center p-4 bg-white border-b border-gray-100">
              <Text className="text-xl font-bold text-gray-900">Добавить прием пищи</Text>
              <TouchableOpacity onPress={handleClose} className="p-2 bg-gray-100 rounded-full">
                <X size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 p-4" contentContainerStyle={{ paddingBottom: 100 }}>
              {/* Name Input */}
              <View className="mb-6">
                <TextInput
                  value={name}
                  onChangeText={setName}
                  className="w-full bg-white p-4 rounded-xl border border-gray-200 text-lg text-gray-900 shadow-sm"
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
                      <View key={type.key} className={`w-full p-0 rounded-xl border ${type.borderColor} bg-white flex-row items-center justify-between shadow-sm`}>
                        <View className={`px-4 py-4 rounded ${type.color}`}>
                          <Text className={`text-base font-bold ${type.textColor}`}>{type.label}</Text>
                        </View>
                        
                        <View className="flex-row items-center gap-2 px-4">
                          <TouchableOpacity 
                            onPress={() => handleDecrement(type.key as keyof PortionCount)}
                            className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center active:bg-gray-200"
                          >
                            <Minus size={16} color="#6B7280" />
                          </TouchableOpacity>
                          
                          <Text className="font-bold text-lg text-xl w-6 text-center">{count}</Text>
                          
                          <TouchableOpacity 
                            onPress={() => handleIncrement(type.key as keyof PortionCount)}
                            className="w-10 h-10 rounded-full bg-green-300 items-center justify-center active:bg-green-200"
                          >
                            <Plus size={16} color="#1F2937" />
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
                className="w-full py-3 rounded-xl border border-transparent flex-row items-center justify-center shadow-sm mb-6 bg-green-600 active:bg-green-700"
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