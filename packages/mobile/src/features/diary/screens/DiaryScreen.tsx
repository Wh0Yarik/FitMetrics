import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, Alert, BackHandler, StyleSheet, Modal, Pressable } from 'react-native';
import { Plus, Pencil, Trash2, ChevronLeft, ChevronDown, Cloud, CloudOff, RefreshCw } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, Stack } from 'expo-router';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';
import Svg, { Circle, Defs, LinearGradient, Stop, Rect, Path } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { AddMealModal, PortionCount } from '../components/AddMealModal';
import { DailySurveyModal } from '../components/DailySurveyModal';
import { diaryRepository, MealEntry } from '../repositories/DiaryRepository';
import { dailySurveyRepository, DailySurveyData } from '../repositories/DailySurveyRepository';
import { COLORS } from '../../../constants/Colors';
import { api } from '../../../shared/api/client';
import { getToken } from '../../../shared/lib/storage';

// --- Конфигурация и константы ---

// --- Вспомогательные функции ---

// Преобразование строки даты "YYYY-MM-DD" в объект Date
const getDateObj = (dateStr: string) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const formatDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Формирование заголовка даты (Сегодня, Вчера, Завтра или полная дата)
const getHeaderTitle = (currentDate: string) => {
  const current = getDateObj(currentDate);
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const formatted = current.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return formatted;
};

const getRelativeLabel = (currentDate: string) => {
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
  return null;
};

const getWeekRangeLabel = (currentDate: string) => {
  const date = getDateObj(currentDate);
  const day = date.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  const start = new Date(date);
  start.setDate(date.getDate() + diff);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const format = (value: Date) =>
    value.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  return `${format(start)} – ${format(end)}`;
};

