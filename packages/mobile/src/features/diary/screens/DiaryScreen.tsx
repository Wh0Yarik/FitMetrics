import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, Image, Alert, BackHandler, Platform, LayoutAnimation, UIManager, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { Plus, CheckCircle, AlertCircle, Utensils, Trash2, Cloud, CloudOff, RefreshCw, ClipboardList, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, Stack } from 'expo-router';
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

// Включаем LayoutAnimation для Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// --- Helpers & Sub-components ---

const getDateObj = (dateStr: string) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const SyncIndicator = ({ status }: { status: 'synced' | 'syncing' | 'offline' }) => {
  if (status === 'syncing') return <RefreshCw size={16} color="#4CAF50" />;
  if (status === 'offline') return <CloudOff size={16} color="#9CA3AF" />;
  return <Cloud size={16} color="#4CAF50" />;
};

const PortionBadge = React.memo(({ label, value, colorBg, colorText }: { label: string, value: number, colorBg: string, colorText: string }) => (
  <View className={`flex-row items-center px-3 py-1.5 rounded-md mr-2 mb-2 ${colorBg}`}>
    <Text className={`text-xs font-bold ${colorText}`}>{label}: {value > 0 ? value : '–'}</Text>
  </View>
));

const SummaryItem = React.memo(({ label, current, target, colorText }: { label: string, current: number, target: number, colorText: string }) => (
  <View className="items-center flex-1">
    <Text className="text-[10px] text-gray-500 mb-1">{label}</Text>
    <Text className={`font-bold text-lg ${colorText}`}>
      {current} <Text className="text-gray-300 text-sm">/ {target}</Text>
    </Text>
  </View>
));

