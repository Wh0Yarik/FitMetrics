import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, Image, Alert, BackHandler, StyleSheet } from 'react-native';
import { Plus, Pencil, Trash2, Cloud, CloudOff, RefreshCw, ClipboardList, ChevronLeft } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, Stack } from 'expo-router';
import { Calendar, LocaleConfig, DateData } from 'react-native-calendars';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring, runOnJS } from 'react-native-reanimated';
import { GestureDetector, Gesture, GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

const getSyncLabel = (status: 'synced' | 'syncing' | 'offline') => {
  if (status === 'syncing') return 'Синхронизация';
  if (status === 'offline') return 'Офлайн';
  return 'Синхронизировано';
};

// Чип порций для карточки приема пищи
const MealPortionChip = React.memo(({ label, value, color }: { label: string, value: number, color: string }) => (
  <View style={[styles.mealChip, { backgroundColor: `${color}1A`, borderColor: `${color}33` }]}>
    <View style={[styles.mealChipDot, { backgroundColor: color }]} />
    <Text style={styles.mealChipText}>{label} {value > 0 ? value : '–'}</Text>
  </View>
));

// Карточка нутриента (План/Факт + прогресс)
const MacroCard = React.memo(({ label, current, target, accent }: { label: string, current: number, target: number, accent: string }) => {
  const progress = target > 0 ? Math.min(1, current / target) : 0;
  return (
    <View style={[styles.macroCard, { borderColor: `${accent}33` }]}>
      <View style={styles.macroTopRow}>
        <Text style={[styles.macroValue, { color: accent }]}>{current}</Text>
        <Text style={styles.macroTarget}>/ {target}</Text>
      </View>
      <Text style={styles.macroLabel}>{label}</Text>
      <View style={styles.macroBar}>
        <View style={[styles.macroBarFill, { backgroundColor: accent, width: `${progress * 100}%` }]} />
      </View>
    </View>
  );
});

// Карточка приема пищи в списке
const MealItem = React.memo(({
  meal,
  onDelete,
  onEdit,
  showSwipeHint,
  onFirstSwipe,
}: {
  meal: MealEntry;
  onDelete: (id: string) => void;
  onEdit: (meal: MealEntry) => void;
  showSwipeHint: boolean;
  onFirstSwipe: () => void;
}) => {
  const swipeRef = useRef<Swipeable>(null);

  const handleEdit = () => {
    swipeRef.current?.close();
    onEdit(meal);
  };

  const handleDelete = () => {
    swipeRef.current?.close();
    onDelete(meal.id);
  };

  return (
    <Swipeable
      ref={swipeRef}
      overshootRight={false}
      rightThreshold={60}
      dragOffsetFromRightEdge={20}
      onSwipeableOpen={onFirstSwipe}
      renderRightActions={() => (
        <View style={styles.swipeActions}>
          <TouchableOpacity onPress={handleEdit} style={[styles.swipeButton, styles.swipeEdit]}>
            <Pencil size={16} color="#111827" />
            <Text style={styles.swipeText}>Редактировать</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} style={[styles.swipeButton, styles.swipeDelete]}>
            <Trash2 size={16} color="#EF4444" />
            <Text style={[styles.swipeText, styles.swipeDeleteText]}>Удалить</Text>
          </TouchableOpacity>
        </View>
      )}
    >
      <View style={styles.mealCard}>
        <View style={styles.mealHeader}>
          <View style={styles.mealTimePill}>
            <Text style={styles.mealTimeText}>
              {new Date(meal.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
          <Text style={styles.mealName} numberOfLines={1} ellipsizeMode="tail">
            {meal.name}
          </Text>
        </View>

        <View style={styles.mealChipsRow}>
          <MealPortionChip label="Б" value={meal.portions.protein} color="#EF4444" />
          <MealPortionChip label="Ж" value={meal.portions.fat} color="#F59E0B" />
          <MealPortionChip label="У" value={meal.portions.carbs} color="#3B82F6" />
          <MealPortionChip label="К" value={meal.portions.fiber} color={COLORS.primary} />
        </View>

        {showSwipeHint && (
          <View style={styles.swipeHint}>
            <Text style={styles.swipeHintText}>Свайпните</Text>
            <View style={styles.swipeHintChevrons}>
              <ChevronLeft size={14} color="#9CA3AF" />
              <ChevronLeft size={14} color="#9CA3AF" style={styles.swipeHintChevron} />
            </View>
          </View>
        )}
      </View>
    </Swipeable>
  );
});

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
  const [editingMeal, setEditingMeal] = useState<MealEntry | null>(null);
  const [showSwipeHint, setShowSwipeHint] = useState(false);

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

  useEffect(() => {
    const loadSwipeHintState = async () => {
      try {
        const seen = await AsyncStorage.getItem('diarySwipeHintSeen');
        setShowSwipeHint(seen !== '1');
      } catch {
        setShowSwipeHint(true);
      }
    };
    loadSwipeHintState();
  }, []);

  const handleFirstSwipe = useCallback(() => {
    if (!showSwipeHint) return;
    setShowSwipeHint(false);
    AsyncStorage.setItem('diarySwipeHintSeen', '1').catch(() => {});
  }, [showSwipeHint]);

  // Сохранение приема пищи
  const handleSaveMeal = useCallback((name: string, portions: PortionCount) => {
    if (editingMeal) {
      diaryRepository.updateMeal(editingMeal.id, name, portions);
    } else {
      diaryRepository.addMeal(currentDate, name, portions);
    }
    refreshData();
    setEditingMeal(null);
  }, [currentDate, editingMeal, refreshData]);

  const handleOpenAddMeal = useCallback(() => {
    setEditingMeal(null);
    setMealModalOpen(true);
  }, []);

  const handleCloseMealModal = useCallback(() => {
    setMealModalOpen(false);
    setEditingMeal(null);
  }, []);

  const handleEditMeal = useCallback((meal: MealEntry) => {
    setEditingMeal(meal);
    setMealModalOpen(true);
  }, []);

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
    <GestureHandlerRootView style={styles.screen}>
      <View pointerEvents="none" style={styles.bgAccentPrimary} />
      <View pointerEvents="none" style={styles.bgAccentSecondary} />
      <Stack.Screen
        options={{ headerShown: false }}
      />
            {/* Хедер и Календарь в SafeAreaView */}
            <SafeAreaView edges={['top']} style={styles.headerArea}>
              <GestureDetector gesture={calendar.panGesture}>
              <View className="px-6 pb-3 pt-2">
                <View style={styles.headerCard}>
                  <View className="flex-row justify-between items-center">
                    {/* Заголовок даты и переключатель календаря */}
                    <View>
                      <Text style={styles.headerKicker}>Дневник питания</Text>
                      <TouchableOpacity onPress={calendar.toggleCalendar} className="flex-row items-center gap-2">
                        <View style={[styles.datePill, { backgroundColor: COLORS.primary }]}>
                          <Text style={styles.dateText}>{getHeaderTitle(currentDate)}</Text>
                        </View>
                        <View style={styles.syncPill}>
                          <SyncIndicator status={syncStatus} />
                          <Text style={styles.syncText}>{getSyncLabel(syncStatus)}</Text>
                        </View>
                      </TouchableOpacity>
                    </View>
                    {/* Аватар пользователя */}
                    <View style={styles.avatar}>
                      {MOCK_USER.avatarUrl ? (
                        <Image source={{ uri: MOCK_USER.avatarUrl }} style={styles.avatarImage} />
                      ) : (
                        <Text style={styles.avatarLetter}>{MOCK_USER.name.charAt(0)}</Text>
                      )}
                    </View>
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
                            backgroundColor: 'rgba(220, 252, 231, 1)',
                            color:'#ffffff',
                            borderRadius: 100,
                          },
                          todayText: {
                            color: COLORS.primary,
                            fontWeight: '800',
                          },
                        },
                      }}
                    />
                  </Animated.View>
                </Animated.View>
                <View style={styles.dragHandleWrap}>
                  <View style={styles.dragHandle} />
                </View>
              </View>
               
              </GestureDetector>
            </SafeAreaView>
      <StatusBar barStyle="dark-content" />
      
      <ScrollView 
        // Основной скроллируемый контент
        className="flex-1"
        contentContainerStyle={{ paddingBottom:0 }}
        scrollEventThrottle={16}
      >
          {/* Сетка целей (План/Факт по нутриентам) */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Баланс дня</Text>
            <View style={styles.sectionChip}>
              <Text style={styles.sectionChipText}>План / Факт</Text>
            </View>
          </View>
          <View style={styles.macroGrid}>
            <MacroCard label="Белки" current={todayStats.protein} target={MOCK_USER.nutritionGoals.dailyProtein} accent="#EF4444" />
            <MacroCard label="Жиры" current={todayStats.fat} target={MOCK_USER.nutritionGoals.dailyFat} accent="#F59E0B" />
            <MacroCard label="Углеводы" current={todayStats.carbs} target={MOCK_USER.nutritionGoals.dailyCarbs} accent="#3B82F6" />
            <MacroCard label="Клетчатка" current={todayStats.fiber} target={MOCK_USER.nutritionGoals.dailyFiber} accent="#50ca64ff" />
          </View>
          <TouchableOpacity onPress={() => setSurveyModalOpen(true)} style={styles.surveyStrip}>
            <View style={styles.surveyStripLeft}>
              <View
                style={[
                  styles.surveyStatusDot,
                  surveyStatus === 'complete'
                    ? styles.surveyStatusComplete
                    : surveyStatus === 'partial'
                      ? styles.surveyStatusPartial
                      : styles.surveyStatusEmpty,
                ]}
              />
              <Text style={styles.surveyStripTitle}>Ежедневная анкета</Text>
            </View>
            <Text style={styles.surveyStripCta}>
              {surveyStatus === 'complete' ? 'Заполнено' : 'Заполнить'}
            </Text>
          </TouchableOpacity>
          <View style={styles.sectionDivider} />

        {/* Список приемов пищи */}
        <View className="px-6 py-6">
          <View style={styles.listHeader}>
            <View style={styles.listTitleWrap}>
              <Text style={styles.listTitle}>Дневник питания</Text>
              <View style={styles.listCountChip}>
                <Text style={styles.listCountText}>{meals.length} приемов</Text>
              </View>
            </View>
            <TouchableOpacity onPress={handleOpenAddMeal} style={styles.primaryButton}>
              <Plus size={16} color="white" />
              <Text style={styles.primaryButtonText}>Добавить</Text>
            </TouchableOpacity>
          </View>

          <View className="gap-2">
            {meals.map((meal, index) => (
              <MealItem
                key={meal.id}
                meal={meal}
                onDelete={handleDeleteMeal}
                onEdit={handleEditMeal}
                showSwipeHint={showSwipeHint && index === 0}
                onFirstSwipe={handleFirstSwipe}
              />
              ))}

            {/* Кнопка добавления в конце списка */}
            <TouchableOpacity 
              onPress={handleOpenAddMeal}
              style={styles.addCard}
            >
              <View style={styles.addIcon}>
                <Plus size={20} color={COLORS.primary} />
              </View>
              <Text style={styles.addText}>Добавить прием пищи</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Модальные окна */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 50 }} pointerEvents="box-none">
        <AddMealModal
          visible={isMealModalOpen}
          onClose={handleCloseMealModal}
          onSave={handleSaveMeal}
          nextMealNumber={meals.length + 1}
          mode={editingMeal ? 'edit' : 'create'}
          initialName={editingMeal?.name}
          initialPortions={editingMeal?.portions}
        />

        <DailySurveyModal
          visible={isSurveyModalOpen}
          onClose={() => setSurveyModalOpen(false)}
          onSave={handleSaveSurvey}
          date={currentDate}
          initialData={dailySurvey}
        />
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F7FAF8',
  },
  bgAccentPrimary: {
    position: 'absolute',
    top: -120,
    right: -80,
    width: 220,
    height: 220,
    borderRadius: 999,
    backgroundColor: '#DCFCE7',
    opacity: 0.7,
  },
  bgAccentSecondary: {
    position: 'absolute',
    top: 140,
    left: -110,
    width: 240,
    height: 240,
    borderRadius: 999,
    backgroundColor: '#E0F2FE',
    opacity: 0.5,
  },
  headerArea: {
    backgroundColor: 'transparent',
    zIndex: 10,
  },
  headerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
  },
  headerKicker: {
    color: '#6B7280',
    fontSize: 12,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  datePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  dateText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  syncPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#F3F4F6',
  },
  syncText: {
    color: '#6B7280',
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 6,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ECFDF3',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D1FAE5',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarLetter: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
  },
  headerMetaRow: {
    marginTop: 12,
    flexDirection: 'row',
  },
  metaChip: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 8,
  },
  metaLabel: {
    fontSize: 11,
    color: '#6B7280',
  },
  metaValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
    marginTop: 2,
  },
  dragHandleWrap: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  dragHandle: {
    width: 44,
    height: 4,
    borderRadius: 999,
    backgroundColor: '#E5E7EB',
  },
  sectionHeader: {
    paddingHorizontal: 24,
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  sectionChip: {
    backgroundColor: '#ECFDF3',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  sectionChipText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  macroGrid: {
    paddingHorizontal: 24,
    marginTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  macroCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    shadowColor: '#111827',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    marginBottom: 12,
  },
  macroTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  macroValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  macroTarget: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 6,
  },
  macroLabel: {
    marginTop: 4,
    fontSize: 11,
    color: '#6B7280',
  },
  macroBar: {
    marginTop: 10,
    height: 6,
    borderRadius: 999,
    backgroundColor: '#F3F4F6',
    overflow: 'hidden',
  },
  macroBarFill: {
    height: '100%',
    borderRadius: 999,
  },
  sectionDivider: {
    marginTop: 20,
    marginHorizontal: 24,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  listTitleWrap: {
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  listCountChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    marginTop: 6,
  },
  listCountText: {
    color: '#6B7280',
    fontSize: 11,
    fontWeight: '600',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 8,
  },
  mealCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    marginBottom: 12,
  },
  mealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  mealTimePill: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    marginRight: 10,
  },
  mealTimeText: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '600',
  },
  mealName: {
    flex: 1,
    color: '#111827',
    fontSize: 16,
    fontWeight: '700',
  },
  mealChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  mealChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8,
  },
  mealChipDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
    marginRight: 6,
  },
  mealChipText: {
    color: '#374151',
    fontSize: 12,
    fontWeight: '600',
  },
  swipeHint: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
  },
  swipeHintText: {
    marginRight: 2,
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  swipeHintChevrons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  swipeHintChevron: {
    marginLeft: -6,
  },
  swipeActions: {
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
    paddingRight: 8,
  },
  swipeButton: {
    width: 110,
    height: '100%',
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  swipeEdit: {
    backgroundColor: '#E5E7EB',
  },
  swipeDelete: {
    backgroundColor: '#FEF2F2',
  },
  swipeText: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: '600',
    color: '#111827',
  },
  swipeDeleteText: {
    color: '#EF4444',
  },
  addCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    backgroundColor: '#ECFDF3',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#D1FAE5',
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
  },
  addIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  addText: {
    color: '#065F46',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  fab: {
  },
  surveyStrip: {
    marginTop: 16,
    marginHorizontal: 24,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: '#ECFDF3',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D1FAE5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 6 },
  },
  surveyStripLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  surveyStatusDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    marginRight: 10,
  },
  surveyStatusComplete: {
    backgroundColor: '#86EFAC',
  },
  surveyStatusPartial: {
    backgroundColor: '#FB923C',
  },
  surveyStatusEmpty: {
    backgroundColor: '#F87171',
  },
  surveyStripTitle: {
    color: '#111827',
    fontSize: 13,
    fontWeight: '700',
  },
  surveyStripCta: {
    color: '#065F46',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
});
