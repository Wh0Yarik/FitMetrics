import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, Image, Alert, BackHandler, Platform, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { Plus, CheckCircle, AlertCircle, Utensils, Trash2, Cloud, CloudOff, RefreshCw, ClipboardList, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, Stack } from 'expo-router';
import Svg, { Circle, G } from 'react-native-svg';
import { Calendar, LocaleConfig, DateData } from 'react-native-calendars';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring, runOnJS } from 'react-native-reanimated';
import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';

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

// Настройка локализации календаря
LocaleConfig.locales['ru'] = {
  monthNames: ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'],
  monthNamesShort: ['Янв.','Фев.','Март','Апр.','Май','Июнь','Июль','Авг.','Сент.','Окт.','Нояб.','Дек.'],
  dayNames: ['Воскресенье','Понедельник','Вторник','Среда','Четверг','Пятница','Суббота'],
  dayNamesShort: ['Вс','Пн','Вт','Ср','Чт','Пт','Сб'],
  today: 'Сегодня'
};
LocaleConfig.defaultLocale = 'ru';

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
  
  const MAX_CALENDAR_HEIGHT = 360;
  const calendarHeight = useSharedValue(0);
  const contextHeight = useSharedValue(0);

  // Data State
  const [markedDates, setMarkedDates] = useState<any>({});
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
    const newMarkedDates: any = {};

    allDates.forEach(date => {
      const hasMeals = mealDates.includes(date);
      const isSurveyComplete = completedSurveyDates.includes(date);

      // Зеленая метка: Есть еда И анкета полностью заполнена
      // Оранжевая метка: Есть данные, но условия зеленой не выполнены
      if (hasMeals && isSurveyComplete) {
        newMarkedDates[date] = { marked: true, dotColor: '#22C55E' }; // green-500
      } else {
        newMarkedDates[date] = { marked: true, dotColor: '#FB923C' }; // orange-400
      }
    });

    // Добавляем выделение текущей выбранной даты
    // react-native-calendars требует объединения стилей для выбранной даты
    if (newMarkedDates[currentDate]) {
      newMarkedDates[currentDate] = {
        ...newMarkedDates[currentDate],
        selected: true,
        selectedColor: '#16A34A', // green-600
      };
    } else {
      newMarkedDates[currentDate] = { selected: true, selectedColor: '#16A34A' };
    }

    setMarkedDates(newMarkedDates);
  }, [calendarViewDate, currentDate]);

  useEffect(() => {
    if (showDatePicker) {
      // Оборачиваем в setTimeout, чтобы тяжелый запрос к БД не блокировал анимацию открытия
      const timer = setTimeout(loadMarkedDates, 50);
      return () => clearTimeout(timer);
    }
  }, [showDatePicker, calendarViewDate, meals, surveyStatus, loadMarkedDates]);


  const toggleCalendar = () => {
    if (calendarHeight.value === 0) {
      setCalendarViewDate(getDateObj(currentDate));
      calendarHeight.value = withSpring(MAX_CALENDAR_HEIGHT, { damping: 15 });
      setShowDatePicker(true);
    } else {
      calendarHeight.value = withTiming(0, { duration: 250 });
      setShowDatePicker(false);
    }
  };

  const onDayPress = (day: DateData) => {
    setCurrentDate(day.dateString);
    
    // Обновляем view date, если выбрали день из другого месяца
    const newViewDate = new Date(day.timestamp);
    setCalendarViewDate(newViewDate);
    
    // Close calendar
    calendarHeight.value = withTiming(0, { duration: 250 });
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

  const animatedContainerStyle = useAnimatedStyle(() => ({
    height: calendarHeight.value,
    overflow: 'hidden',
  }));

  const animatedContentStyle = useAnimatedStyle(() => ({
    // Эффект "вытягивания": календарь сдвигается вниз вместе с контейнером
    // Когда height = 0, translateY = -360 (спрятан сверху)
    // Когда height = 360, translateY = 0 (полностью виден)
    transform: [{ translateY: calendarHeight.value - MAX_CALENDAR_HEIGHT }],
    opacity: calendarHeight.value / MAX_CALENDAR_HEIGHT,
  }));

  const panGesture = Gesture.Pan()
    .activeOffsetY([-5, 5]) // Активируем при небольшом вертикальном движении
    .failOffsetX([-20, 20])   // Игнорируем, если пользователь свайпает месяцы (горизонтально)
    .onStart(() => {
      contextHeight.value = calendarHeight.value;
    })
    .onUpdate((e) => {
      const newHeight = contextHeight.value + e.translationY;
      calendarHeight.value = Math.max(0, Math.min(MAX_CALENDAR_HEIGHT, newHeight));
    })
    .onEnd(() => {
      // Если вытянули больше чем на 30% или быстро смахнули вниз
      if (calendarHeight.value > MAX_CALENDAR_HEIGHT * 0.3) {
        calendarHeight.value = withSpring(MAX_CALENDAR_HEIGHT, { damping: 15 });
        runOnJS(setShowDatePicker)(true);
      } else {
        calendarHeight.value = withTiming(0, { duration: 250 });
        runOnJS(setShowDatePicker)(false);
      }
    });

  return (
    <View className="flex-1 bg-gray-50">
      <Stack.Screen
        options={{ headerShown: false }}
      />
      <GestureHandlerRootView style={{ zIndex: 10 }}>
            <SafeAreaView edges={['top']} className="bg-white rounded-b-3xl shadow-sm border-b border-gray-100 z-10">
              <GestureDetector gesture={panGesture}>
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
                <Animated.View style={[{ borderTopColor: '#F3F4F6' }, animatedContainerStyle]}>
                  <Animated.View style={animatedContentStyle}>
                    <Calendar
                      current={currentDate}
                      onDayPress={onDayPress}
                      markedDates={markedDates}
                      firstDay={1} // Понедельник
                      enableSwipeMonths={true}
                      onMonthChange={(month: DateData) => {
                        setCalendarViewDate(new Date(month.timestamp));
                      }}
                      theme={{
                        backgroundColor: '#ffffff',
                        calendarBackground: '#ffffff',
                        textSectionTitleColor: '#9CA3AF',
                        selectedDayBackgroundColor: '#16A34A',
                        selectedDayTextColor: '#ffffff',
                        todayTextColor: '#16A34A',
                        dayTextColor: '#111827',
                        textDisabledColor: '#D1D5DB',
                        dotColor: '#16A34A',
                        selectedDotColor: '#ffffff',
                        arrowColor: '#374151',
                        monthTextColor: '#111827',
                        textDayFontWeight: '400',
                        textMonthFontWeight: '600',
                        textDayHeaderFontWeight: '500',
                      }}
                    />
                  </Animated.View>
                </Animated.View>
              </View>
              </GestureDetector>
            </SafeAreaView>
      </GestureHandlerRootView>
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