const SimplePieChart = React.memo(({ data }: { data: { value: number; color: string }[] }) => {
  const size = 80;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  let startAngle = 0;

  const total = data.reduce((acc, item) => acc + item.value, 0);

  return (
    <View className="items-center justify-center" style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
          {data.map((item, index) => {
            const percentage = total === 0 ? 0 : item.value / total;
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
});

export default function DiaryScreen() {
  const [meals, setMeals] = useState<MealEntry[]>([]);
  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

  // UI State
  const [isMealModalOpen, setMealModalOpen] = useState(false);
  const [isSurveyModalOpen, setSurveyModalOpen] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [calendarViewDate, setCalendarViewDate] = useState(new Date()); // Для навигации по месяцам
  
  // Data State
  const [markedDates, setMarkedDates] = useState<Record<string, 'green' | 'orange'>>({});
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

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
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

  const loadMarkedDates = useCallback(() => {
    const year = String(calendarViewDate.getFullYear());
    const month = String(calendarViewDate.getMonth() + 1).padStart(2, '0');
    
    const mealDates = diaryRepository.getDatesWithMeals(year, month);
    const surveyDates = dailySurveyRepository.getDatesWithSurveys(year, month);
    const completedSurveyDates = dailySurveyRepository.getCompletedSurveyDates(year, month);
    
    const allDates = new Set([...mealDates, ...surveyDates]);
    const newMarkedDates: Record<string, 'green' | 'orange'> = {};

    allDates.forEach(date => {
      const hasMeals = mealDates.includes(date);
      const isSurveyComplete = completedSurveyDates.includes(date);

      // Зеленая метка: Есть еда И анкета полностью заполнена
      // Оранжевая метка: Есть данные, но условия зеленой не выполнены
      if (hasMeals && isSurveyComplete) {
        newMarkedDates[date] = 'green';
      } else {
        newMarkedDates[date] = 'orange';
      }
    });

    setMarkedDates(newMarkedDates);
  }, [calendarViewDate]);

  useEffect(() => {
    if (showDatePicker) {
      // Оборачиваем в setTimeout, чтобы тяжелый запрос к БД не блокировал анимацию открытия
      const timer = setTimeout(loadMarkedDates, 50);
      return () => clearTimeout(timer);
    }
  }, [showDatePicker, calendarViewDate, meals, surveyStatus, loadMarkedDates]);

  const configureAnimation = () => {
    LayoutAnimation.configureNext({
      duration: 300,
      create: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity,
      },
      update: {
        type: LayoutAnimation.Types.easeInEaseOut,
      },
      delete: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity,
      },
    });
  };

  const toggleCalendar = () => {
    configureAnimation();
    if (!showDatePicker) {
      setCalendarViewDate(getDateObj(currentDate));
    }
    setShowDatePicker(!showDatePicker);
  };

  const changeMonth = (increment: number) => {
    const newDate = new Date(calendarViewDate);
    newDate.setMonth(newDate.getMonth() + increment);
    setCalendarViewDate(newDate);
  };

  const selectDate = (day: number) => {
    const year = calendarViewDate.getFullYear();
    const month = String(calendarViewDate.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    setCurrentDate(`${year}-${month}-${dayStr}`);
    
    // Close calendar
    configureAnimation();
    setShowDatePicker(false);
  };

  const getHeaderTitle = () => {
    const current = getDateObj(currentDate);
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    if (current.getTime() === now.getTime()) return 'Сегодня';

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (current.getTime() === yesterday.getTime()) return 'Вчера';

    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (current.getTime() === tomorrow.getTime()) return 'Завтра';

    return current.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
  };

  // Calculate stats
  const todayStats = useMemo(() => meals.reduce(
    (acc, meal) => ({
      protein: acc.protein + meal.portions.protein,
      fat: acc.fat + meal.portions.fat,
      carbs: acc.carbs + meal.portions.carbs,
      fiber: acc.fiber + meal.portions.fiber,
    }),
    { protein: 0, fat: 0, carbs: 0, fiber: 0 }
  ), [meals]);

  const goals = MOCK_USER.nutritionGoals;
  
  // Progress calculation
  const totalPortionsConsumed = todayStats.protein + todayStats.fat + todayStats.carbs + todayStats.fiber;
  const totalPortionsGoal = goals.dailyProtein + goals.dailyFat + goals.dailyCarbs + goals.dailyFiber;
  const progressPercentage = totalPortionsGoal > 0 
    ? Math.min(100, Math.round((totalPortionsConsumed / totalPortionsGoal) * 100))
    : 0;

  // Данные для диаграммы
  const isEmpty = totalPortionsConsumed === 0;
  const macroData = useMemo(() => isEmpty 
    ? [{ name: 'Empty', value: 1, color: '#E5E7EB' }]
    : [
        { name: 'Белки', value: todayStats.protein, color: '#EF4444' },
        { name: 'Жиры', value: todayStats.fat, color: '#F97316' },
        { name: 'Углеводы', value: todayStats.carbs, color: '#3B82F6' },
        { name: 'Клетчатка', value: todayStats.fiber, color: '#22C55E' },
      ], [isEmpty, todayStats]);

  return (
    <View className="flex-1 bg-gray-50">
      <Stack.Screen
        options={{
          headerShown: true,
          header: () => (
            <SafeAreaView edges={['top']} className="bg-white rounded-b-3xl shadow-sm border-b border-gray-100 z-10">
              <View className="px-6 pb-4 pt-2">
                <View className="flex-row justify-between items-center mb-4">
                  <View>
                    <TouchableOpacity onPress={toggleCalendar} className="flex-row items-center gap-2">
                      <Text className="text-2xl font-bold text-gray-900">{getHeaderTitle()}</Text>
                      {showDatePicker ? <ChevronUp size={24} color="#111827" /> : <ChevronDown size={24} color="#111827" />}
                      <View className="mt-1"><SyncIndicator status={syncStatus} /></View>
                    </TouchableOpacity>
                    <Text className="text-gray-500 text-sm">
                      {getDateObj(currentDate).toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}
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

                {/* Custom Inline Calendar */}
                {showDatePicker && (
                  <View className="mt-2 border-t border-gray-100 pt-4 overflow-hidden">
                    {/* Calendar Header */}
                    <View className="flex-row justify-between items-center mb-4 px-2">
                      <TouchableOpacity onPress={() => changeMonth(-1)} className="p-2 bg-gray-50 rounded-full">
                        <ChevronLeft size={20} color="#374151" />
                      </TouchableOpacity>
                      <Text className="text-lg font-semibold text-gray-900 capitalize">
                        {calendarViewDate.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
                      </Text>
                      <TouchableOpacity onPress={() => changeMonth(1)} className="p-2 bg-gray-50 rounded-full">
                        <ChevronRight size={20} color="#374151" />
                      </TouchableOpacity>
                    </View>

                    {/* Week Days */}
                    <View className="flex-row justify-between mb-2">
                      {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(d => (
                        <Text key={d} className="w-[14%] text-center text-gray-400 text-xs font-medium">{d}</Text>
                      ))}
                    </View>

                    {/* Days Grid */}
                    <View className="flex-row flex-wrap">
                      {(() => {
                        const year = calendarViewDate.getFullYear();
                        const month = calendarViewDate.getMonth();
                        const daysInMonth = new Date(year, month + 1, 0).getDate();
                        let firstDay = new Date(year, month, 1).getDay();
                        firstDay = firstDay === 0 ? 6 : firstDay - 1; // Mon=0

                        const days = [];
                        for (let i = 0; i < firstDay; i++) {
                          days.push(<View key={`empty-${i}`} style={{ width: '14.28%' }} className="h-10" />);
                        }
                        for (let i = 1; i <= daysInMonth; i++) {
                          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
                          const isSelected = dateStr === currentDate;
                          const isToday = dateStr === new Date().toISOString().split('T')[0];
                          const markStatus = markedDates[dateStr];
                          
                          days.push(
                            <TouchableOpacity key={i} onPress={() => selectDate(i)} style={{ width: '14.28%' }} className="h-10 items-center justify-center">
                              <View className={`w-8 h-8 items-center justify-center rounded-full ${isSelected ? 'bg-green-600' : ''}`}>
                                <Text className={`${isSelected ? 'text-white font-bold' : isToday ? 'text-green-600 font-bold' : 'text-gray-900'}`}>{i}</Text>
                                {markStatus && (
                                  <View className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${
                                    isSelected 
                                      ? 'bg-white' 
                                      : markStatus === 'green' ? 'bg-green-500' : 'bg-orange-400'
                                  }`} />
                                )}
                              </View>
                            </TouchableOpacity>
                          );
                        }
                        return days;
                      })()}
                    </View>
                  </View>
                )}
              </View>
            </SafeAreaView>
          ),
        }}
      />
      <StatusBar barStyle="dark-content" />
      
      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ paddingBottom:0 }}
        scrollEventThrottle={16}
      >
        {/* Macro Summary Card */}
          {/* <View className="bg-gray-50 rounded-2xl p-4 flex-row items-center justify-between">
            <View className="flex-1">
               <Text className="text-sm text-gray-500 mb-1">Дневная норма</Text>
               <Text className="text-3xl font-bold text-gray-900">{progressPercentage}%</Text>
               <Text className="text-xs text-gray-500 mb-3">выполнено (порции)</Text>
               
               <View className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                 <View className="bg-green-500 h-full rounded-full" style={{ width: `${progressPercentage}%` }} />
               </View>
            </View>
            <View className="ml-4">
               <SimplePieChart data={macroData} />
            </View>
          </View> */}
          
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
            {meals.map((meal) => (
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
              ))}

            {/* Кнопка добавления в конце списка */}
            <TouchableOpacity 
              onPress={() => setMealModalOpen(true)}
              className="flex-row items-center justify-center py-4 bg-white rounded-xl gap-2"
              style={{ borderWidth: 2, borderColor: '#D1D5DB', borderStyle: 'dashed' }}
            >
              <View className="w-8 h-8 bg-green-100 rounded-full items-center justify-center">
                <Plus size={20} color="#16A34A" />
              </View>
              <Text className="text-gray-600 font-medium">Добавить прием пищи</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <TouchableOpacity 
        onPress={() => setSurveyModalOpen(true)}
        className="absolute bottom-6 right-6 w-12 h-12 bg-green-600 rounded-full items-center justify-center shadow-lg z-50"
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

      {/* <TouchableOpacity 
        onPress={() => setMealModalOpen(true)}
        className="absolute bottom-6 right-6 w-16 h-16 bg-green-600 rounded-full items-center justify-center shadow-lg z-50"
      >
        <Utensils size={28} color="white" />
      </TouchableOpacity> */}

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
    </View>
  );
}