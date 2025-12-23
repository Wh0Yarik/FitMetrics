import React, { useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
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

  const handleIncrement = (key: keyof PortionCount) => {
    setPortions(prev => ({ ...prev, [key]: prev[key] + 1 }));
  };

  const handleDecrement = (key: keyof PortionCount) => {
    setPortions(prev => ({ ...prev, [key]: Math.max(0, prev[key] - 1) }));
  };

  const handleSubmit = () => {
    if (!name.trim()) return; // Валидация: имя обязательно
    onSave(name, portions);
    
    // Сброс
    setName('');
    setPortions({ protein: 0, fat: 0, carbs: 0, fiber: 0 });
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 justify-end bg-black/50"
      >
        <View className="bg-white rounded-t-3xl p-6 shadow-xl h-[70%]">
          
          {/* Header */}
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-xl font-bold text-gray-900">Добавить прием пищи</Text>
            <TouchableOpacity onPress={onClose} className="p-2 bg-gray-100 rounded-full">
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Name Input */}
            <View className="mb-8">
              <Text className="text-sm font-medium text-gray-500 mb-2">Что съели?</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-lg font-medium text-gray-900"
                placeholder="Например: Завтрак, Орехи, Ужин..."
                placeholderTextColor="#9CA3AF"
                autoFocus={false}
              />
            </View>

            {/* Portions Steppers */}
            <View className="mb-8">
              <Text className="text-sm font-medium text-gray-500 mb-3">Порции</Text>
              <View className="flex-row flex-wrap justify-between gap-y-3">
                {PORTION_TYPES.map((type) => {
                  const count = portions[type.key as keyof PortionCount];
                  return (
                    <View key={type.key} className={`w-[48%] p-3 rounded-xl border ${type.borderColor} bg-white flex-row items-center justify-between`}>
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
              className={`w-full py-4 rounded-xl flex-row items-center justify-center gap-2 shadow-sm ${name.trim() ? 'bg-green-600' : 'bg-gray-300'}`}
              disabled={!name.trim()}
            >
              <Check size={20} color="white" />
              <Text className="text-white font-bold text-lg">Сохранить</Text>
            </TouchableOpacity>
            
            {/* Bottom Spacer for safe area */}
            <View className="h-8" />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};