import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, Alert, BackHandler, StyleSheet, Modal, Pressable, Animated } from 'react-native';
import { Plus, ChevronLeft } from 'lucide-react-native';
import { useFocusEffect, Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import type { Swipeable } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { AddMealModal, PortionCount } from '../components/AddMealModal';
import { DailySurveyModal } from '../components/DailySurveyModal';
import { MacroCard } from '../components/MacroCard';
import { MealItem } from '../components/MealItem';
import { diaryRepository, MealEntry } from '../repositories/DiaryRepository';
import { dailySurveyRepository, DailySurveyData } from '../repositories/DailySurveyRepository';
import { isSurveyComplete, useDiaryData } from '../model/useDiaryData';
import { useDiarySync } from '../model/useDiarySync';
import { useWeekCalendar } from '../../../shared/lib/calendar/useWeekCalendar';
import { COLORS } from '../../../constants/Colors';
import { api } from '../../../shared/api/client';
import { CalendarHeader, CalendarWeekDay } from '../../../shared/components/CalendarHeader';
import { formatDateKey, getDateObj, getWeekDates, getHeaderTitle, getRelativeLabel, WEEKDAY_LABELS } from '../../../shared/lib/date';

// --- Конфигурация и константы ---

// --- Вспомогательные функции ---


// --- Подкомпоненты (UI элементы) ---

// --- Хуки (Логика) ---

// --- Основной компонент экрана ---

export default function DiaryScreen() {
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

  // Подключение хуков логики
  const { meals, surveyStatus, dailySurvey, syncStatus, setSyncStatus, refreshData } = useDiaryData(currentDate);
  const { syncSurveyForDate } = useDiarySync({ currentDate, syncStatus, setSyncStatus, refreshData });
  const relativeLabel = useMemo(() => getRelativeLabel(currentDate), [currentDate]);
  const {
    visibleWeekDate,
    selectDate,
    weekSwipeAnim,
    weekPanResponder,
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

  const weekDays = useMemo(() => buildWeekDays(visibleWeekDate), [buildWeekDays, visibleWeekDate]);
  const calendarWeekDays = useMemo<CalendarWeekDay[]>(() => weekDays.map((day) => ({
    dateStr: day.dateStr,
    label: day.label,
    day: day.day,
    isSelected: day.isSelected,
    isToday: day.isToday,
    progress: day.progress,
    showProgress: day.hasMeals || day.isSelected,
    markerState: day.hasSurvey ? (day.surveyStatus === 'partial' ? 'partial' : 'complete') : 'none',
  })), [weekDays]);


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

  const renderHeader = useCallback(() => (
    <CalendarHeader
      dateLabel={getHeaderTitle(currentDate)}
      relativeLabel={relativeLabel}
      syncStatus={syncStatus}
      weekDays={calendarWeekDays}
      onOpenCalendar={openCalendar}
      onSelectDay={selectDate}
      weekSwipeAnim={weekSwipeAnim}
      weekPanHandlers={weekPanResponder.panHandlers}
    />
  ), [
    currentDate,
    relativeLabel,
    syncStatus,
    calendarWeekDays,
    openCalendar,
    selectDate,
    weekPanResponder,
    weekSwipeAnim,
  ]);

  return (
    <GestureHandlerRootView style={styles.screen}>
      <View pointerEvents="none" style={styles.bgAccentPrimary} />
      <View pointerEvents="none" style={styles.bgAccentSecondary} />
      <Stack.Screen
        options={{
          headerShown: true,
          header: renderHeader,
          headerShadowVisible: false,
        }}
      />
      <StatusBar barStyle="dark-content" />
      
      <ScrollView 
        // Основной скроллируемый контент
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 80 }}
        onTouchStart={closeAllSwipeables}
        onScrollBeginDrag={() => {
          closeAllSwipeables();
        }}
        scrollEventThrottle={16}
      >
          {/* Сетка целей (План/Факт по нутриентам) */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Баланс дня</Text>
          </View>
          <View style={styles.macroGrid}>
            <MacroCard
              label="Белки"
              current={todayStats.protein}
              target={activeGoal?.dailyProtein ?? 0}
              accent="#06B6D4"
              showTarget={hasNutritionTargets}
            />
            <MacroCard
              label="Жиры"
              current={todayStats.fat}
              target={activeGoal?.dailyFat ?? 0}
              accent="#F59E0B"
              showTarget={hasNutritionTargets}
            />
            <MacroCard
              label="Углеводы"
              current={todayStats.carbs}
              target={activeGoal?.dailyCarbs ?? 0}
              accent="#3B82F6"
              showTarget={hasNutritionTargets}
            />
            <MacroCard
              label="Клетчатка"
              current={todayStats.fiber}
              target={activeGoal?.dailyFiber ?? 0}
              accent="#50CA64"
              showTarget={hasNutritionTargets}
            />
          </View>
          <TouchableOpacity
            onPress={() => setSurveyModalOpen(true)}
            style={[
              styles.surveyStrip,
              surveyStatus === 'complete' ? styles.surveyStripComplete : styles.surveyStripPending,
            ]}
          >
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
                onSwipeableOpen={handleSwipeableOpen}
                onSwipeableClose={handleSwipeableClose}
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
  macroGrid: {
    paddingHorizontal: 24,
    marginTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
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
  calendarBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  calendarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  calendarTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  calendarNavButton: {
    padding: 6,
    borderRadius: 999,
    backgroundColor: '#F3F4F6',
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
    fontWeight: '600',
    color: '#9CA3AF',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarCell: {
    width: '14.285%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
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
    borderColor: COLORS.primary,
  },
  calendarCellToday: {
    borderWidth: 1,
    borderColor: '#D1FAE5',
    backgroundColor: '#ECFDF3',
  },
  calendarCellSelected: {
    backgroundColor: COLORS.primary,
  },
  calendarCellText: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
  },
  calendarCellTextSelected: {
    color: '#FFFFFF',
  },
  calendarDot: {
    position: 'absolute',
    top: 2,
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: '#86EFAC',
  },
  calendarDotPartial: {
    backgroundColor: '#F97316',
  },
  calendarDotSelected: {
    backgroundColor: '#D1FAE5',
  },
  calendarDotPartialSelected: {
    backgroundColor: '#FDBA74',
  },
  addCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  addIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#D1FAE5',
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addText: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 10,
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
  surveyStripComplete: {
    backgroundColor: '#ECFDF3',
    borderColor: '#D1FAE5',
  },
  surveyStripPending: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FED7AA',
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