const getWeekStart = (date: Date) => {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

const getWeekDates = (currentDate: string) => {
  const base = getWeekStart(getDateObj(currentDate));
  const days = [];
  for (let i = 0; i < 7; i += 1) {
    const day = new Date(base);
    day.setDate(base.getDate() + i);
    days.push(day);
  }
  return days;
};

const WEEKDAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

const WeekProgressBorder = ({
  progress,
  accent,
  baseColor,
}: {
  progress: number;
  accent: string;
  baseColor: string;
}) => {
  const normalized = Math.max(0, progress);
  const baseProgress = Math.min(1, normalized);
  const overflowProgress = Math.min(1, Math.max(0, normalized - 1));
  const rectWidth = 37;
  const rectHeight = 69;
  const rectRadius = 18;
  const rectX = 0.5;
  const rectY = 0.5;
  const rectRight = rectX + rectWidth;
  const rectBottom = rectY + rectHeight;
  const rectTop = rectY;
  const rectLeft = rectX;
  const topCenterX = rectX + rectWidth / 2;
  const straightLength = 2 * (rectWidth + rectHeight - 4 * rectRadius);
  const curvedLength = 2 * Math.PI * rectRadius;
  const perimeter = straightLength + curvedLength;
  const filled = baseProgress * perimeter;
  const remaining = perimeter - filled;
  const overflowFilled = overflowProgress * perimeter;
  const overflowRemaining = perimeter - overflowFilled;
  const path = [
    `M ${topCenterX} ${rectTop}`,
    `L ${rectRight - rectRadius} ${rectTop}`,
    `A ${rectRadius} ${rectRadius} 0 0 1 ${rectRight} ${rectTop + rectRadius}`,
    `L ${rectRight} ${rectBottom - rectRadius}`,
    `A ${rectRadius} ${rectRadius} 0 0 1 ${rectRight - rectRadius} ${rectBottom}`,
    `L ${rectLeft + rectRadius} ${rectBottom}`,
    `A ${rectRadius} ${rectRadius} 0 0 1 ${rectLeft} ${rectBottom - rectRadius}`,
    `L ${rectLeft} ${rectTop + rectRadius}`,
    `A ${rectRadius} ${rectRadius} 0 0 1 ${rectLeft + rectRadius} ${rectTop}`,
    `L ${topCenterX} ${rectTop}`,
  ].join(' ');
  const accentBase = accent.startsWith('#') ? accent.slice(0, 7) : accent;
  const gradientId = `week-progress-${accentBase.replace('#', '')}`;
  const overflowColor = '#F97316';

  return (
    <Svg width="100%" height="100%" viewBox="0 0 38 70">
      <Defs>
        <LinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={accentBase} stopOpacity="0.95" />
          <Stop offset="1" stopColor={`${accentBase}66`} />
        </LinearGradient>
      </Defs>
      <Path
        d={path}
        fill="none"
        stroke={baseColor}
        strokeWidth="2"
      />
      <Path
        d={path}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth="2"
        strokeDasharray={`${filled} ${remaining}`}
        strokeDashoffset="0"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {overflowProgress > 0 ? (
        <Path
          d={path}
          fill="none"
          stroke={overflowColor}
          strokeWidth="2"
          strokeDasharray={`${overflowFilled} ${overflowRemaining}`}
          strokeDashoffset="0"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : null}
    </Svg>
  );
};

// --- Подкомпоненты (UI элементы) ---

// Чип порций для карточки приема пищи
const MealPortionChip = React.memo(({ label, value, color }: { label: string, value: number, color: string }) => (
  <View style={[styles.mealChip, { borderColor: `${color}33` }]}>
    <View style={[styles.mealChipDot, { backgroundColor: color }]} />
    <Text style={styles.mealChipText}>{label} {value > 0 ? value : '–'}</Text>
  </View>
));

const MacroRing = ({ progress, accent }: { progress: number; accent: string }) => {
  const size = 48;
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const normalized = Math.max(0, progress);
  const baseProgress = Math.min(1, normalized);
  const overflowProgress = Math.min(1, Math.max(0, normalized - 1));
  const baseOffset = circumference * (1 - baseProgress);
  const overflowOffset = circumference * (1 - overflowProgress);
  const gradientId = `macro-${accent.replace('#', '')}`;
  const overflowColor = '#F97316';

  return (
    <Svg width={size} height={size}>
      <Defs>
        <LinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={accent} stopOpacity="0.9" />
          <Stop offset="1" stopColor={`${accent}66`} />
        </LinearGradient>
      </Defs>
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="#E5E7EB"
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={`${circumference}`}
      />
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={`url(#${gradientId})`}
        strokeWidth={strokeWidth}
        strokeDasharray={`${circumference}`}
        strokeDashoffset={baseOffset}
        strokeLinecap="round"
        fill="none"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      {overflowProgress > 0 ? (
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={overflowColor}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference}`}
          strokeDashoffset={overflowOffset}
          strokeLinecap="round"
          fill="none"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      ) : null}
    </Svg>
  );
};

// Карточка нутриента (План/Факт + прогресс)
const MacroCard = React.memo(({
  label,
  current,
  target,
  accent,
  showTarget,
}: {
  label: string;
  current: number;
  target: number;
  accent: string;
  showTarget: boolean;
}) => {
  const progress = target > 0 ? current / target : 0;

  return (
    <View style={[styles.macroCard, { borderColor: `${accent}33` }]}>
      <View style={styles.macroRingWrap}>
        <MacroRing progress={showTarget ? progress : 1} accent={accent} />
        <View style={styles.macroRingCenter}>
          <Text style={[styles.macroValue, { color: accent }]}>{current}</Text>
        </View>
      </View>
      <View style={styles.macroInfo}>
        <Text style={styles.macroLabel}>{label}</Text>
        {showTarget ? (
          <Text style={styles.macroPlanFact}>
            /{target}
          </Text>
        ) : (
          <Text style={styles.macroPlanFactMuted}>Цель не задана</Text>
        )}
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
  onSwipeableOpen,
  onSwipeableClose,
}: {
  meal: MealEntry;
  onDelete: (id: string) => void;
  onEdit: (meal: MealEntry) => void;
  showSwipeHint: boolean;
  onFirstSwipe: () => void;
  onSwipeableOpen: (ref: Swipeable | null) => void;
  onSwipeableClose: (ref: Swipeable | null) => void;
}) => {
  const swipeRef = useRef<Swipeable>(null);
  const isOpenRef = useRef(false);

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
      friction={2}
      overshootFriction={8}
      rightThreshold={60}
      dragOffsetFromRightEdge={20}
      onSwipeableOpen={() => {
        isOpenRef.current = true;
        onFirstSwipe();
        onSwipeableOpen(swipeRef.current);
      }}
      onSwipeableClose={() => {
        isOpenRef.current = false;
        onSwipeableClose(swipeRef.current);
      }}
      renderRightActions={() => (
        <View style={styles.swipeActions}>
          <TouchableOpacity onPress={handleEdit} style={[styles.swipeButton, styles.swipeEdit]}>
            <Pencil size={16} color="#334155" />
            <Text style={styles.swipeText}>Редактировать</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} style={[styles.swipeButton, styles.swipeDelete]}>
            <Trash2 size={16} color="#DC2626" />
            <Text style={[styles.swipeText, styles.swipeDeleteText]}>Удалить</Text>
          </TouchableOpacity>
        </View>
      )}
    >
      <View
        style={styles.mealCard}
        onTouchStart={() => {
          if (isOpenRef.current) {
            swipeRef.current?.close();
          }
        }}
      >
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
          <MealPortionChip label="Б" value={meal.portions.protein} color="#06B6D4" />
          <MealPortionChip label="Ж" value={meal.portions.fat} color="#F59E0B" />
          <MealPortionChip label="У" value={meal.portions.carbs} color="#3B82F6" />
          <MealPortionChip label="К" value={meal.portions.fiber} color="#50CA64" />
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

const isSurveyComplete = (survey: DailySurveyData) =>
  survey.weight != null &&
  survey.motivation != null &&
  survey.sleep != null &&
  survey.stress != null &&
  survey.digestion != null &&
  survey.water != null &&
  survey.hunger != null &&
  survey.libido != null;

// Хук для управления данными дневника (еда, анкеты, статус синхронизации)
const useDiaryData = (currentDate: string) => {
  const [meals, setMeals] = useState<MealEntry[]>([]);
  const [surveyStatus, setSurveyStatus] = useState<'empty' | 'partial' | 'complete'>('empty');
  const [dailySurvey, setDailySurvey] = useState<DailySurveyData | null>(null);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'local'>('synced');

  // Загрузка данных из репозиториев при смене даты
  const loadData = useCallback(() => {
    const loadedMeals = diaryRepository.getMealsByDate(currentDate);
    setMeals(loadedMeals);
    setSyncStatus(loadedMeals.some((meal) => !meal.synced) ? 'local' : 'synced');
    
    const survey = dailySurveyRepository.getSurveyByDate(currentDate);
    setDailySurvey(survey);
    
    if (!survey) {
      setSurveyStatus('empty');
    } else {
      setSurveyStatus(isSurveyComplete(survey) ? 'complete' : 'partial');
    }
  }, [currentDate]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  return { meals, surveyStatus, dailySurvey, syncStatus, setSyncStatus, refreshData: loadData };
};

// --- Основной компонент экрана ---

export default function DiaryScreen() {
  // Инициализация текущей даты (сегодня)
  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date();
    return formatDateKey(now);
  });
  const [isCalendarOpen, setCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const date = getDateObj(currentDate);
    return new Date(date.getFullYear(), date.getMonth(), 1);
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
  const syncInFlightRef = useRef(false);
  const surveySyncInFlightRef = useRef(false);
  const lastSurveySyncAttemptRef = useRef<Record<string, number>>({});
  const lastSyncAttemptRef = useRef<Record<string, number>>({});
  const relativeLabel = useMemo(() => getRelativeLabel(currentDate), [currentDate]);
  const monthLabel = useMemo(() => {
    const label = calendarMonth.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
    return label.charAt(0).toUpperCase() + label.slice(1);
  }, [calendarMonth]);
  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const startOffset = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;
    return Array.from({ length: totalCells }, (_, index) => {
      const dayNumber = index - startOffset + 1;
      if (dayNumber < 1 || dayNumber > daysInMonth) {
        return null;
      }
      return new Date(year, month, dayNumber);
    });
  }, [calendarMonth]);
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

  const syncDiaryForDate = useCallback(async (force?: boolean) => {
    if (syncInFlightRef.current) return;
    if (!force) {
      const lastAttempt = lastSyncAttemptRef.current[currentDate] ?? 0;
      if (Date.now() - lastAttempt < 15000) {
        return;
      }
      lastSyncAttemptRef.current[currentDate] = Date.now();
    }

    const token = await getToken();
    if (!token) {
      setSyncStatus('local');
      return;
    }

    const mealsForDate = diaryRepository.getMealsByDate(currentDate);
    if (mealsForDate.length === 0) {
      setSyncStatus('synced');
      return;
    }

    syncInFlightRef.current = true;
    setSyncStatus('syncing');
    try {
      await api.post('/diary/entries', {
        date: currentDate,
        meals: mealsForDate.map((meal) => ({
          name: meal.name,
          time: meal.time,
          protein: meal.portions.protein,
          fat: meal.portions.fat,
          carbs: meal.portions.carbs,
          fiber: meal.portions.fiber,
        })),
      });

      diaryRepository.markMealsAsSynced(currentDate);
      setSyncStatus('synced');
      refreshData();
    } catch (error: any) {
      const status = error?.response?.status;
      const payload = error?.response?.data;
      console.error('Failed to sync diary entries', {
        message: error?.message,
        status,
        payload,
      });
      setSyncStatus('local');
    } finally {
      syncInFlightRef.current = false;
    }
  }, [currentDate, refreshData, setSyncStatus]);

  useEffect(() => {
    if (syncStatus === 'local' && diaryRepository.hasUnsyncedMeals(currentDate)) {
      syncDiaryForDate();
    }
  }, [currentDate, syncDiaryForDate, syncStatus]);

  useEffect(() => {
    if (dailySurveyRepository.hasUnsyncedSurvey(currentDate)) {
      syncSurveyForDate();
    }
  }, [currentDate, syncSurveyForDate]);

  const syncSurveyForDate = useCallback(async (force?: boolean) => {
    if (surveySyncInFlightRef.current) return;
    if (!force) {
      const lastAttempt = lastSurveySyncAttemptRef.current[currentDate] ?? 0;
      if (Date.now() - lastAttempt < 15000) {
        return;
      }
      lastSurveySyncAttemptRef.current[currentDate] = Date.now();
    }

    const token = await getToken();
    if (!token) return;

    const survey = dailySurveyRepository.getSurveyByDate(currentDate);
    if (!survey || survey.synced) return;

    surveySyncInFlightRef.current = true;
    try {
      await api.post('/surveys/entries', {
        date: currentDate,
        weight: survey.weight ?? null,
        motivation: survey.motivation ?? null,
        sleep: survey.sleep ?? null,
        stress: survey.stress ?? null,
        digestion: survey.digestion ?? null,
        water: survey.water ?? null,
        hunger: survey.hunger ?? null,
        libido: survey.libido ?? null,
        comment: survey.comment ?? null,
      });

      dailySurveyRepository.markSurveyAsSynced(currentDate);
      refreshData();
    } catch (error: any) {
      const status = error?.response?.status;
      const payload = error?.response?.data;
      console.error('Failed to sync daily survey', {
        message: error?.message,
        status,
        payload,
      });
    } finally {
      surveySyncInFlightRef.current = false;
    }
  }, [currentDate, refreshData]);

  const weekDays = useMemo(() => {
    const today = new Date();
    const todayStr = formatDateKey(today);
    return getWeekDates(currentDate).map((day, index) => {
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

  useEffect(() => {
    if (!isCalendarOpen) {
      const date = getDateObj(currentDate);
      setCalendarMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    }
  }, [currentDate, isCalendarOpen]);

  const handleOpenCalendar = useCallback(() => {
    const date = getDateObj(currentDate);
    setCalendarMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    setCalendarOpen(true);
  }, [currentDate]);

  const handleMonthShift = useCallback((direction: number) => {
    setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + direction, 1));
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

  return (
    <GestureHandlerRootView style={styles.screen}>
      <View pointerEvents="none" style={styles.bgAccentPrimary} />
      <View pointerEvents="none" style={styles.bgAccentSecondary} />
      <Stack.Screen
        options={{ headerShown: false }}
      />
            {/* Хедер и недельная лента */}
            <SafeAreaView edges={['top']} style={styles.headerArea}>
              <View className="px-6 pb-3 pt-2">
                <View style={styles.headerCard}>
                  <View style={styles.headerTopRow}>
                    <View>
                      <TouchableOpacity style={styles.dateRow} onPress={handleOpenCalendar}>
                        <View style={styles.dateLeft}>
                          {relativeLabel ? (
                            <View style={styles.relativePill}>
                              <Text style={styles.relativePillText}>{relativeLabel}</Text>
                            </View>
                          ) : null}
                          <Text style={styles.dateText}>{getHeaderTitle(currentDate)}</Text>
                        </View>
                        <ChevronDown size={16} color="#9CA3AF" />
                      </TouchableOpacity>
                    </View>
                    <View style={styles.syncStatus}>
                      <View
                        style={[
                          styles.syncBadge,
                          syncStatus === 'synced' && styles.syncBadgeSuccess,
                          syncStatus === 'local' && styles.syncBadgeLocal,
                        ]}
                      >
                        {syncStatus === 'syncing' ? (
                          <RefreshCw size={14} color="#6B7280" />
                        ) : syncStatus === 'synced' ? (
                          <Cloud size={14} color="#10B981" />
                        ) : (
                          <CloudOff size={14} color="#F97316" />
                        )}
                      </View>
                    </View>
                  </View>

                  <View style={styles.weekRow}>
                    <View style={styles.weekDays}>
                      {weekDays.map((day) => (
                        <TouchableOpacity
                          key={day.dateStr}
                          onPress={() => setCurrentDate(day.dateStr)}
                          style={[
                            styles.weekDayItem,
                            day.isSelected && styles.weekDayItemSelected,
                            day.isToday && !day.isSelected && styles.weekDayItemToday,
                          ]}
                        >
                          {(day.hasMeals || day.isSelected) && (
                            <View pointerEvents="none" style={styles.weekDayProgress}>
                              <WeekProgressBorder
                                progress={day.progress}
                                accent={day.isSelected ? '#FFFFFF' : COLORS.primary}
                                baseColor={day.isSelected ? 'rgba(255,255,255,0.35)' : '#E5E7EB'}
                              />
                            </View>
                          )}
                          <Text style={[styles.weekDayLabel, day.isSelected && styles.weekDayLabelSelected]}>
                            {day.label}
                          </Text>
                          <View
                            style={[
                              styles.weekDayDot,
                              day.surveyStatus === 'partial' && styles.weekDayDotPartial,
                              !day.hasSurvey && styles.weekDayDotHidden,
                              day.isSelected && day.surveyStatus === 'complete' && styles.weekDayDotSelected,
                              day.isSelected && day.surveyStatus === 'partial' && styles.weekDayDotPartialSelected,
                            ]}
                          />
                          {day.isSelected ? (
                            <View style={styles.weekDayNumberPill}>
                              <Text style={styles.weekDayNumberSelected}>{day.day}</Text>
                            </View>
                          ) : (
                            <Text style={styles.weekDayNumber}>{day.day}</Text>
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>
              </View>
            </SafeAreaView>
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
          onRequestClose={() => setCalendarOpen(false)}
        >
          <Pressable style={styles.calendarBackdrop} onPress={() => setCalendarOpen(false)}>
            <Pressable style={styles.calendarCard} onPress={() => {}}>
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
              <View style={styles.calendarGrid}>
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
                        setCurrentDate(dateStr);
                        setCalendarOpen(false);
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
              </View>
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
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    gap: 8,
  },
  dateLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  relativePill: {
    backgroundColor: COLORS.primary,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  relativePillText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  dateText: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '700',
    paddingVertical: 4,
  },
  syncStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  syncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  syncBadgeSuccess: {
    backgroundColor: '#ECFDF3',
  },
  syncBadgeLocal: {
    backgroundColor: '#FFF7ED',
  },
  weekRangeText: {
    marginTop: 4,
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  weekRow: {
    marginTop: 12,
  },
  weekDays: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  weekDayItem: {
    width: 38,
    height: 70,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  weekDayProgress: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  weekDayItemSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  weekDayItemToday: {
    borderColor: '#D1FAE5',
    backgroundColor: '#ECFDF3',
  },
  weekDayItemHasMeals: {
    borderColor: COLORS.primary,
  },
  weekDayLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: '700',
  },
  weekDayLabelSelected: {
    color: '#FFFFFF',
  },
  weekDayNumber: {
    marginTop: 2,
    fontSize: 16,
    fontWeight: '300',
    color: '#111827',
  },
  weekDayDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
    marginTop: 4,
    backgroundColor: COLORS.primary,
  },
  weekDayDotPartial: {
    backgroundColor: '#F97316',
  },
  weekDayDotHidden: {
    opacity: 0,
  },
  weekDayDotSelected: {
    backgroundColor: '#FFFFFF',
  },
  weekDayDotPartialSelected: {
    backgroundColor: '#FDBA74',
  },
  weekDayNumberPill: {
    marginTop: 4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekDayNumberSelected: {
    fontSize: 15,
    fontWeight: '500',
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
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderWidth: 2,
    shadowColor: '#111827',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  macroRingWrap: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  macroRingCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  macroValue: {
    fontSize: 22,
    fontWeight: '900',
  },
  macroTarget: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  macroInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  macroLabel: {
    fontSize: 16,
    fontWeight: '300',
    color: '#6B7280',
    textTransform: 'none',
    letterSpacing: 0.4,
    lineHeight: 18,
    minHeight: 18,
  },
  macroPlanFact: {
    marginTop: 0,
    fontSize: 18,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  macroPlanFactMuted: {
    marginTop: 0,
    fontSize: 15,
    color: '#9CA3AF',
    fontWeight: '800',
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
  mealCard: {
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E6ECEA',
    shadowColor: '#0F172A',
    shadowOpacity: 0.01,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    marginBottom: 12,
  },
  mealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  mealTimePill: {
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  mealTimeText: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '500',
  },
  mealName: {
    flex: 1,
    color: '#111827',
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 20,
  },
  mealChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  mealChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
    marginRight: 6,
    marginBottom: 6,
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
    fontWeight: '500',
  },
  swipeHint: {
    marginTop: 0,
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
    paddingRight: 6,
    paddingBottom: 12,
    paddingTop: 0,
  },
  swipeButton: {
    width: 108,
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  swipeEdit: {
    borderColor: '#CBD5E1',
  },
  swipeDelete: {
    borderColor: '#FCA5A5',
    backgroundColor: '#FFF1F2',
  },
  swipeText: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },
  swipeDeleteText: {
    color: '#DC2626',
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
