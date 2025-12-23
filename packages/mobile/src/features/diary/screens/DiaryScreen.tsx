import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, StatusBar, Image, RefreshControl, Alert } from 'react-native';
import { Plus, CheckCircle, AlertCircle, Utensils, Trash2, Cloud, CloudOff, RefreshCw } from 'lucide-react-native';
import { useFocusEffect } from 'expo-router';

import { AddMealModal, PortionCount } from '../components/AddMealModal';
import { diaryRepository, MealEntry } from '../repositories/DiaryRepository';
import { initDatabase } from '../../../shared/db/init';

// Mock User & Goals (пока нет реального контекста пользователя)
const MOCK_USER = {
  name: 'Алексей',
  avatarUrl: null,
  currentWeight: 75.5,
  nutritionGoals: { dailyProtein: 5, dailyFat: 3, dailyCarbs: 5, dailyFiber: 3 }
};

export default function DiaryScreen() {
  const [meals, setMeals] = useState<MealEntry[]>([]);
  const [isMealModalOpen, setMealModalOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0]);
  const [refreshing, setRefreshing] = useState(false);
  
  // Mock states for features not yet implemented
  const [dailySurveyCompleted, setDailySurveyCompleted] = useState(false);
  const [weightLoggedToday, setWeightLoggedToday] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline'>('synced');
  
  useEffect(() => {
    initDatabase();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadMeals();
    }, [currentDate])
  );

  const loadMeals = () => {
    const data = diaryRepository.getMealsByDate(currentDate);
    setMeals(data);
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadMeals();
    // Simulate sync
    setTimeout(() => {
      setSyncStatus('synced');
      setRefreshing(false);
    }, 1000);
  }, []);

  const handleSaveMeal = (name: string, portions: PortionCount) => {
    diaryRepository.addMeal(currentDate, name, portions);
    loadMeals();
  };

  const handleDeleteMeal = (id: string) => {
    Alert.alert(
      'Удаление',
      'Вы уверены, что хотите удалить этот прием пищи?',
      [
        { text: 'Отмена', style: 'cancel' },
        { 
          text: 'Удалить', 
          style: 'destructive', 
          onPress: () => {
            diaryRepository.deleteMeal(id);
            loadMeals();
          }
        }
      ]
    );
  };

  // Calculate stats
  const todayStats = meals.reduce(
    (acc, meal) => ({
      protein: acc.protein + meal.portions.protein,
      fat: acc.fat + meal.portions.fat,
      carbs: acc.carbs + meal.portions.carbs,
      fiber: acc.fiber + meal.portions.fiber,
    }),
    { protein: 0, fat: 0, carbs: 0, fiber: 0 }
  );

  const goals = MOCK_USER.nutritionGoals;
  
  // Progress calculation
  const totalPortionsConsumed = todayStats.protein + todayStats.fat + todayStats.carbs + todayStats.fiber;
  const totalPortionsGoal = goals.dailyProtein + goals.dailyFat + goals.dailyCarbs + goals.dailyFiber;
  const progressPercentage = totalPortionsGoal > 0 
    ? Math.min(100, Math.round((totalPortionsConsumed / totalPortionsGoal) * 100))
    : 0;

  // Helper Components
  const SyncIndicator = () => {
    if (syncStatus === 'syncing') return <RefreshCw size={16} color="#4CAF50" />; // animate-spin requires Reanimated
    if (syncStatus === 'offline') return <CloudOff size={16} color="#9CA3AF" />;
    return <Cloud size={16} color="#4CAF50" />;
  };

  const PortionBadge = ({ label, value, colorBg, colorText }: { label: string, value: number, colorBg: string, colorText: string }) => {
    if (value === 0) return null;
    return (
      <View className={`flex-row items-center px-2 py-1 rounded-md mr-2 ${colorBg}`}>
        <Text className={`text-xs font-bold ${colorText}`}>{label}: {value}</Text>
      </View>
    );
  };

  const SummaryItem = ({ label, current, target, colorText }: { label: string, current: number, target: number, colorText: string }) => (
    <View className="items-center flex-1">
      <Text className="text-[10px] text-gray-500 mb-1">{label}</Text>
      <Text className={`font-bold text-lg ${colorText}`}>
        {current} <Text className="text-gray-300 text-sm">/ {target}</Text>
      </Text>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" />
      
      <ScrollView 
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View className="bg-white p-6 pb-4 rounded-b-3xl shadow-sm border-b border-gray-100">
          <View className="flex-row justify-between items-center mb-4">
            <View>
              <View className="flex-row items-center gap-2">
                <Text className="text-2xl font-bold text-gray-900">Сегодня</Text>
                <View className="mt-1"><SyncIndicator /></View>
              </View>
              <Text className="text-gray-500 text-sm">
                {new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}
              </Text>
            </View>
            <View className="w-10 h-10 bg-green-50 rounded-full items-center justify-center border border-green-100 overflow-hidden">
              {MOCK_USER.avatarUrl ? (
                <Image source={{ uri: MOCK_USER.avatarUrl }} className="w-full h-full" />
              ) : (
                <Text className="text-green-600 font-bold text-lg">{MOCK_USER.name.charAt(0)}</Text>
              )}
            </View>
          </View>

          {/* Macro Summary Card */}
          <View className="bg-gray-50 rounded-2xl p-4 flex-row items-center justify-between">
            <View className="flex-1">
               <Text className="text-sm text-gray-500 mb-1">Дневная норма</Text>
               <Text className="text-3xl font-bold text-gray-900">{progressPercentage}%</Text>
               <Text className="text-xs text-gray-500 mb-3">выполнено (порции)</Text>
               
               <View className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                 <View className="bg-green-500 h-full rounded-full" style={{ width: `${progressPercentage}%` }} />
               </View>
            </View>
            {/* Pie Chart Placeholder */}
            <View className="w-20 h-20 ml-4 items-center justify-center">
               <View className="w-16 h-16 rounded-full border-4 border-gray-200 items-center justify-center">
                  <Text className="text-[10px] text-gray-400 font-bold">План</Text>
               </View>
            </View>
          </View>
          
          {/* Targets Grid */}
          <View className="flex-row justify-between mt-6">
            <SummaryItem label="Белки" current={todayStats.protein} target={goals.dailyProtein} colorText="text-red-600" />
            <SummaryItem label="Жиры" current={todayStats.fat} target={goals.dailyFat} colorText="text-orange-500" />
            <SummaryItem label="Угли" current={todayStats.carbs} target={goals.dailyCarbs} colorText="text-blue-500" />
            <SummaryItem label="Клетчатка" current={todayStats.fiber} target={goals.dailyFiber} colorText="text-green-600" />
          </View>
        </View>

        {/* Daily Tasks */}
        <View className="p-6">
          <Text className="text-lg font-bold text-gray-900 mb-4">Задачи на день</Text>
          
          <View className="gap-3">
            {/* Survey Task */}
            <View className={`bg-white p-4 rounded-xl border shadow-sm flex-row items-center justify-between ${dailySurveyCompleted ? 'border-green-100 bg-green-50' : 'border-gray-100'}`}>
               <View className="flex-row items-center gap-3">
                 <View className={`w-10 h-10 rounded-full items-center justify-center ${dailySurveyCompleted ? 'bg-green-100' : 'bg-red-50'}`}>
                   {dailySurveyCompleted ? <CheckCircle size={20} color="#16A34A" /> : <AlertCircle size={20} color="#EF4444" />}
                 </View>
                 <View>
                   <Text className={`font-medium ${dailySurveyCompleted ? 'text-green-900' : 'text-gray-900'}`}>Утренняя анкета</Text>
                   <Text className="text-xs text-gray-500">
                     {dailySurveyCompleted ? 'Выполнено' : 'Не заполнено'}
                   </Text>
                 </View>
               </View>
               {!dailySurveyCompleted && (
                 <TouchableOpacity 
                  onPress={() => Alert.alert('Скоро', 'Функционал анкет в разработке')}
                  className="bg-green-600 px-4 py-2 rounded-lg shadow-sm"
                 >
                   <Text className="text-white text-sm font-medium">Заполнить</Text>
                 </TouchableOpacity>
               )}
            </View>

            {/* Weight Task */}
            <View className={`bg-white p-4 rounded-xl border shadow-sm flex-row items-center justify-between ${weightLoggedToday ? 'border-green-100 bg-green-50' : 'border-gray-100'}`}>
               <View className="flex-row items-center gap-3">
                 <View className={`w-10 h-10 rounded-full items-center justify-center ${weightLoggedToday ? 'bg-green-100' : 'bg-blue-50'}`}>
                   <CheckCircle size={20} color={weightLoggedToday ? "#16A34A" : "#3B82F6"} />
                 </View>
                 <View>
                   <Text className={`font-medium ${weightLoggedToday ? 'text-green-900' : 'text-gray-900'}`}>Замеры веса</Text>
                   <Text className="text-xs text-gray-500">
                     {weightLoggedToday 
                       ? `${MOCK_USER.currentWeight} кг • Сегодня` 
                       : `${MOCK_USER.currentWeight} кг (предыдущий)`}
                   </Text>
                 </View>
               </View>
               {!weightLoggedToday && (
                 <TouchableOpacity 
                   onPress={() => Alert.alert('Скоро', 'Функционал замеров в разработке')}
                   className="bg-white border border-gray-200 px-4 py-2 rounded-lg"
                 >
                   <Text className="text-gray-900 text-sm font-medium">Внести</Text>
                 </TouchableOpacity>
               )}
            </View>
          </View>
        </View>

        {/* Meals */}
        <View className="px-6">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-lg font-bold text-gray-900">Приемы пищи</Text>
            <TouchableOpacity 
              onPress={() => setMealModalOpen(true)}
              className="flex-row items-center gap-1"
            >
              <Plus size={16} color="#16A34A" />
              <Text className="text-green-600 text-sm font-medium">Добавить</Text>
            </TouchableOpacity>
          </View>

          <View className="gap-4">
            {meals.length === 0 ? (
               <View className="items-center justify-center py-8 bg-white rounded-xl border border-dashed border-gray-200">
                 <Text className="text-gray-400 text-sm">Пока нет записей. Добавьте первый прием пищи!</Text>
               </View>
            ) : (
              meals.map((meal) => (
                <View key={meal.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                  <View className="flex-row justify-between items-start mb-3">
                    <View className="flex-row items-center gap-2">
                      <Utensils size={16} color="#9CA3AF" />
                      <Text className="font-bold text-gray-900 text-lg">{meal.name}</Text>
                      <View className="bg-gray-50 px-2 py-0.5 rounded">
                        <Text className="text-xs text-gray-400">
                          {new Date(meal.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity 
                      onPress={() => handleDeleteMeal(meal.id)}
                      className="p-1.5 bg-gray-50 rounded-lg"
                    >
                      <Trash2 size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>

                  {/* Порции */}
                  <View className="flex-row flex-wrap">
                    <PortionBadge label="Белки" value={meal.portions.protein} colorBg="bg-red-100" colorText="text-red-700" />
                    <PortionBadge label="Жиры" value={meal.portions.fat} colorBg="bg-orange-100" colorText="text-orange-700" />
                    <PortionBadge label="Угли" value={meal.portions.carbs} colorBg="bg-blue-100" colorText="text-blue-700" />
                    <PortionBadge label="Клетч" value={meal.portions.fiber} colorBg="bg-green-100" colorText="text-green-700" />
                  </View>
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>

      <AddMealModal
        visible={isMealModalOpen}
        onClose={() => setMealModalOpen(false)}
        onSave={handleSaveMeal}
      />
    </SafeAreaView>
  );
}
```

### 3. Обновление статуса

```diff