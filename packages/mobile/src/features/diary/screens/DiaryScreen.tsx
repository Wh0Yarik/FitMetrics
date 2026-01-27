import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, Alert, BackHandler, StyleSheet, Modal, Pressable, Animated, useWindowDimensions, Image } from 'react-native';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useFocusEffect } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import type { Swipeable } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { AddMealModal, PortionCount } from '../components/AddMealModal';
import { DailySurveyModal } from '../components/DailySurveyModal';
import { MacroCard } from '../components/MacroCard';
import { MealItem } from '../components/MealItem';
import { diaryRepository, MealEntry } from '../repositories/DiaryRepository';
import { dailySurveyRepository, DailySurveyData } from '../repositories/DailySurveyRepository';
import { isSurveyComplete, useDiaryData } from '../model/useDiaryData';
import { useDiarySync } from '../model/useDiarySync';
import { useWeekCalendar } from '../../../shared/lib/calendar/useWeekCalendar';
import { colors, fonts, radii, shadows, spacing, useTabBarVisibility } from '../../../shared/ui';
import { api } from '../../../shared/api/client';
import { CalendarHeader, CalendarWeekDay } from '../../../shared/components/CalendarHeader';
import { formatDateKey, getDateObj, getWeekDates, getHeaderTitle, getRelativeLabel, shiftDate, WEEKDAY_LABELS } from '../../../shared/lib/date';
import { SharedBottomSheet } from '../../profile/components/SharedBottomSheet';
import proteinImage from '../../../../assets/portion_protein.png';
import fatImage from '../../../../assets/portion_fat.png';
import fiberImage from '../../../../assets/portion_fiber.png';
import carbsImage from '../../../../assets/portion_carbs.png';

// --- Конфигурация и константы ---

// --- Вспомогательные функции ---


// --- Подкомпоненты (UI элементы) ---

// --- Хуки (Логика) ---

// --- Основной компонент экрана ---

