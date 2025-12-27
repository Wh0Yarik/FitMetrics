import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, Image, Alert, BackHandler } from 'react-native';
import { Plus, Utensils, Trash2, Cloud, CloudOff, RefreshCw, ClipboardList } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, Stack } from 'expo-router';
import { Calendar, LocaleConfig, DateData } from 'react-native-calendars';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring, runOnJS } from 'react-native-reanimated';
import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';

import { AddMealModal, PortionCount } from '../components/AddMealModal';
import { DailySurveyModal } from '../components/DailySurveyModal';
import { diaryRepository, MealEntry } from '../repositories/DiaryRepository';
import { dailySurveyRepository, DailySurveyData } from '../repositories/DailySurveyRepository';
import { COLORS } from '../../../constants/Colors';

// --- Конфигурация и константы ---

// Моковые данные пользователя (заглушка до реализации полноценного профиля)
const MOCK_USER = {
  name: 'Алексей',
  avatarUrl: null,
  currentWeight: 75.5,
  nutritionGoals: { dailyProtein: 5, dailyFat: 3, dailyCarbs: 5, dailyFiber: 3 }
};

// Настройка локализации календаря на русский язык
const configureCalendarLocale = () => {
  LocaleConfig.locales['ru'] = {
    monthNames: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
    monthNamesShort: ['Янв.', 'Фев.', 'Март', 'Апр.', 'Май', 'Июнь', 'Июль', 'Авг.', 'Сент.', 'Окт.', 'Нояб.', 'Дек.'],
    dayNames: ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'],
    dayNamesShort: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
    today: 'Сегодня'
  };
  LocaleConfig.defaultLocale = 'ru';
};
configureCalendarLocale();

// --- Вспомогательные функции ---

// Преобразование строки даты "YYYY-MM-DD" в объект Date
const getDateObj = (dateStr: string) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
};

// Формирование заголовка даты (Сегодня, Вчера, Завтра или полная дата)
const getHeaderTitle = (currentDate: string) => {
  const current = getDateObj(currentDate);
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  if (current.getTime() === now.getTime()) return 'Сегодня';

  //const yesterday = new Date(now);
  //yesterday.setDate(yesterday.getDate() - 1);
  //if (current.getTime() === yesterday.getTime()) return 'Вчера';

  //const tomorrow = new Date(now);
  //tomorrow.setDate(tomorrow.getDate() + 1);
  //if (current.getTime() === tomorrow.getTime()) return 'Завтра';

  return current.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
};

// --- Подкомпоненты (UI элементы) ---

// Индикатор статуса синхронизации (облако)
const SyncIndicator = ({ status }: { status: 'synced' | 'syncing' | 'offline' }) => {
  if (status === 'syncing') return <RefreshCw size={16} color={COLORS.primary} />;
  if (status === 'offline') return <CloudOff size={16} color="#9CA3AF" />;
  return <Cloud size={16} color={COLORS.primary} />;
};

// Бейдж для отображения количества порций (Б/Ж/У/К)
const PortionBadge = React.memo(({ label, value, colorBg, colorText, textColor }: { label: string, value: number, colorBg: string, colorText?: string, textColor?: string }) => (
  <View className={`flex-row items-center px-3 py-1.5 rounded-md mr-2 mb-2 ${colorBg}`}>
    <Text className={`text-xs font-bold ${colorText || ''}`} style={textColor ? { color: textColor } : undefined}>{label}: {value > 0 ? value : '–'}</Text>
  </View>
));

// Элемент сводки (План/Факт) по нутриентам в верхней части экрана
const SummaryItem = React.memo(({ label, current, target, colorText, textColor }: { label: string, current: number, target: number, colorText?: string, textColor?: string }) => (
  <View className="items-center flex-1">
    <Text className={`font-bold text-lg ${colorText || ''}`} style={textColor ? { color: textColor } : undefined}>
      {current} <Text className="text-gray-300 text-sm">/ {target}</Text>
    </Text>
    <Text className="text-[10px] text-gray-500 mb-1">{label}</Text>
  </View>
));

