import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, StatusBar, Image, RefreshControl, Alert, BackHandler, Touchable } from 'react-native';
import { Plus, CheckCircle, AlertCircle, Utensils, Trash2, Cloud, CloudOff, RefreshCw, ClipboardList } from 'lucide-react-native';
import { useFocusEffect } from 'expo-router';
import Svg, { Circle, G } from 'react-native-svg';

import { AddMealModal, PortionCount } from '../components/AddMealModal';
import { DailySurveyModal } from '../components/DailySurveyModal';
import { diaryRepository, MealEntry } from '../repositories/DiaryRepository';
import { dailySurveyRepository, DailySurveyData } from '../repositories/DailySurveyRepository';

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
  const [isSurveyModalOpen, setSurveyModalOpen] = useState(false);
  // FIX: Используем локальное время вместо UTC, чтобы избежать смещения даты
  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [refreshing, setRefreshing] = useState(false);
  
  // Real states
  const [surveyStatus, setSurveyStatus] = useState<'empty' | 'partial' | 'complete'>('empty');
  const [currentWeight, setCurrentWeight] = useState(MOCK_USER.currentWeight);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline'>('synced');
  const [dailySurvey, setDailySurvey] = useState<DailySurveyData | null>(null);
  
  useFocusEffect(
    useCallback(() => {
      loadMeals();
      loadSurveyStatus();

      // На главном экране кнопка "Назад" должна закрывать приложение, а не возвращать к логину
      const onBackPress = () => {
        Alert.alert('Выход', 'Вы хотите выйти из приложения?', [
          { text: 'Отмена', style: 'cancel', onPress: () => {} },
          { text: 'Выйти', style: 'destructive', onPress: () => BackHandler.exitApp() },
        ]);
        return true;
      };

      BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [currentDate])
  );

  const loadMeals = () => {
    const data = diaryRepository.getMealsByDate(currentDate);
    setMeals(data);
  };

  const loadSurveyStatus = () => {
    const survey = dailySurveyRepository.getSurveyByDate(currentDate);
    setDailySurvey(survey);
    
    if (!survey) {
      setSurveyStatus('empty');
      return;
    }

    // Проверяем заполненность всех полей
    const isComplete = 
      survey.weight != null &&
      survey.motivation != null &&
      survey.sleep != null &&
      survey.stress != null &&
      survey.digestion != null &&
      survey.water != null &&
      survey.hunger != null &&
      survey.libido != null;

    setSurveyStatus(isComplete ? 'complete' : 'partial');
    
    if (survey.weight) {
      setCurrentWeight(survey.weight);
    }
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

  const handleSaveSurvey = (data: DailySurveyData) => {
    dailySurveyRepository.saveSurvey(data);
    loadSurveyStatus();
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

  // Данные для диаграммы
  const isEmpty = totalPortionsConsumed === 0;
  const macroData = isEmpty 
    ? [{ name: 'Empty', value: 1, color: '#E5E7EB' }]
    : [
        { name: 'Белки', value: todayStats.protein, color: '#EF4444' },
        { name: 'Жиры', value: todayStats.fat, color: '#F97316' },
        { name: 'Углеводы', value: todayStats.carbs, color: '#3B82F6' },
        { name: 'Клетчатка', value: todayStats.fiber, color: '#22C55E' },
      ];

  // Компонент круговой диаграммы
  const SimplePieChart = () => {
    const size = 80;
    const strokeWidth = 8;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    let startAngle = 0;

    const total = macroData.reduce((acc, item) => acc + item.value, 0);

    return (
      <View className="items-center justify-center" style={{ width: size, height: size }}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
            {macroData.map((item, index) => {
              const percentage = item.value / total;
              const strokeDasharray = `${circumference * percentage} ${circumference}`;
              const rotate = (startAngle * 360);
              startAngle += percentage;
              
              return (
                <Circle
                  key={index}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke={item.color}
                  strokeWidth={strokeWidth}
                  fill="transparent"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={0}
                  rotation={rotate}
                  origin={`${size / 2}, ${size / 2}`}
                />
              );
            })}
          </G>
        </Svg>
        <View className="absolute inset-0 items-center justify-center">
           <Text className="text-[10px] text-gray-400 font-bold">План</Text>
        </View>
      </View>
    );
  };

  // Helper Components
  const SyncIndicator = () => {
    if (syncStatus === 'syncing') return <RefreshCw size={16} color="#4CAF50" />; // animate-spin requires Reanimated
    if (syncStatus === 'offline') return <CloudOff size={16} color="#9CA3AF" />;
    return <Cloud size={16} color="#4CAF50" />;
  };

  const PortionBadge = ({ label, value, colorBg, colorText }: { label: string, value: number, colorBg: string, colorText: string }) => {
    return (
      <View className={`flex-row items-center px-3 py-1.5 rounded-md mr-2 mb-2 ${colorBg}`}>
        <Text className={`text-xs font-bold ${colorText}`}>{label}: {value > 0 ? value : '–'}</Text>
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
    <SafeAreaView className="flex-1 bg-gray-50 pt-2">
      <StatusBar barStyle="dark-content" />
      
      {/* Header (Fixed) */}
      <View className="bg-white p-6 pb-4 pt-10 rounded-b-3xl shadow-sm border-b border-gray-100 z-10">
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
        </View>
          

      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
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
            <View className="ml-4">
               <SimplePieChart />
            </View>
          </View>
          
          {/* Targets Grid */}
          <View className="flex-row justify-between mt-6">
            <SummaryItem label="Белки" current={todayStats.protein} target={goals.dailyProtein} colorText="text-red-600" />
            <SummaryItem label="Жиры" current={todayStats.fat} target={goals.dailyFat} colorText="text-orange-500" />
            <SummaryItem label="Угли" current={todayStats.carbs} target={goals.dailyCarbs} colorText="text-blue-500" />
            <SummaryItem label="Клетчатка" current={todayStats.fiber} target={goals.dailyFiber} colorText="text-green-600" />
          </View>
          
          <View className="border-b border-gray-200 mt-6 mx-6" />

        {/* Meals */}
        <View className="px-6 py-6">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-lg font-bold text-gray-900">Приемы пищи</Text>
            <TouchableOpacity 
              onPress={() => setMealModalOpen(true)}
          >
            <Text className="text-md text-green-500">Добавить +</Text>
      </TouchableOpacity>
          </View>

          <View className="gap-2">
            {meals.length === 0 ? (
               <TouchableOpacity 
                 onPress={() => setMealModalOpen(true)}>
               <View className="items-center justify-center py-4 bg-white rounded-xl border border-dashed border-gray-200">
                 <Text className="text-gray-400 text-sm mb-3">Пока нет записей</Text>
                 <Text className="text-gray-400 text-sm mb-3">Добавьте первый прием пищи!</Text>
                 <View className="w-12 h-12 bg-green-100 rounded-full items-center justify-center">
                   <Plus size={24} color="#16A34A" />
                 </View>
               </View>
               </TouchableOpacity>
            ) : (
              meals.map((meal) => (
                <View key={meal.id} className="bg-white p-2 rounded-xl border border-gray-100 shadow-sm">
                  <View className="flex-row justify-between items-start mb-3">
                    <View className="flex-row items-center gap-2 flex-1 mr-2">
                      <Utensils size={16} color="#9CA3AF" />
                      <Text className="font-bold text-gray-900 text-lg flex-1" numberOfLines={1} ellipsizeMode="tail">{meal.name}</Text>
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
                  <View className="flex-row flex-wrap flex-row justify-between mt-1">
                    <PortionBadge label="Б" value={meal.portions.protein} colorBg="bg-red-100" colorText="text-red-700" />
                    <PortionBadge label="Ж" value={meal.portions.fat} colorBg="bg-orange-100" colorText="text-orange-700" />
                    <PortionBadge label="У" value={meal.portions.carbs} colorBg="bg-blue-100" colorText="text-blue-700" />
                    <PortionBadge label="К" value={meal.portions.fiber} colorBg="bg-green-100" colorText="text-green-700" />
                  </View>
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>

      <TouchableOpacity 
        onPress={() => setSurveyModalOpen(true)}
        className="absolute bottom-[80px] right-0 w-12 h-12 bg-green-600 rounded-full items-center justify-center shadow-lg z-50"
      >
        <ClipboardList size={24} color="white" />
        <View 
          className={`absolute top-0 right-0 w-4 h-4 rounded-full border-2 border-white ${
            surveyStatus === 'complete' 
              ? 'bg-green-300' 
              : surveyStatus === 'partial' 
                ? 'bg-orange-400' 
                : 'bg-red-500'
          }`} 
        />
      </TouchableOpacity>

      <TouchableOpacity 
        onPress={() => setMealModalOpen(true)}
        className="absolute bottom-0 right-0 w-20 h-20 bg-green-600 rounded-full items-center justify-center shadow-lg z-50"
      >
        <Utensils size={32} color="white" />
      </TouchableOpacity>

      <AddMealModal
        visible={isMealModalOpen}
        onClose={() => setMealModalOpen(false)}
        onSave={handleSaveMeal}
        nextMealNumber={meals.length + 1}
      />

      <DailySurveyModal
        visible={isSurveyModalOpen}
        onClose={() => setSurveyModalOpen(false)}
        onSave={handleSaveSurvey}
        date={currentDate}
        initialData={dailySurvey}
      />
    </SafeAreaView>
  );
}