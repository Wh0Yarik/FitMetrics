import React, { useState, useEffect, useRef } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Animated, Dimensions, StyleSheet } from 'react-native';
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
}

const PORTION_TYPES = [
  { key: 'protein', label: 'Белки', color: 'bg-red-100', textColor: 'text-red-700', borderColor: 'border-red-200' },
  { key: 'fat', label: 'Жиры', color: 'bg-orange-100', textColor: 'text-orange-700', borderColor: 'border-orange-200' },
  { key: 'carbs', label: 'Углеводы', color: 'bg-blue-100', textColor: 'text-blue-700', borderColor: 'border-blue-200' },
  { key: 'fiber', label: 'Клетчатка', color: 'bg-green-100', textColor: 'text-green-700', borderColor: 'border-green-200' },
];

export const AddMealModal: React.FC<AddMealModalProps> = ({ visible, onClose, onSave }) => {
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
    if (!name.trim()) return; // Валидация: имя обязательно
    onSave(name, portions);
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
        <Animated.View style={{ height: '85%', transform: [{ translateY: slideAnim }] }}>
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
                <Text className="text-base font-semibold text-gray-900 mb-2">Что съели?</Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  className="bg-white p-4 rounded-xl border border-gray-200 text-lg text-gray-900 shadow-sm"
                  placeholder="Например: Завтрак, Орехи, Ужин..."
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              {/* Portions Steppers */}
              <View className="mb-6">
                <Text className="text-base font-semibold text-gray-900 mb-3">Порции</Text>
                <View className="gap-3">
                  {PORTION_TYPES.map((type) => {
                    const count = portions[type.key as keyof PortionCount];
                    return (
                      <View key={type.key} className={`w-full p-3 rounded-xl border ${type.borderColor} bg-white flex-row items-center justify-between shadow-sm`}>
                        <View className={`px-2 py-1 rounded ${type.color}`}>
                          <Text className={`text-xs font-bold ${type.textColor}`}>{type.label}</Text>
                        </View>
                        
                        <View className="flex-row items-center gap-2">
                          <TouchableOpacity 
                            onPress={() => handleDecrement(type.key as keyof PortionCount)}
                            className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center active:bg-gray-200"
                          >
                            <Minus size={16} color="#6B7280" />
                          </TouchableOpacity>
                          
                          <Text className="font-bold text-lg w-4 text-center">{count}</Text>
                          
                          <TouchableOpacity 
                            onPress={() => handleIncrement(type.key as keyof PortionCount)}
                            className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center active:bg-gray-200"
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
                className={`w-full py-3 rounded-xl flex-row items-center justify-center gap-2 shadow-sm mb-6 ${name.trim() ? 'bg-green-600 active:bg-green-700' : 'bg-gray-300'}`}
                disabled={!name.trim()}
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