// Карточка приема пищи в списке
const MealItem = React.memo(({ meal, onDelete }: { meal: MealEntry; onDelete: (id: string) => void }) => (
  <View className="bg-white p-2 rounded-xl border border-gray-100 shadow-sm">
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
        onPress={() => onDelete(meal.id)}
        className="p-1.5 bg-gray-50 rounded-lg"
      >
        <Trash2 size={16} color="#EF4444" />
      </TouchableOpacity>
    </View>

    <View className="flex-row flex-wrap flex-row justify-between mt-1">
      <PortionBadge label="Б" value={meal.portions.protein} colorBg="bg-red-100" colorText="text-red-700" />
      <PortionBadge label="Ж" value={meal.portions.fat} colorBg="bg-orange-100" colorText="text-orange-700" />
      <PortionBadge label="У" value={meal.portions.carbs} colorBg="bg-blue-100" colorText="text-blue-700" />
      <PortionBadge label="К" value={meal.portions.fiber} colorBg="bg-green-100" textColor={COLORS.primary} />
    </View>
  </View>
));

// --- Хуки (Логика) ---

// Хук для управления данными дневника (еда, анкеты, статус синхронизации)
const useDiaryData = (currentDate: string) => {
  const [meals, setMeals] = useState<MealEntry[]>([]);
  const [surveyStatus, setSurveyStatus] = useState<'empty' | 'partial' | 'complete'>('empty');
  const [dailySurvey, setDailySurvey] = useState<DailySurveyData | null>(null);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline'>('synced');

  // Загрузка данных из репозиториев при смене даты
  const loadData = useCallback(() => {
    setMeals(diaryRepository.getMealsByDate(currentDate));
    
    const survey = dailySurveyRepository.getSurveyByDate(currentDate);
    setDailySurvey(survey);
    
    if (!survey) {
      setSurveyStatus('empty');
    } else {
      const isComplete = 
        survey.weight != null && survey.motivation != null && survey.sleep != null &&
        survey.stress != null && survey.digestion != null && survey.water != null &&
        survey.hunger != null && survey.libido != null;
      setSurveyStatus(isComplete ? 'complete' : 'partial');
    }
  }, [currentDate]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  return { meals, surveyStatus, dailySurvey, syncStatus, refreshData: loadData };
};

// Хук для управления логикой календаря (анимации, выбор даты, отметки)
const useCalendarLogic = (currentDate: string, setCurrentDate: (date: string) => void) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [calendarViewDate, setCalendarViewDate] = useState(new Date());
  const [markedDates, setMarkedDates] = useState<any>({});
  
  const MAX_CALENDAR_HEIGHT = 260;
  const calendarHeight = useSharedValue(0);
  const contextHeight = useSharedValue(0);

  // Анимации и логика открытия/закрытия (Worklets + JS)
  const openCalendar = useCallback((velocity = 0) => {
    'worklet';
    calendarHeight.value = withSpring(MAX_CALENDAR_HEIGHT, { 
      velocity,
      damping: 100,
      stiffness: 1000
    });
  }, [MAX_CALENDAR_HEIGHT, calendarHeight]);

  const closeCalendar = useCallback((velocity = 0) => {
    'worklet';
    calendarHeight.value = withSpring(0, { 
      velocity,
      damping: 100,
      stiffness: 1000,
      overshootClamping: true
    });
  }, [calendarHeight]);

  const prepareCalendarOpen = useCallback(() => {
    setCalendarViewDate(getDateObj(currentDate));
    setShowDatePicker(true);
  }, [currentDate]);

  const finalizeCalendarClose = useCallback(() => {
    setShowDatePicker(false);
  }, []);

  // Переключение видимости календаря с анимацией
  const toggleCalendar = useCallback(() => {
    if (calendarHeight.value === 0) {
      prepareCalendarOpen();
      openCalendar();
    } else {
      finalizeCalendarClose();
      closeCalendar();
    }
  }, [calendarHeight, prepareCalendarOpen, openCalendar, finalizeCalendarClose, closeCalendar]);

  // Обработка нажатия на день в календаре
  const onDayPress = useCallback((day: DateData) => {
    setCurrentDate(day.dateString);
    setCalendarViewDate(new Date(day.timestamp));
    closeCalendar();
    finalizeCalendarClose();
  }, [closeCalendar, finalizeCalendarClose, setCurrentDate]);

  // Загрузка отметок (точек) для календаря: есть ли еда/анкета в этот день
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
      newMarkedDates[date] = { 
        marked: true, 
        dotColor: (hasMeals && isSurveyComplete) ? COLORS.primary : '#FB923C' 
      };
    });

    const selectedStyle = { selected: true, selectedColor: COLORS.primary };
    newMarkedDates[currentDate] = newMarkedDates[currentDate] 
      ? { ...newMarkedDates[currentDate], ...selectedStyle }
      : selectedStyle;

    setMarkedDates(newMarkedDates);
  }, [calendarViewDate, currentDate]);

  // Обновление отметок при открытии календаря (с задержкой для плавности анимации)
  useEffect(() => {
    if (showDatePicker) {
      const timer = setTimeout(loadMarkedDates, 50);
      return () => clearTimeout(timer);
    }
  }, [showDatePicker, calendarViewDate, loadMarkedDates]);

  // Жест для вытягивания/сворачивания календаря
  const panGesture = useMemo(() => Gesture.Pan()
    .activeOffsetY([-5, 5]) 
    .failOffsetX([-20, 20])
    .onStart(() => { contextHeight.value = calendarHeight.value; })
    .onUpdate((e) => {
      const newHeight = contextHeight.value + e.translationY;
      calendarHeight.value = Math.max(0, Math.min(MAX_CALENDAR_HEIGHT, newHeight));
    })
    .onEnd((e) => {
      if (calendarHeight.value > MAX_CALENDAR_HEIGHT * 0.5) {
        openCalendar(e.velocityY);
        runOnJS(prepareCalendarOpen)();
      } else {
        closeCalendar(e.velocityY);
        runOnJS(finalizeCalendarClose)();
      }
    }), [calendarHeight, contextHeight, MAX_CALENDAR_HEIGHT, openCalendar, closeCalendar, prepareCalendarOpen, finalizeCalendarClose]);

  const animatedContainerStyle = useAnimatedStyle(() => ({
    height: calendarHeight.value,
    overflow: 'hidden',
  }));

  const animatedContentStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: calendarHeight.value - MAX_CALENDAR_HEIGHT }],
    opacity: calendarHeight.value / MAX_CALENDAR_HEIGHT,
  }));

  return {
    showDatePicker,
    calendarViewDate,
    setCalendarViewDate,
    markedDates,
    toggleCalendar,
    onDayPress,
    panGesture,
    animatedContainerStyle,
    animatedContentStyle
  };
};

