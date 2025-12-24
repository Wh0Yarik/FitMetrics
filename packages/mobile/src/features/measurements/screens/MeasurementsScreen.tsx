import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Trash2, Calendar, Ruler } from 'lucide-react-native';
import { useFocusEffect } from 'expo-router';

import { measurementsRepository, MeasurementEntry } from '../repositories/MeasurementsRepository';
import { AddMeasurementModal } from '../components/AddMeasurementModal';

export default function MeasurementsScreen() {
  const [measurements, setMeasurements] = useState<MeasurementEntry[]>([]);
  const [isModalOpen, setModalOpen] = useState(false);

  const loadData = useCallback(() => {
    const data = measurementsRepository.getAllMeasurements();
    setMeasurements(data);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleSave = (data: Partial<MeasurementEntry>) => {
    const today = new Date().toISOString().split('T')[0];
    measurementsRepository.saveMeasurement({
      ...data,
      date: today, // Пока сохраняем текущей датой
    });
    loadData();
  };

  const handleDelete = (id: string) => {
    Alert.alert('Удаление', 'Удалить этот замер?', [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Удалить', style: 'destructive', onPress: () => {
        measurementsRepository.deleteMeasurement(id);
        loadData();
      }}
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View className="bg-white p-6 pb-4 rounded-b-3xl shadow-sm border-b border-gray-100 z-10">
        <Text className="text-2xl font-bold text-gray-900">Замеры тела</Text>
        <Text className="text-gray-500 text-sm">Отслеживайте свой прогресс</Text>
      </View>

      <ScrollView className="flex-1 p-6" contentContainerStyle={{ paddingBottom: 100 }}>
        {measurements.length === 0 ? (
          <View className="items-center justify-center py-12 bg-white rounded-2xl" style={{ borderWidth: 1, borderColor: '#E5E7EB', borderStyle: 'dashed' }}>
            <Ruler size={48} color="#E5E7EB" />
            <Text className="text-gray-400 text-center mt-4">История замеров пуста.{'\n'}Добавьте свой первый результат!</Text>
          </View>
        ) : (
          measurements.map((item) => (
            <View key={item.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm mb-4">
              <View className="flex-row justify-between items-start mb-3">
                <View className="flex-row items-center gap-2">
                  <Calendar size={16} color="#6B7280" />
                  <Text className="font-bold text-gray-900 text-lg">
                    {new Date(item.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => handleDelete(item.id)} className="p-2 bg-red-50 rounded-lg">
                  <Trash2 size={16} color="#EF4444" />
                </TouchableOpacity>
              </View>

              <View className="flex-row flex-wrap gap-4">
                {item.weight && (
                  <View>
                    <Text className="text-xs text-gray-500">Вес</Text>
                    <Text className="text-lg font-bold text-gray-900">{item.weight} кг</Text>
                  </View>
                )}
                {item.waist && (
                  <View>
                    <Text className="text-xs text-gray-500">Талия</Text>
                    <Text className="text-lg font-bold text-gray-900">{item.waist} см</Text>
                  </View>
                )}
                {item.hips && (
                  <View>
                    <Text className="text-xs text-gray-500">Бедра</Text>
                    <Text className="text-lg font-bold text-gray-900">{item.hips} см</Text>
                  </View>
                )}
              </View>

              {(item.photoFront || item.photoSide || item.photoBack) && (
                <View className="mt-3 pt-3 border-t border-gray-50 flex-row gap-2">
                  {item.photoFront && <Image source={{ uri: item.photoFront }} className="w-10 h-10 rounded-lg bg-gray-100" />}
                  {item.photoSide && <Image source={{ uri: item.photoSide }} className="w-10 h-10 rounded-lg bg-gray-100" />}
                  {item.photoBack && <Image source={{ uri: item.photoBack }} className="w-10 h-10 rounded-lg bg-gray-100" />}
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>

      <TouchableOpacity 
        onPress={() => setModalOpen(true)}
        className="absolute bottom-6 right-6 w-16 h-16 bg-blue-600 rounded-full items-center justify-center shadow-lg z-50"
      >
        <Plus size={32} color="white" />
      </TouchableOpacity>

      <AddMeasurementModal
        visible={isModalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      />
    </SafeAreaView>
  );
}