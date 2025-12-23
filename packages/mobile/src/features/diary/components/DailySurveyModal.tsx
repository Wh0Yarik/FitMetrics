import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { X, Check, Moon, Activity, Droplets, Scale, Heart, Smile, Utensils } from 'lucide-react-native';
import { DailySurveyData } from '../repositories/DailySurveyRepository';

interface DailySurveyModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: DailySurveyData) => void;
  date: string;
  initialData?: DailySurveyData | null;
}

type DigestionType = 'excellent' | 'good' | 'bad';

export const DailySurveyModal: React.FC<DailySurveyModalProps> = ({ visible, onClose, onSave, date, initialData }) => {
  // State
  const [weight, setWeight] = useState('');
  const [sleepHours, setSleepHours] = useState('');
  const [sleepQuality, setSleepQuality] = useState(3);
  const [stress, setStress] = useState(5);
  const [motivation, setMotivation] = useState(5);
  const [hunger, setHunger] = useState(5);
  const [libido, setLibido] = useState(5);
  const [digestion, setDigestion] = useState<DigestionType>('good');
  const [water, setWater] = useState('');
  const [comment, setComment] = useState('');

  // Load initial data if editing
  useEffect(() => {
    if (visible) {
      if (initialData) {
        setWeight(initialData.weight?.toString() || '');
        setSleepHours(initialData.sleepHours?.toString() || '');
        setSleepQuality(initialData.sleepQuality || 3);
        setStress(initialData.stress || 5);
        setMotivation(initialData.motivation || 5);
        setHunger(initialData.hunger || 5);
        setLibido(initialData.libido || 5);
        setDigestion(initialData.digestion || 'good');
        setWater(initialData.water?.toString() || '');
        setComment(initialData.comment || '');
      } else {
        // Reset defaults
        setWeight('');
        setSleepHours('');
        setSleepQuality(3);
        setStress(5);
        setMotivation(5);
        setHunger(5);
        setLibido(5);
        setDigestion('good');
        setWater('');
        setComment('');
      }
    }
  }, [visible, initialData]);

  const handleSubmit = () => {
    // Basic validation
    if (!weight) {
      alert('Пожалуйста, укажите вес');
      return;
    }

    const surveyData: DailySurveyData = {
      date,
      weight: parseFloat(weight.replace(',', '.')) || 0,
      sleepHours: parseFloat(sleepHours.replace(',', '.')) || 0,
      sleepQuality,
      stress,
      motivation,
      hunger,
      libido,
      digestion,
      water: parseFloat(water.replace(',', '.')) || 0,
      comment
    };

    onSave(surveyData);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 justify-end bg-black/50">
        <View className="bg-white rounded-t-3xl h-[90%] w-full overflow-hidden">
        {/* Header */}
        <View className="flex-row justify-between items-center p-6 border-b border-gray-100">
          <Text className="text-lg font-bold text-gray-900">Ежедневный отчет</Text>
          <TouchableOpacity onPress={onClose} className="p-2 bg-gray-100 rounded-full">
            <X size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 p-4" contentContainerStyle={{ paddingBottom: 40 }}>
          
          {/* 1. Вес и Вода */}
          <View className="flex-row gap-4 mb-6">
            <View className="flex-1 bg-white p-4 rounded-xl border border-gray-100">
              <View className="flex-row items-center gap-2 mb-2">
                <Scale size={18} color="#3B82F6" />
                <Text className="font-medium text-gray-700">Вес (кг)</Text>
              </View>
              <TextInput
                value={weight}
                onChangeText={setWeight}
                keyboardType="numeric"
                placeholder="0.0"
                className="text-2xl font-bold text-gray-900 border-b border-gray-200 py-1"
              />
            </View>
            <View className="flex-1 bg-white p-4 rounded-xl border border-gray-100">
              <View className="flex-row items-center gap-2 mb-2">
                <Droplets size={18} color="#0EA5E9" />
                <Text className="font-medium text-gray-700">Вода (л)</Text>
              </View>
              <TextInput
                value={water}
                onChangeText={setWater}
                keyboardType="numeric"
                placeholder="0.0"
                className="text-2xl font-bold text-gray-900 border-b border-gray-200 py-1"
              />
            </View>
          </View>

          {/* 2. Сон */}
          <View className="bg-white p-4 rounded-xl border border-gray-100 mb-6">
            <View className="flex-row items-center gap-2 mb-4">
              <Moon size={18} color="#8B5CF6" />
              <Text className="font-bold text-gray-900">Сон</Text>
            </View>
            
            <View className="mb-4">
              <Text className="text-sm text-gray-500 mb-2">Количество часов</Text>
              <TextInput
                value={sleepHours}
                onChangeText={setSleepHours}
                keyboardType="numeric"
                placeholder="8"
                className="bg-gray-50 p-3 rounded-lg text-lg font-medium"
              />
            </View>

            <ScaleSelector 
              label="Качество сна (1-5)" 
              value={sleepQuality} 
              onChange={setSleepQuality} 
              max={5} 
              colors={['bg-red-100', 'bg-orange-100', 'bg-yellow-100', 'bg-blue-100', 'bg-green-100']}
            />
          </View>

          {/* 3. Состояние (1-10) */}
          <View className="bg-white p-4 rounded-xl border border-gray-100 mb-6 gap-6">
            <ScaleSelector label="Уровень стресса (1-10)" value={stress} onChange={setStress} icon={<Activity size={16} color="#EF4444"/>} />
            <ScaleSelector label="Мотивация (1-10)" value={motivation} onChange={setMotivation} icon={<Smile size={16} color="#F59E0B"/>} />
            <ScaleSelector label="Чувство голода (1-10)" value={hunger} onChange={setHunger} icon={<Utensils size={16} color="#10B981"/>} />
            <ScaleSelector label="Либидо (1-10)" value={libido} onChange={setLibido} icon={<Heart size={16} color="#EC4899"/>} />
          </View>

          {/* 4. Пищеварение */}
          <View className="bg-white p-4 rounded-xl border border-gray-100 mb-6">
            <Text className="font-medium text-gray-700 mb-3">Пищеварение</Text>
            <View className="flex-row gap-2">
              {[
                { key: 'excellent', label: 'Отличное', color: 'bg-green-100 text-green-800 border-green-200' },
                { key: 'good', label: 'Нормальное', color: 'bg-blue-100 text-blue-800 border-blue-200' },
                { key: 'bad', label: 'Плохое', color: 'bg-red-100 text-red-800 border-red-200' },
              ].map((item) => (
                <TouchableOpacity
                  key={item.key}
                  onPress={() => setDigestion(item.key as DigestionType)}
                  className={`flex-1 py-3 rounded-lg border items-center ${
                    digestion === item.key ? item.color.replace('text-', 'border-2 border-') : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <Text className={`font-medium ${digestion === item.key ? 'text-black' : 'text-gray-500'}`}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 5. Комментарий */}
          <View className="bg-white p-4 rounded-xl border border-gray-100 mb-8">
            <Text className="font-medium text-gray-700 mb-2">Комментарий тренеру</Text>
            <TextInput
              value={comment}
              onChangeText={setComment}
              multiline
              numberOfLines={3}
              placeholder="Как прошел день? Жалобы, вопросы..."
              className="bg-gray-50 p-3 rounded-lg text-base h-24"
              textAlignVertical="top"
            />
          </View>

          {/* Save Button */}
          <TouchableOpacity 
            onPress={handleSubmit}
            className="bg-green-600 py-4 rounded-xl flex-row items-center justify-center gap-2 shadow-sm shadow-green-200 mb-6"
          >
            <Check size={20} color="white" />
            <Text className="text-white font-bold text-lg">Сохранить отчет</Text>
          </TouchableOpacity>

        </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// Helper Component for Scales
const ScaleSelector = ({ label, value, onChange, max = 10, icon, colors }: any) => {
  return (
    <View>
      <View className="flex-row items-center gap-2 mb-3">
        {icon}
        <Text className="font-medium text-gray-700">{label}: <Text className="font-bold text-black">{value}</Text></Text>
      </View>
      <View className="flex-row justify-between gap-1">
        {Array.from({ length: max }, (_, i) => i + 1).map((num) => {
          const isSelected = num === value;
          const bgColor = isSelected 
            ? (colors ? colors[num-1] : 'bg-black') 
            : 'bg-gray-100';
          const textColor = isSelected 
            ? (colors ? 'text-gray-900' : 'text-white') 
            : 'text-gray-500';
            
          return (
            <TouchableOpacity
              key={num}
              onPress={() => onChange(num)}
              className={`flex-1 h-10 items-center justify-center rounded-md ${bgColor}`}
            >
              <Text className={`font-bold text-xs ${textColor}`}>{num}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};