export default function DiaryScreen() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isCompact = width <= 360;
  // Инициализация текущей даты (сегодня)
  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date();
    return formatDateKey(now);
  });
  // Состояния модальных окон
  const [isMealModalOpen, setMealModalOpen] = useState(false);
  const [isSurveyModalOpen, setSurveyModalOpen] = useState(false);
  const [editingMeal, setEditingMeal] = useState<MealEntry | null>(null);
  const [showSwipeHint, setShowSwipeHint] = useState(false);
  const openSwipeRefs = useRef<Set<Swipeable>>(new Set());
  const [activeMacroSheet, setActiveMacroSheet] = useState<'protein' | 'fat' | 'fiber' | 'carbs' | null>(null);
  const [nutritionTargets, setNutritionTargets] = useState<{
    dailyProtein: number;
    dailyFat: number;
    dailyCarbs: number;
    dailyFiber: number;
  } | null>(null);
  const [nutritionGoalsHistory, setNutritionGoalsHistory] = useState<
    {
      dailyProtein: number;
      dailyFat: number;
      dailyCarbs: number;
      dailyFiber: number;
      startDate: string;
      endDate?: string | null;
    }[]
  >([]);
  const [hasTrainer, setHasTrainer] = useState(false);
  const { setHidden: setTabBarHidden } = useTabBarVisibility();
  const surveyPressAnim = useRef(new Animated.Value(1)).current;
  const addMealPressAnim = useRef(new Animated.Value(1)).current;

  // Подключение хуков логики
  const { meals, surveyStatus, dailySurvey, syncStatus, setSyncStatus, refreshData } = useDiaryData(currentDate);
  const { syncSurveyForDate } = useDiarySync({ currentDate, syncStatus, setSyncStatus, refreshData });
  const relativeLabel = useMemo(() => getRelativeLabel(currentDate), [currentDate]);
  const {
    visibleWeekDate,
    selectDate,
    weekSwipeAnim,
    weekPanResponder,
    weekWidth,
    setWeekWidth,
    isCalendarOpen,
    openCalendar,
    closeCalendar,
    calendarDays,
    monthLabel,
    handleMonthShift,
    calendarAnim,
    calendarPanResponder,
  } = useWeekCalendar({ currentDate, setCurrentDate });
  const resolveNutritionGoalForDate = useCallback(
    (dateStr: string) => {
      const targetDate = getDateObj(dateStr);
      targetDate.setHours(0, 0, 0, 0);
      if (nutritionGoalsHistory.length > 0) {
        const goal = nutritionGoalsHistory.find((item) => {
          const start = new Date(item.startDate);
          start.setHours(0, 0, 0, 0);
          const end = item.endDate ? new Date(item.endDate) : null;
          if (end) {
            end.setHours(0, 0, 0, 0);
          }
          return start.getTime() <= targetDate.getTime() && (!end || targetDate.getTime() < end.getTime());
        });
        if (goal) {
          return goal;
        }
      }
      return nutritionTargets;
    },
    [nutritionGoalsHistory, nutritionTargets]
  );

  const activeGoal = useMemo(
    () => resolveNutritionGoalForDate(currentDate),
    [currentDate, resolveNutritionGoalForDate]
  );

  const handleSurveyPressIn = useCallback(() => {
    Animated.spring(surveyPressAnim, {
      toValue: 0.98,
      speed: 14,
      bounciness: 4,
      useNativeDriver: true,
    }).start();
  }, [surveyPressAnim]);

  const handleSurveyPressOut = useCallback(() => {
    Animated.spring(surveyPressAnim, {
      toValue: 1,
      speed: 14,
      bounciness: 4,
      useNativeDriver: true,
    }).start();
  }, [surveyPressAnim]);

  const handleAddMealPressIn = useCallback(() => {
    Animated.spring(addMealPressAnim, {
      toValue: 0.98,
      speed: 16,
      bounciness: 4,
      useNativeDriver: true,
    }).start();
  }, [addMealPressAnim]);

  const handleAddMealPressOut = useCallback(() => {
    Animated.spring(addMealPressAnim, {
      toValue: 1,
      speed: 16,
      bounciness: 4,
      useNativeDriver: true,
    }).start();
  }, [addMealPressAnim]);


  const buildWeekDays = useCallback((baseDate: string) => {
    const today = new Date();
    const todayStr = formatDateKey(today);
    return getWeekDates(baseDate).map((day, index) => {
      const dateStr = formatDateKey(day);
      const goalForDay = resolveNutritionGoalForDate(dateStr);
      const totalTarget = goalForDay
        ? goalForDay.dailyProtein +
          goalForDay.dailyFat +
          goalForDay.dailyCarbs +
          goalForDay.dailyFiber
        : 0;
      const mealsForDay = diaryRepository.getMealsByDate(dateStr);
      const hasMeals = mealsForDay.length > 0;
      const totalCurrent = mealsForDay.reduce(
        (acc, meal) =>
          acc +
          meal.portions.protein +
          meal.portions.fat +
          meal.portions.carbs +
          meal.portions.fiber,
        0
      );
      const survey = dailySurveyRepository.getSurveyByDate(dateStr);
      const surveyStatus = survey ? (isSurveyComplete(survey) ? 'complete' : 'partial') : 'empty';
      const progress =
        totalTarget > 0 ? Math.max(0, totalCurrent / totalTarget) : 0;
      return {
        date: day,
        dateStr,
        label: WEEKDAY_LABELS[index],
        day: day.getDate(),
        hasMeals,
        hasSurvey: surveyStatus !== 'empty',
        surveyStatus,
        isSelected: dateStr === currentDate,
        isToday: dateStr === todayStr,
        progress,
      };
    });
  }, [currentDate, dailySurvey, meals, resolveNutritionGoalForDate]);

  const weekSets = useMemo(() => ([-1, 0, 1] as const).map((offset) =>
    buildWeekDays(shiftDate(visibleWeekDate, offset * 7))
  ), [buildWeekDays, visibleWeekDate]);
  const calendarWeekSets = useMemo<CalendarWeekDay[][]>(() => weekSets.map((week) => week.map((day) => ({
    dateStr: day.dateStr,
    label: day.label,
    day: day.day,
    isSelected: day.isSelected,
    isToday: day.isToday,
    progress: day.progress,
    showProgress: day.hasMeals || day.isSelected,
    markerState: day.hasSurvey ? (day.surveyStatus === 'partial' ? 'partial' : 'complete') : 'none',
  }))), [weekSets]);


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

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      const loadProfile = async () => {
        try {
          const response = await api.get('/users/me');
          if (!isActive) return;
          setNutritionTargets(response.data.nutritionGoals ?? null);
          setNutritionGoalsHistory(response.data.nutritionGoalsHistory ?? []);
          setHasTrainer(Boolean(response.data.trainer));
        } catch {
          if (!isActive) return;
          setNutritionTargets(null);
          setNutritionGoalsHistory([]);
          setHasTrainer(false);
        }
      };

      loadProfile();
      return () => {
        isActive = false;
      };
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

  const closeAllSwipeables = useCallback(() => {
    openSwipeRefs.current.forEach((ref) => {
      ref.close();
    });
    openSwipeRefs.current.clear();
  }, []);

  const handleSwipeableOpen = useCallback((ref: Swipeable | null) => {
    if (openSwipeRefs.current.size > 0) {
      closeAllSwipeables();
    }
    if (ref) {
      openSwipeRefs.current.add(ref);
    }
  }, [closeAllSwipeables]);

  const handleSwipeableClose = useCallback((ref: Swipeable | null) => {
    if (ref) {
      openSwipeRefs.current.delete(ref);
    }
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
    syncSurveyForDate(true);
  }, [refreshData, syncSurveyForDate]);

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

  const hasNutritionTargets =
    hasTrainer &&
    activeGoal != null &&
    [activeGoal.dailyProtein, activeGoal.dailyFat, activeGoal.dailyCarbs, activeGoal.dailyFiber].every(
      (value) => typeof value === 'number' && value > 0
    );

  useEffect(() => {
    setTabBarHidden(isMealModalOpen || isSurveyModalOpen || activeMacroSheet !== null);
  }, [isMealModalOpen, isSurveyModalOpen, activeMacroSheet, setTabBarHidden]);

  return (
    <GestureHandlerRootView style={styles.screen}>
      <View pointerEvents="none" style={styles.bgAccentPrimary} />
      <View pointerEvents="none" style={styles.bgAccentSecondary} />
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <StatusBar barStyle="dark-content" />
        <ScrollView 
          // Основной скроллируемый контент
          className="flex-1"
          contentContainerStyle={{
            paddingBottom: 96 + insets.bottom,
            paddingHorizontal: isCompact ? spacing.lg : spacing.xl,
          }}
          onTouchStart={closeAllSwipeables}
          onScrollBeginDrag={() => {
            closeAllSwipeables();
          }}
          scrollEventThrottle={16}
        >
          <CalendarHeader
            dateLabel={getHeaderTitle(currentDate)}
            relativeLabel={relativeLabel}
            syncStatus={syncStatus}
            weekSets={calendarWeekSets}
            onOpenCalendar={openCalendar}
            onSelectDay={selectDate}
            weekSwipeAnim={weekSwipeAnim}
            weekPanHandlers={weekPanResponder.panHandlers}
            weekWidth={weekWidth}
            onWeekLayout={setWeekWidth}
            useSafeArea={false}
          />
          {/* Сетка целей (План/Факт по нутриентам) */}

          <View style={styles.macroGrid}>
            <MacroCard
              label="Белки"
              current={todayStats.protein}
              target={activeGoal?.dailyProtein ?? 0}
              accent={colors.accentProtein}
              showTarget={hasNutritionTargets}
              onPress={() => setActiveMacroSheet('protein')}
            />
            <MacroCard
              label="Жиры"
              current={todayStats.fat}
              target={activeGoal?.dailyFat ?? 0}
              accent={colors.accentFat}
              showTarget={hasNutritionTargets}
              onPress={() => setActiveMacroSheet('fat')}
            />
            <MacroCard
              label="Углеводы"
              current={todayStats.carbs}
              target={activeGoal?.dailyCarbs ?? 0}
              accent={colors.accentCarbs}
              showTarget={hasNutritionTargets}
              onPress={() => setActiveMacroSheet('carbs')}
            />
            <MacroCard
              label="Клетчатка"
              current={todayStats.fiber}
              target={activeGoal?.dailyFiber ?? 0}
              accent={colors.accentFiber}
              showTarget={hasNutritionTargets}
              onPress={() => setActiveMacroSheet('fiber')}
            />
          </View>
          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              setSurveyModalOpen(true);
            }}
            onPressIn={handleSurveyPressIn}
            onPressOut={handleSurveyPressOut}
          >
            <Animated.View
              style={[
                styles.surveyStrip,
                isCompact && styles.surveyStripCompact,
                surveyStatus === 'complete' ? styles.surveyStripComplete : styles.surveyStripPending,
                { transform: [{ scale: surveyPressAnim }] },
              ]}
            >
              <View style={[styles.surveyStripRow, isCompact && styles.surveyStripRowCompact]}>
                <View style={[styles.surveyStripLeft, isCompact && styles.surveyStripLeftCompact]}>
                  <View
                    style={[
                      styles.surveyStatusDot,
                      isCompact && styles.surveyStatusDotCompact,
                      surveyStatus === 'complete'
                        ? styles.surveyStatusComplete
                        : surveyStatus === 'partial'
                          ? styles.surveyStatusPartial
                          : styles.surveyStatusEmpty,
                    ]}
                  />
                  <View>
                    <Text
                      style={[
                        styles.surveyStripCta,
                        isCompact && styles.surveyStripCtaCompact,
                        surveyStatus === 'complete' ? styles.surveyStripCtaComplete : styles.surveyStripCtaPending,
                      ]}
                      allowFontScaling={false}
                      numberOfLines={1}
                    >
                      {surveyStatus === 'complete' ? 'Анкета заполнена' : 'Заполни ежедневную анкету'}
                    </Text>
                  </View>
                </View>
                <View
                  style={[
                    styles.surveyAddButton,
                    styles.surveyAddButtonIconOnly,
                    isCompact && styles.surveyAddButtonCompact,
                  ]}
                >
                  <ChevronRight
                    size={18}
                    color={surveyStatus === 'complete' ? colors.accentFiber : '#9A5B00'}
                  />
                </View>
              </View>
            </Animated.View>
          </Pressable>

        {/* Список приемов пищи */}
        <View style={{  paddingVertical: spacing.lg }}>
          <View style={[styles.listHeader, isCompact && styles.listHeaderCompact]}>
            <View style={[styles.listTitleWrap, isCompact && styles.listTitleWrapCompact]}>
              <Text style={[styles.listTitle, isCompact && styles.listTitleCompact]} allowFontScaling={false}>
                Дневник питания
              </Text>
              {isCompact ? (
                <Pressable
                  onPress={() => {
                    Haptics.selectionAsync();
                    handleOpenAddMeal();
                  }}
                  onPressIn={handleAddMealPressIn}
                  onPressOut={handleAddMealPressOut}
                  android_ripple={{ color: 'transparent' }}
                >
                  <Animated.View style={[styles.listAddCircle, { transform: [{ scale: addMealPressAnim }] }]}>
                    <Plus size={16} color={colors.primary} />
                  </Animated.View>
                </Pressable>
              ) : null}
              
            </View>
            {!isCompact ? (
              <Pressable
                onPress={() => {
                  Haptics.selectionAsync();
                  handleOpenAddMeal();
                }}
                onPressIn={handleAddMealPressIn}
                onPressOut={handleAddMealPressOut}
                android_ripple={{ color: 'transparent' }}
              >
                <Animated.View style={[styles.primaryButton, { transform: [{ scale: addMealPressAnim }] }]}>
                  <Plus size={16} color={colors.surface} />
                  <Text style={styles.primaryButtonText} allowFontScaling={false}>
                    Добавить
                  </Text>
                </Animated.View>
              </Pressable>
            ) : null}
          </View>

          <View style={styles.mealsList}>
            {meals.map((meal, index) => (
              <MealItem
                key={meal.id}
                meal={meal}
                onDelete={handleDeleteMeal}
                onEdit={handleEditMeal}
                showSwipeHint={showSwipeHint && index === 0}
                onFirstSwipe={handleFirstSwipe}
                onSwipeableOpen={handleSwipeableOpen}
                onSwipeableClose={handleSwipeableClose}
              />
            ))}

            {meals.length === 0 ? (
              <Pressable
                onPress={() => {
                  Haptics.selectionAsync();
                  handleOpenAddMeal();
                }}
                onPressIn={handleAddMealPressIn}
                onPressOut={handleAddMealPressOut}
              >
                <Animated.View style={[styles.addCard, { transform: [{ scale: addMealPressAnim }] }]}>
                  <View style={styles.addIcon}>
                    <Plus size={24} color={colors.primary} />
                  </View>
                  <Text style={[styles.addText, isCompact && styles.addTextCompact]} allowFontScaling={false}>
                    Добавь свой первый прием пищи
                  </Text>
                </Animated.View>
              </Pressable>
            ) : null}
          </View>
        </View>
        </ScrollView>

        <Modal
          visible={isCalendarOpen}
          transparent
          animationType="fade"
          onRequestClose={closeCalendar}
        >
          <Pressable style={styles.calendarBackdrop} onPress={closeCalendar}>
            <Pressable
              style={styles.calendarCard}
              onPress={() => {}}
            >
              <View style={styles.calendarHeader}>
                <TouchableOpacity onPress={() => handleMonthShift(-1)} style={styles.calendarNavButton}>
                  <ChevronLeft size={16} color="#6B7280" />
                </TouchableOpacity>
                <Text style={styles.calendarTitle}>{monthLabel}</Text>
                <TouchableOpacity onPress={() => handleMonthShift(1)} style={styles.calendarNavButton}>
                  <ChevronLeft size={16} color="#6B7280" style={styles.calendarNavNextIcon} />
                </TouchableOpacity>
              </View>
              <View style={styles.calendarWeekRow}>
                {WEEKDAY_LABELS.map((label) => (
                  <Text key={label} style={styles.calendarWeekLabel}>{label}</Text>
                ))}
              </View>
              <Animated.View
                style={[
                  styles.calendarGrid,
                  { transform: [{ translateX: calendarAnim }] },
                ]}
                {...calendarPanResponder.panHandlers}
              >
                {calendarDays.map((day, index) => {
                  if (!day) {
                    return <View key={`empty-${index}`} style={styles.calendarCellEmpty} />;
                  }
                  const dateStr = formatDateKey(day);
                  const isSelected = dateStr === currentDate;
                  const isToday = dateStr === formatDateKey(new Date());
                  const hasMeals = diaryRepository.getMealsByDate(dateStr).length > 0;
                  const survey = dailySurveyRepository.getSurveyByDate(dateStr);
                  const surveyStatus = survey ? (isSurveyComplete(survey) ? 'complete' : 'partial') : 'empty';
                  const hasSurvey = surveyStatus !== 'empty';
                  return (
                    <TouchableOpacity
                      key={dateStr}
                      onPress={() => {
                        selectDate(dateStr);
                        closeCalendar();
                      }}
                      style={styles.calendarCell}
                    >
                      <View
                        style={[
                          styles.calendarCellInner,
                          hasMeals && styles.calendarCellHasMeals,
                          isSelected && styles.calendarCellSelected,
                          isToday && !isSelected && styles.calendarCellToday,
                        ]}
                      >
                        {hasSurvey && (
                          <View
                            style={[
                              styles.calendarDot,
                              surveyStatus === 'partial' && styles.calendarDotPartial,
                              isSelected && surveyStatus === 'complete' && styles.calendarDotSelected,
                              isSelected && surveyStatus === 'partial' && styles.calendarDotPartialSelected,
                            ]}
                          />
                        )}
                        <Text style={[styles.calendarCellText, isSelected && styles.calendarCellTextSelected]}>
                          {day.getDate()}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </Animated.View>
            </Pressable>
          </Pressable>
        </Modal>

        <SharedBottomSheet
          visible={activeMacroSheet === 'protein'}
          onClose={() => setActiveMacroSheet(null)}
          enableSwipeToDismiss
          headerSwipeHeight={56}
        >
          <View style={styles.macroSheetContent}>
            <View style={styles.macroSheetImageWrap}>
              <Image source={proteinImage} style={styles.macroSheetImage} />
            </View>
            <Text style={styles.macroSheetTitle}>Белки</Text>
            <Text style={styles.macroSheetText}>
              Белки удобнее всего считать по размеру ладони.
            </Text>
            <Text style={styles.macroSheetText}>
              1 порция белка ≈ кусок размером с ладонь (без пальцев).
            </Text>
            <Text style={styles.macroSheetSubtitle}>Примеры продуктов:</Text>
            {[
              'Курица, индейка',
              'Рыба, морепродукты',
              'Яйца',
              'Творог, греческий йогурт',
              'Тофу, чечевица, нут',
            ].map((item) => (
              <Text key={item} style={styles.macroSheetListItem}>
                • {item}
              </Text>
            ))}
          </View>
        </SharedBottomSheet>

        <SharedBottomSheet
          visible={activeMacroSheet === 'fat'}
          onClose={() => setActiveMacroSheet(null)}
          enableSwipeToDismiss
          headerSwipeHeight={56}
        >
          <View style={styles.macroSheetContent}>
            <View style={styles.macroSheetImageWrap}>
              <Image source={fatImage} style={styles.macroSheetImage} />
            </View>
            <Text style={styles.macroSheetTitle}>Жиры</Text>
            <Text style={styles.macroSheetText}>
              Жиры считаются очень маленькими порциями.
            </Text>
            <Text style={styles.macroSheetText}>
              1 порция жиров ≈ размер большого пальца.
            </Text>
            <Text style={styles.macroSheetSubtitle}>Примеры продуктов:</Text>
            {[
              'Оливковое, растительное масло',
              'Орехи, семечки',
              'Авокадо',
              'Жирная рыба',
              'Сыр',
              'Масло при готовке тоже считается 😉',
            ].map((item) => (
              <Text key={item} style={styles.macroSheetListItem}>
                • {item}
              </Text>
            ))}
          </View>
        </SharedBottomSheet>

        <SharedBottomSheet
          visible={activeMacroSheet === 'fiber'}
          onClose={() => setActiveMacroSheet(null)}
          enableSwipeToDismiss
          headerSwipeHeight={56}
        >
          <View style={styles.macroSheetContent}>
            <View style={styles.macroSheetImageWrap}>
              <Image source={fiberImage} style={styles.macroSheetImage} />
            </View>
            <Text style={styles.macroSheetTitle}>Клетчатка</Text>
            <Text style={styles.macroSheetText}>
              Клетчатку проще считать по объёму овощей и фруктов.
            </Text>
            <Text style={styles.macroSheetText}>
              1 порция клетчатки ≈ 1 кулак.
            </Text>
            <Text style={styles.macroSheetSubtitle}>Примеры продуктов:</Text>
            {[
              'Овощи и зелень',
              'Бобовые',
              'Ягоды',
              'Фрукты с кожурой',
              'Цельнозерновые продукты',
              'Чем больше цветов на тарелке — тем лучше 👌',
            ].map((item) => (
              <Text key={item} style={styles.macroSheetListItem}>
                • {item}
              </Text>
            ))}
          </View>
        </SharedBottomSheet>

        <SharedBottomSheet
          visible={activeMacroSheet === 'carbs'}
          onClose={() => setActiveMacroSheet(null)}
          enableSwipeToDismiss
          headerSwipeHeight={56}
        >
          <View style={styles.macroSheetContent}>
            <View style={styles.macroSheetImageWrap}>
              <Image source={carbsImage} style={styles.macroSheetImage} />
            </View>
            <Text style={styles.macroSheetTitle}>Углеводы</Text>
            <Text style={styles.macroSheetText}>
              Углеводы удобно считать горстью.
            </Text>
            <Text style={styles.macroSheetText}>
              1 порция углеводов ≈ 1 горсть.
            </Text>
            <Text style={styles.macroSheetSubtitle}>Примеры продуктов:</Text>
            {[
              'Крупы (рис, гречка, овсянка)',
              'Паста',
              'Хлеб',
              'Фрукты',
              'Картофель',
            ].map((item) => (
              <Text key={item} style={styles.macroSheetListItem}>
                • {item}
              </Text>
            ))}
          </View>
        </SharedBottomSheet>

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
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safe: {
    flex: 1,
  },
  bgAccentPrimary: {
    position: 'absolute',
    top: -120,
    right: -80,
    width: 220,
    height: 220,
    borderRadius: 999,
    backgroundColor: `${colors.accentFiber}26`,
    opacity: 0.7,
  },
  bgAccentSecondary: {
    position: 'absolute',
    top: 140,
    left: -110,
    width: 240,
    height: 240,
    borderRadius: 999,
    backgroundColor: `${colors.accentCarbs}22`,
    opacity: 0.5,
  },
  sectionHeader: {
    marginTop: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: fonts.semibold,
    color: colors.textPrimary,
  },
  macroGrid: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  sectionDivider: {
    marginTop: spacing.lg,
    height: 1,
    backgroundColor: colors.divider,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  listHeaderCompact: {
    alignItems: 'stretch',
  },
  listTitleWrap: {
  },
  listTitleWrapCompact: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  listTitle: {
    fontSize: 18,
    fontFamily: fonts.semibold,
    color: colors.textPrimary,
  },
  listTitleCompact: {
    fontSize: 16,
  },
  listCountChip: {
    alignSelf: 'flex-start',
    backgroundColor: colors.divider,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.pill,
    marginTop: spacing.xs,
  },
  listCountChipCompact: {
    alignSelf: 'flex-start',
  },
  listCountText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontFamily: fonts.medium,
  },
  listCountTextCompact: {
    fontSize: 10,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...shadows.button,
  },
  primaryButtonText: {
    color: colors.surface,
    fontSize: 12,
    fontFamily: fonts.semibold,
    marginLeft: spacing.xs,
  },
  listAddCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${colors.primary}14`,
    borderWidth: 1,
    borderColor: `${colors.primary}33`,
  },
  calendarBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  calendarCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: spacing.md,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  calendarTitle: {
    fontSize: 16,
    fontFamily: fonts.semibold,
    color: colors.textPrimary,
  },
  calendarNavButton: {
    padding: spacing.xs,
    borderRadius: radii.pill,
    backgroundColor: colors.inputBg,
  },
  calendarNavNextIcon: {
    transform: [{ rotate: '180deg' }],
  },
  calendarWeekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  calendarWeekLabel: {
    width: '14.285%',
    textAlign: 'center',
    fontSize: 11,
    fontFamily: fonts.medium,
    color: colors.textTertiary,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarCell: {
    width: '14.285%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  calendarCellInner: {
    width: 34,
    height: 34,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  calendarCellEmpty: {
    width: '14.285%',
    paddingVertical: 6,
  },
  calendarCellHasMeals: {
    borderWidth: 1,
    borderColor: colors.primary,
  },
  calendarCellToday: {
    borderWidth: 1,
    borderColor: `${colors.accentFiber}55`,
    backgroundColor: `${colors.accentFiber}22`,
  },
  calendarCellSelected: {
    backgroundColor: colors.primary,
  },
  calendarCellText: {
    fontSize: 14,
    color: colors.textPrimary,
    fontFamily: fonts.medium,
  },
  calendarCellTextSelected: {
    color: colors.surface,
  },
  calendarDot: {
    position: 'absolute',
    top: 2,
    width: 4,
    height: 4,
    borderRadius: 999,
    backgroundColor: colors.accentFiber,
  },
  calendarDotPartial: {
    backgroundColor: colors.accentFat,
  },
  calendarDotSelected: {
    backgroundColor: colors.surface,
  },
  calendarDotPartialSelected: {
    backgroundColor: `${colors.accentFat}88`,
  },
  mealsList: {
    gap: spacing.sm,
  },
  addCard: {
    marginTop: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    borderRadius: radii.card,
    borderWidth: 2,
    borderColor: `${colors.primary}22`,
    borderStyle: 'dashed',
    backgroundColor: `${colors.primary}06`,
  },
  addIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: `${colors.primary}33`,
    backgroundColor: `${colors.primary}14`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  addText: {
    color: colors.textPrimary,
    fontSize: 15,
    fontFamily: fonts.semibold,
  },
  addTextCompact: {
    fontSize: 13,
  },
  surveyStrip: {
    marginTop: 0,
    marginHorizontal: 0,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: `${colors.surface}14`,
    borderRadius: radii.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.06)',
    flexDirection: 'column',
    alignItems: 'stretch',
    justifyContent: 'center',
  },
  surveyStripCompact: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  surveyStripComplete: {
    backgroundColor: `${colors.accentFiber}12`,
    borderColor: `${colors.accentFiber}50`,
  },
  surveyStripPending: {
    backgroundColor: `${colors.accentFat}12`,
    borderColor: `${colors.accentFat}50`,
  },
  surveyStripRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  surveyStripRowCompact: {
    alignItems: 'center',
  },
  surveyStripLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  surveyStripLeftCompact: {
    flexShrink: 1,
  },
  surveyStatusDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    marginRight: spacing.sm,
  },
  surveyStatusDotCompact: {
    width: 8,
    height: 8,
    marginRight: spacing.xs,
  },
  surveyStatusComplete: {
    backgroundColor: colors.accentFiber,
  },
  surveyStatusPartial: {
    backgroundColor: colors.accentFat,
  },
  surveyStatusEmpty: {
    backgroundColor: colors.accentFat,
  },
  surveyStripCta: {
    fontSize: 12,
    fontFamily: fonts.bold,
    letterSpacing: 0,
  },
  surveyStripCtaCompact: {
    fontSize: 11,
    letterSpacing: 0,
    marginTop: 0,
    lineHeight: 16,
  },
  surveyStripCtaComplete: {
    color: colors.accentFiber,
  },
  surveyStripCtaPending: {
    color: '#9A5B00',
  },
  surveyAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radii.pill,
    backgroundColor: '#ffffff66',
  },
  surveyAddButtonCompact: {
    width: 34,
    height: 34,
    paddingHorizontal: 0,
    paddingVertical: 0,
    justifyContent: 'center',
  },
  surveyAddButtonIconOnly: {
    width: 38,
    height: 38,
    paddingHorizontal: 0,
    paddingVertical: 0,
    justifyContent: 'center',
  },
  surveyAddButtonCheck: {
    width: 38,
    height: 38,
    paddingHorizontal: 0,
    paddingVertical: 0,
    justifyContent: 'center',
  },
  macroSheetContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  macroSheetImageWrap: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  macroSheetImage: {
    width: 160,
    height: 160,
    resizeMode: 'contain',
  },
  macroSheetTitle: {
    fontSize: 20,
    fontFamily: fonts.semibold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  macroSheetText: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  macroSheetSubtitle: {
    fontSize: 14,
    fontFamily: fonts.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  macroSheetListItem: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
});