// --- Основной компонент экрана ---

export default function DiaryScreen() {
  // Инициализация текущей даты (сегодня)
  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date();
    return now.toISOString().split('T')[0];
  });

  // Состояния модальных окон
  const [isMealModalOpen, setMealModalOpen] = useState(false);
  const [isSurveyModalOpen, setSurveyModalOpen] = useState(false);

  // Подключение хуков логики
  const { meals, surveyStatus, dailySurvey, syncStatus, refreshData } = useDiaryData(currentDate);
  const calendar = useCalendarLogic(currentDate, setCurrentDate);

  // Обработка системной кнопки "Назад" (выход из приложения на главном экране)
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        Alert.alert('Выход', 'Вы хотите выйти из приложения?', [
          { text: 'Отмена', style: 'cancel', onPress: () => {} },
          { text: 'Выйти', style: 'destructive', onPress: () => BackHandler.exitApp() },
        ]);
        return true;
      };
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [])
  );

  // Сохранение приема пищи
  const handleSaveMeal = useCallback((name: string, portions: PortionCount) => {
    diaryRepository.addMeal(currentDate, name, portions);
    refreshData();
  }, [currentDate, refreshData]);

  // Сохранение ежедневной анкеты
  const handleSaveSurvey = useCallback((data: DailySurveyData) => {
    dailySurveyRepository.saveSurvey(data);
    refreshData();
  }, [refreshData]);

  // Удаление приема пищи с подтверждением
  const handleDeleteMeal = useCallback((id: string) => {
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
            refreshData();
          }
        }
      ]
    );
  }, [refreshData]);

  // Вычисление суммарной статистики за день (мемоизация для производительности)
  const todayStats = useMemo(() => meals.reduce(
    (acc, meal) => ({
      protein: acc.protein + meal.portions.protein,
      fat: acc.fat + meal.portions.fat,
      carbs: acc.carbs + meal.portions.carbs,
      fiber: acc.fiber + meal.portions.fiber,
    }),
    { protein: 0, fat: 0, carbs: 0, fiber: 0 }
  ), [meals]);


  return (
    <View className="flex-1 bg-gray-50">
      <Stack.Screen
        options={{ headerShown: false }}
      />
      <GestureHandlerRootView style={{ zIndex: 10 }}>
            {/* Хедер и Календарь в SafeAreaView */}
            <SafeAreaView edges={['top']} className="bg-white rounded-b-3xl shadow-sm border-b border-gray-100 z-10">
              <GestureDetector gesture={calendar.panGesture}>
              <View className="px-6 pb-2 pt-2">
                <View className="flex-row justify-between items-center mb-2">
                  {/* Заголовок даты и переключатель календаря */}
                  <View>
                    <TouchableOpacity onPress={calendar.toggleCalendar} className="flex-row items-center gap-2">
                      {getHeaderTitle(currentDate) === 'Сегодня' ? (
                        <View className="px-3 py-1 rounded-md" style={{ backgroundColor: COLORS.primary }}>
                          <Text className="text-2xl text-white">{getHeaderTitle(currentDate)}</Text>
                        </View>
                      ) : (
                        <Text className="text-2xl font text-gray-900">{getHeaderTitle(currentDate)}</Text>
                      )}
                      <View className="mt-1"><SyncIndicator status={syncStatus} /></View>
                    </TouchableOpacity>
                  </View>
                  {/* Аватар пользователя */}
                  <View className="w-10 h-10 bg-green-50 rounded-full items-center justify-center border border-green-100 overflow-hidden">
                    {MOCK_USER.avatarUrl ? (
                      <Image source={{ uri: MOCK_USER.avatarUrl }} className="w-full h-full" />
                    ) : (
                      <Text className="font-bold text-lg" style={{ color: COLORS.primary }}>{MOCK_USER.name.charAt(0)}</Text>
                    )}
                  </View>
                </View>

                {/* Выпадающий календарь с анимацией */}
                <Animated.View style={[{ borderTopColor: '#F3F4F6' }, calendar.animatedContainerStyle]}>
                  <Animated.View style={calendar.animatedContentStyle}>
                    <Calendar
                      current={currentDate}
                      onDayPress={calendar.onDayPress}
                      markedDates={calendar.markedDates}
                      firstDay={1} // Понедельник
                      enableSwipeMonths={true}
                      onMonthChange={(month: DateData) => {
                        calendar.setCalendarViewDate(new Date(month.timestamp));
                      }}
                      theme={{
                        backgroundColor: '#ffffff',
                        calendarBackground: '#ffffff',
                        textSectionTitleColor: '#9CA3AF',
                        selectedDayBackgroundColor: COLORS.primary,
                        selectedDayTextColor: '#ffffff',
                        todayTextColor: COLORS.primary,
                        dayTextColor: '#111827',
                        textDisabledColor: '#D1D5DB',
                        dotColor: COLORS.primary,
                        selectedDotColor: '#ffffff',
                        arrowColor: '#374151',
                        monthTextColor: '#111827',
                        textDayFontWeight: '400',
                        textMonthFontWeight: '600',
                        textDayHeaderFontWeight: 'bold',
                        textDayFontSize: 10,
                        textDayHeaderFontSize: 9,
                        'stylesheet.calendar.main': {
                          week: {
                            marginTop: 0,
                            marginBottom: 2,
                            flexDirection: 'row',
                            justifyContent: 'space-around',
                          },
                        },
                        'stylesheet.calendar.header': {
                          header: {
                            marginTop: 2,
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            paddingLeft: 10,
                            paddingRight: 10,
                            alignItems: 'center',
                          },
                        },
                        'stylesheet.day.basic': {
                          today: {
                            backgroundColor: 'bg-green-100',
                            borderRadius: 100,
                          },
                          todayText: {
                            color: COLORS.primary,
                            fontWeight: '600',
                          },
                        },
                      }}
                    />
                  </Animated.View>
                </Animated.View>
                <View className="items-center py-1">
                  <View className="w-10 h-0.5 bg-gray-200 rounded-full" />
                </View>
              </View>
               
              </GestureDetector>
            </SafeAreaView>
      </GestureHandlerRootView>
      <StatusBar barStyle="dark-content" />
      
      <ScrollView 
        // Основной скроллируемый контент
        className="flex-1"
        contentContainerStyle={{ paddingBottom:0 }}
        scrollEventThrottle={16}
      >
          {/* Сетка целей (План/Факт по нутриентам) */}
          <View className="flex-row justify-between mt-6">
            <SummaryItem label="Белки" current={todayStats.protein} target={MOCK_USER.nutritionGoals.dailyProtein} colorText="text-red-600" />
            <SummaryItem label="Жиры" current={todayStats.fat} target={MOCK_USER.nutritionGoals.dailyFat} colorText="text-orange-500" />
            <SummaryItem label="Угли" current={todayStats.carbs} target={MOCK_USER.nutritionGoals.dailyCarbs} colorText="text-blue-500" />
            <SummaryItem label="Клетчатка" current={todayStats.fiber} target={MOCK_USER.nutritionGoals.dailyFiber} textColor={COLORS.primary} />
          </View>
          
          <View className="border-b border-gray-200 mt-6 mx-6" />

        {/* Список приемов пищи */}
        <View className="px-6 py-6">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-lg font-bold text-gray-900">Приемы пищи</Text>
            <TouchableOpacity 
              onPress={() => setMealModalOpen(true)}
          >
            <Text className="text-md" style={{ color: COLORS.primary }}>Добавить +</Text>
             </TouchableOpacity>
          </View>

          <View className="gap-2">
            {meals.map((meal) => (
              <MealItem key={meal.id} meal={meal} onDelete={handleDeleteMeal} />
              ))}

            {/* Кнопка добавления в конце списка */}
            <TouchableOpacity 
              onPress={() => setMealModalOpen(true)}
              className="flex-row items-center justify-center py-4 bg-white rounded-xl gap-2"
              style={{ borderWidth: 2, borderColor: '#D1D5DB', borderStyle: 'dashed' }}
            >
              <View className="w-8 h-8 bg-green-100 rounded-full items-center justify-center">
                <Plus size={20} color={COLORS.primary} />
              </View>
              <Text className="text-gray-600 font-medium">Добавить прием пищи</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Плавающая кнопка (FAB) для анкеты */}
      <TouchableOpacity 
        onPress={() => setSurveyModalOpen(true)}
        className="absolute bottom-1 right-3 w-12 h-12 rounded-full items-center justify-center shadow-lg z-50"
        style={{ backgroundColor: COLORS.primary }}
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

      {/* Модальные окна */}
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