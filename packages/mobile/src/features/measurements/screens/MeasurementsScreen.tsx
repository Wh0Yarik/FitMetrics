import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, Image, Alert, StyleSheet, Modal, Pressable, PanResponder, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Calendar, Ruler, Pencil, Trash2, ChevronLeft } from 'lucide-react-native';
import { useFocusEffect } from 'expo-router';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';
import Svg, { Path } from 'react-native-svg';

import { measurementsRepository, MeasurementEntry } from '../repositories/MeasurementsRepository';
import { AddMeasurementModal } from '../components/AddMeasurementModal';
import { COLORS } from '../../../constants/Colors';
import { api } from '../../../shared/api/client';
import { dailySurveyRepository } from '../../diary/repositories/DailySurveyRepository';
import { CalendarHeader, CalendarWeekDay } from '../../../shared/components/CalendarHeader';

type MetricKey = 'weight' | 'waist' | 'hips' | 'chest';

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

const shiftDate = (dateStr: string, days: number) => {
  const date = getDateObj(dateStr);
  date.setDate(date.getDate() + days);
  return formatDateKey(date);
};

const getHeaderTitle = (currentDate: string) => {
  const current = getDateObj(currentDate);
  return current.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
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

const buildLinePath = (values: Array<number | null>) => {
  const numericValues = values.filter((value): value is number => typeof value === 'number');
  if (numericValues.length < 2) return '';

  const minValue = Math.min(...numericValues);
  const maxValue = Math.max(...numericValues);
  const range = maxValue - minValue || 1;

  let started = false;
  return values
    .map((value, index) => {
      if (value == null) {
        started = false;
        return '';
      }
      const x = (index / Math.max(1, values.length - 1)) * 100;
      const normalized = (value - minValue) / range;
      const y = 100 - normalized * 100;
      const command = started ? 'L' : 'M';
      started = true;
      return `${command} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .filter(Boolean)
    .join(' ');
};


const formatDate = (date: string) =>
  new Date(date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });

const MeasurementItem = React.memo(({
  item,
  onEdit,
  onDelete,
}: {
  item: MeasurementEntry;
  onEdit: (item: MeasurementEntry) => void;
  onDelete: (id: string) => void;
}) => {
  const previewPhoto = item.photoFront || item.photoSide || item.photoBack;
  const hasMetrics = item.weight != null || item.waist != null || item.hips != null || item.chest != null;

  return (
    <Swipeable
      overshootRight={false}
      rightThreshold={60}
      dragOffsetFromRightEdge={20}
      renderRightActions={() => (
        <View style={styles.swipeActions}>
          <TouchableOpacity onPress={() => onEdit(item)} style={[styles.swipeButton, styles.swipeEdit]}>
            <Pencil size={16} color="#334155" />
            <Text style={styles.swipeText}>Редактировать</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onDelete(item.id)} style={[styles.swipeButton, styles.swipeDelete]}>
            <Trash2 size={16} color="#DC2626" />
            <Text style={[styles.swipeText, styles.swipeDeleteText]}>Удалить</Text>
          </TouchableOpacity>
        </View>
      )}
    >
      <View style={styles.measureCard}>
        <View style={styles.measureTopRow}>
          <View style={styles.datePill}>
            <Calendar size={14} color="#6B7280" />
            <Text style={styles.measureDateText}>{formatDate(item.date)}</Text>
          </View>
          <View style={styles.measureAvatar}>
            {previewPhoto ? (
              <Image source={{ uri: previewPhoto }} style={styles.measureAvatarImage} />
            ) : (
              <Ruler size={18} color="#94A3B8" />
            )}
          </View>
        </View>

        {hasMetrics ? (
          <View style={styles.metricWrap}>
            <View style={styles.metricRows}>
              {item.weight != null && (
                <View style={styles.metricRow}>
                  <Text style={styles.metricRowLabel}>Вес — </Text>
                  <Text style={styles.metricRowValue}>{item.weight} кг</Text>
                </View>
              )}
              {item.waist != null && (
                <View style={styles.metricRow}>
                  <Text style={styles.metricRowLabel}>Талия — </Text>
                  <Text style={styles.metricRowValue}>{item.waist} см</Text>
                </View>
              )}
              {item.hips != null && (
                <View style={styles.metricRow}>
                  <Text style={styles.metricRowLabel}>Бедра — </Text>
                  <Text style={styles.metricRowValue}>{item.hips} см</Text>
                </View>
              )}
              {item.chest != null && (
                <View style={styles.metricRow}>
                  <Text style={styles.metricRowLabel}>Грудь — </Text>
                  <Text style={styles.metricRowValue}>{item.chest} см</Text>
                </View>
              )}
            </View>
          </View>
        ) : (
          <Text style={styles.metricEmpty}>Нет данных</Text>
        )}
      </View>
    </Swipeable>
  );
});

export default function MeasurementsScreen() {
  const [measurements, setMeasurements] = useState<MeasurementEntry[]>([]);
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingMeasurement, setEditingMeasurement] = useState<MeasurementEntry | null>(null);
  const [currentDate, setCurrentDate] = useState(() => formatDateKey(new Date()));
  const [visibleWeekDate, setVisibleWeekDate] = useState(currentDate);
  const [isCalendarOpen, setCalendarOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing'>('synced');
  const [surveyPrefill, setSurveyPrefill] = useState<number | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const date = getDateObj(currentDate);
    return new Date(date.getFullYear(), date.getMonth(), 1);
  });

  useEffect(() => {
    setVisibleWeekDate(currentDate);
  }, [currentDate]);

  const loadData = useCallback(() => {
    const data = measurementsRepository.getAllMeasurements();
    setMeasurements(data);
  }, []);

  const getSurveyWeight = useCallback((dateStr: string) => {
    const survey = dailySurveyRepository.getSurveyByDate(dateStr);
    return survey?.weight ?? null;
  }, []);

  const enrichedMeasurements = useMemo(
    () => measurements.map((entry) => {
      if (entry.weight != null) return entry;
      const surveyWeight = getSurveyWeight(entry.date);
      return surveyWeight != null ? { ...entry, weight: surveyWeight } : entry;
    }),
    [measurements, getSurveyWeight]
  );

  const syncMeasurements = useCallback(async () => {
    try {
      setSyncStatus('syncing');
      const response = await api.get('/measurements/entries');
      const items = Array.isArray(response.data) ? response.data : [];
      items.forEach((item: any) => {
        const date = typeof item.date === 'string' ? item.date.slice(0, 10) : '';
        if (!date) return;
        measurementsRepository.upsertFromServer({
          id: item.id,
          date,
          chest: item.chest ?? null,
          waist: item.waist ?? null,
          hips: item.hips ?? null,
          leftArm: item.arms ?? null,
          rightArm: item.arms ?? null,
          leftLeg: item.legs ?? null,
          rightLeg: item.legs ?? null,
          photoFront: item.photoFront ?? null,
          photoSide: item.photoSide ?? null,
          photoBack: item.photoBack ?? null,
        });
      });
      loadData();
    } catch (error: any) {
      const status = error?.response?.status;
      const payload = error?.response?.data;
      console.error('Failed to sync measurements', {
        message: error?.message,
        status,
        payload,
      });
    } finally {
      setSyncStatus('synced');
    }
  }, [loadData]);

  const syncSurveyWeight = useCallback(async (date: string) => {
    const survey = dailySurveyRepository.getSurveyByDate(date);
    if (!survey) return;
    try {
      await api.post('/surveys/entries', {
        date,
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
    } catch (error: any) {
      const status = error?.response?.status;
      const payload = error?.response?.data;
      console.error('Failed to sync survey weight', {
        message: error?.message,
        status,
        payload,
      });
    }
  }, []);

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
  const measurementsByDate = useMemo(() => {
    const map = new Map<string, MeasurementEntry>();
    enrichedMeasurements.forEach((entry) => {
      map.set(entry.date, entry);
    });
    return map;
  }, [enrichedMeasurements]);
  const weeklyLatestInfo = useMemo(() => {
    if (enrichedMeasurements.length === 0) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const latest = enrichedMeasurements.reduce<Date | null>((acc, entry) => {
      const date = getDateObj(entry.date);
      date.setHours(0, 0, 0, 0);
      if (date > today) return acc;
      if (!acc || date > acc) return date;
      return acc;
    }, null);
    if (!latest) return null;
    const diffDays = Math.max(0, Math.round((today.getTime() - latest.getTime()) / 86400000));
    const isRecent = diffDays <= 6;
    const latestKey = formatDateKey(latest);
    const entry = enrichedMeasurements.find((item) => item.date === latestKey) ?? null;
    if (diffDays === 0) {
      return { label: 'сегодня', isRecent, entry };
    }
    const mod10 = diffDays % 10;
    const mod100 = diffDays % 100;
    const suffix = mod10 === 1 && mod100 !== 11
      ? 'день'
      : mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)
        ? 'дня'
        : 'дней';
    return { label: `${diffDays} ${suffix} назад`, isRecent, entry };
  }, [enrichedMeasurements]);
  const currentMeasurement = measurementsByDate.get(currentDate) ?? null;
  const measurementsSorted = useMemo(
    () => [...enrichedMeasurements].sort((a, b) => a.date.localeCompare(b.date)),
    [enrichedMeasurements]
  );
  const recentMeasurements = useMemo(
    () => measurementsSorted.slice(-7),
    [measurementsSorted]
  );
  const weightSeries = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Array.from({ length: 14 }, (_, index) => {
      const day = new Date(today);
      day.setDate(today.getDate() - (13 - index));
      const dateStr = formatDateKey(day);
      const entry = measurementsByDate.get(dateStr);
      if (entry?.weight != null) return entry.weight;
      return getSurveyWeight(dateStr);
    });
  }, [measurementsByDate, getSurveyWeight]);

  const statsCards = useMemo(() => {
    const configs = [
      { key: 'weight', label: 'Вес', unit: 'кг', color: '#22C55E' },
      { key: 'waist', label: 'Талия', unit: 'см', color: '#3B82F6' },
      { key: 'hips', label: 'Бедро', unit: 'см', color: '#F59E0B' },
      { key: 'chest', label: 'Грудь', unit: 'см', color: '#8B5CF6' },
    ] as const;

    return configs.map((config) => {
      const valuesSource = config.key === 'weight'
        ? weightSeries
        : measurementsSorted.map((item) => item[config.key as MetricKey] ?? null);
      const values = valuesSource.filter((value): value is number => typeof value === 'number');
      const latestValue = values.length > 0 ? values[values.length - 1] : null;
      const prevValue = values.length > 1 ? values[values.length - 2] : null;
      const delta = latestValue != null && prevValue != null ? latestValue - prevValue : null;

      const seriesValues = config.key === 'weight'
        ? weightSeries
        : recentMeasurements.map((item) => {
            const value = item[config.key as MetricKey];
            return typeof value === 'number' ? value : null;
          });
      const numericSeries = seriesValues.filter((value): value is number => value != null);
      const maxValue = numericSeries.length > 0 ? Math.max(...numericSeries) : 0;
      const series = seriesValues.map((value) => {
        if (value == null || maxValue === 0) return 0;
        return Math.max(0.12, value / maxValue);
      });
      const linePath = config.key === 'weight' ? buildLinePath(seriesValues) : '';

      return {
        ...config,
        latestValue,
        delta,
        series,
        linePath,
      };
    });
  }, [measurementsSorted, recentMeasurements, weightSeries]);
  const weekDays = useMemo(() => {
    const today = new Date();
    const todayStr = formatDateKey(today);
    return getWeekDates(visibleWeekDate).map((day, index) => {
      const dateStr = formatDateKey(day);
      const hasMeasurement = measurementsByDate.has(dateStr);
      return {
        date: day,
        dateStr,
        label: WEEKDAY_LABELS[index],
        day: day.getDate(),
        hasMeasurement,
        isSelected: dateStr === currentDate,
        isToday: dateStr === todayStr,
        progress: hasMeasurement ? 1 : 0,
      };
    });
  }, [currentDate, measurementsByDate, visibleWeekDate]);
  const calendarWeekDays = useMemo<CalendarWeekDay[]>(() => weekDays.map((day) => ({
    dateStr: day.dateStr,
    label: day.label,
    day: day.day,
    isSelected: day.isSelected,
    isToday: day.isToday,
    progress: day.progress,
    showProgress: day.hasMeasurement || day.isSelected,
    markerState: day.hasMeasurement ? 'complete' : 'none',
  })), [weekDays]);
  const selectedMeasurements = useMemo(
    () => measurements.filter((entry) => entry.date === currentDate),
    [currentDate, measurements]
  );

  useFocusEffect(
    useCallback(() => {
      loadData();
      syncMeasurements();
    }, [loadData, syncMeasurements])
  );

  useEffect(() => {
    const survey = dailySurveyRepository.getSurveyByDate(currentDate);
    setSurveyPrefill(survey?.weight ?? null);
  }, [currentDate]);

  const handleOpenCalendar = useCallback(() => {
    const date = getDateObj(currentDate);
    setCalendarMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    setCalendarOpen(true);
  }, [currentDate]);

  const handleMonthShift = useCallback((direction: number) => {
    setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + direction, 1));
  }, []);

  const calendarAnim = useRef(new Animated.Value(0)).current;
  const animateCalendar = useCallback((direction: number) => {
    calendarAnim.setValue(direction * -18);
    Animated.timing(calendarAnim, {
      toValue: 0,
      duration: 280,
      useNativeDriver: true,
    }).start();
  }, [calendarAnim]);

  const calendarPanResponder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) =>
      Math.abs(gesture.dx) > 20 && Math.abs(gesture.dx) > Math.abs(gesture.dy),
    onPanResponderMove: (_, gesture) => {
      const clamped = Math.max(-24, Math.min(24, gesture.dx * 0.25));
      calendarAnim.setValue(clamped);
    },
    onPanResponderRelease: (_, gesture) => {
      if (Math.abs(gesture.dx) < 40) {
        Animated.timing(calendarAnim, {
          toValue: 0,
          duration: 160,
          useNativeDriver: true,
        }).start();
        return;
      }
      const direction = gesture.dx > 0 ? -1 : 1;
      handleMonthShift(direction);
      animateCalendar(direction);
    },
  }), [animateCalendar, calendarAnim, handleMonthShift]);

  const weekSwipeAnim = useRef(new Animated.Value(0)).current;
  const handleWeekShift = useCallback((direction: number) => {
    setVisibleWeekDate((prev) => shiftDate(prev, direction * 7));
  }, []);

  const weekPanResponder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) =>
      Math.abs(gesture.dx) > 20 && Math.abs(gesture.dx) > Math.abs(gesture.dy),
    onPanResponderMove: (_, gesture) => {
      const clamped = Math.max(-28, Math.min(28, gesture.dx * 0.2));
      weekSwipeAnim.setValue(clamped);
    },
    onPanResponderRelease: (_, gesture) => {
      if (Math.abs(gesture.dx) < 40) {
        Animated.timing(weekSwipeAnim, {
          toValue: 0,
          duration: 160,
          useNativeDriver: true,
        }).start();
        return;
      }
      const direction = gesture.dx > 0 ? -1 : 1;
      handleWeekShift(direction);
      Animated.timing(weekSwipeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    },
  }), [handleWeekShift, weekSwipeAnim]);

  const handleSave = (data: Partial<MeasurementEntry>) => {
    const targetDate = editingMeasurement?.date ?? currentDate;
    measurementsRepository.saveMeasurement({
      ...data,
      id: editingMeasurement?.id,
      date: targetDate,
    });
    if (data.weight != null) {
      dailySurveyRepository.updateWeightForDate(targetDate, data.weight);
      syncSurveyWeight(targetDate);
    }
    setEditingMeasurement(null);
    setModalOpen(false);
    loadData();
  };

  const handleEdit = (item: MeasurementEntry) => {
    setEditingMeasurement(item);
    setModalOpen(true);
  };

  const handleAddMeasurement = useCallback(() => {
    const existing = measurementsByDate.get(currentDate);
    if (existing) {
      setEditingMeasurement(existing);
    } else {
      setEditingMeasurement(null);
    }
    setModalOpen(true);
  }, [currentDate, measurementsByDate]);

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
    <GestureHandlerRootView style={styles.screen}>
      <View pointerEvents="none" style={styles.bgAccentPrimary} />
      <View pointerEvents="none" style={styles.bgAccentSecondary} />
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <StatusBar barStyle="dark-content" />

        <CalendarHeader
          dateLabel={getHeaderTitle(currentDate)}
          relativeLabel={relativeLabel}
          syncStatus={syncStatus}
          weekDays={calendarWeekDays}
          onOpenCalendar={handleOpenCalendar}
          onSelectDay={(dateStr) => {
            setCurrentDate(dateStr);
            setVisibleWeekDate(dateStr);
          }}
          weekSwipeAnim={weekSwipeAnim}
          weekPanHandlers={weekPanResponder.panHandlers}
          useSafeArea={false}
        />

        <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 120 }}>
          <TouchableOpacity
            onPress={handleAddMeasurement}
            activeOpacity={0.85}
            style={[
              styles.weeklyStrip,
              weeklyLatestInfo?.isRecent ? styles.weeklyStripComplete : styles.weeklyStripPending,
            ]}
          >
            <View style={styles.weeklyStripRow}>
              <View style={styles.weeklyStripLeft}>
                <View
                  style={[
                    styles.weeklyStatusDot,
                    weeklyLatestInfo?.isRecent ? styles.weeklyStatusComplete : styles.weeklyStatusPending,
                  ]}
                />
                <Text style={styles.weeklyStripTitle}>Замеры</Text>
              </View>
              <Text
                style={[
                  styles.weeklyStripCta,
                  weeklyLatestInfo?.isRecent ? styles.weeklyStripCtaComplete : styles.weeklyStripCtaPending,
                ]}
              >
                {weeklyLatestInfo ? `Заполнено • ${weeklyLatestInfo.label}` : 'Нет данных'}
              </Text>
            </View>
          </TouchableOpacity>
          {currentMeasurement ? (
            <View style={styles.weeklyCardWrap}>
              <MeasurementItem
                item={currentMeasurement}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </View>
          ) : (
            <TouchableOpacity onPress={handleAddMeasurement} style={styles.addMeasurementInline}>
              <View style={styles.addMeasurementInlineIcon}>
                <Plus size={18} color={COLORS.primary} />
              </View>
              <Text style={styles.addMeasurementInlineText}>Добавить замеры</Text>
            </TouchableOpacity>
          )}
          <View style={styles.listHeader}>
            <View>
              <Text style={styles.sectionTitle}>Замеры</Text>
            </View>
          </View>

          <View style={styles.statsGrid}>
            {statsCards.map((card) => {
              const formattedValue = card.latestValue != null
                ? `${Number.isInteger(card.latestValue) ? card.latestValue : card.latestValue.toFixed(1)} ${card.unit}`
                : '—';
              const formattedDelta = card.delta != null
                ? `${card.delta > 0 ? '+' : ''}${Number.isInteger(card.delta) ? card.delta : card.delta.toFixed(1)} ${card.unit}`
                : 'нет данных';
              return (
                <TouchableOpacity key={card.key} style={styles.statsCard} activeOpacity={0.85}>
                  <View style={styles.statsCardHeader}>
                    <Text style={styles.statsCardTitle}>{card.label}</Text>
                    <Text style={styles.statsCardChevron}>›</Text>
                  </View>
                  <Text style={styles.statsCardSub}>
                    {card.key === 'weight' ? 'Последние 14 дней' : 'Последние 7 дней'}
                  </Text>
                  <View style={styles.statsCardBody}>
                    <View style={styles.statsCardValues}>
                      <Text style={styles.statsCardValue}>{formattedValue}</Text>
                      <Text
                        style={[
                          styles.statsCardDelta,
                          card.delta == null
                            ? styles.statsCardDeltaMuted
                            : card.delta >= 0
                              ? styles.statsCardDeltaUp
                              : styles.statsCardDeltaDown,
                        ]}
                      >
                        {formattedDelta}
                      </Text>
                    </View>
                    <View style={styles.statsSparkline}>
                      {card.key === 'weight' && card.linePath ? (
                        <Svg width="100%" height="100%" viewBox="0 0 100 100">
                          <Path
                            d={card.linePath}
                            fill="none"
                            stroke={card.color}
                            strokeWidth="4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </Svg>
                      ) : (
                        card.series.map((ratio, index) => (
                          <View
                            key={`${card.key}-${index}`}
                            style={[
                              styles.statsBar,
                              {
                                height: `${Math.max(0, ratio) * 100}%`,
                                backgroundColor: ratio > 0 ? card.color : '#E5E7EB',
                              },
                            ]}
                          />
                        ))
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
          
        </ScrollView>

        <Modal visible={isCalendarOpen} transparent animationType="fade" onRequestClose={() => setCalendarOpen(false)}>
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
                  const hasMeasurement = measurementsByDate.has(dateStr);
                  return (
                    <TouchableOpacity
                      key={dateStr}
                      style={styles.calendarCell}
                      onPress={() => {
                        setCurrentDate(dateStr);
                        setVisibleWeekDate(dateStr);
                        setCalendarOpen(false);
                      }}
                    >
                      <View
                        style={[
                          styles.calendarCellInner,
                          hasMeasurement && styles.calendarCellHasMeals,
                          isSelected && styles.calendarCellSelected,
                          isToday && !isSelected && styles.calendarCellToday,
                        ]}
                      >
                        <View
                          style={[
                            styles.calendarDot,
                            !hasMeasurement && styles.calendarDotHidden,
                            isSelected && styles.calendarDotSelected,
                          ]}
                        />
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

        <AddMeasurementModal
          visible={isModalOpen}
          onClose={() => {
            setModalOpen(false);
            setEditingMeasurement(null);
          }}
          onSave={handleSave}
          initialData={editingMeasurement ?? (surveyPrefill != null ? { weight: surveyPrefill } : null)}
        />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F7FAF8',
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
  sectionChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    marginTop: 6,
  },
  sectionChipText: {
    color: '#6B7280',
    fontSize: 11,
    fontWeight: '600',
  },
  listHeader: {
    paddingHorizontal: 24,
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  listWrap: {
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  addButton: {
    marginTop: 16,
    marginHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignSelf: 'flex-start',
    shadowColor: COLORS.primary,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  addButtonText: {
    marginLeft: 8,
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E6ECEA',
  },
  emptyText: {
    marginTop: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  measureCard: {
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#EEF2F3',
    shadowColor: '#0F172A',
    shadowOpacity: 0.01,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    marginBottom: 12,
    height: 122,
    justifyContent: 'center',
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
    color: '#EF4444',
  },
  measureTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  measureAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  measureAvatarImage: {
    width: '100%',
    height: '100%',
  },
  datePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  measureDateText: {
    marginLeft: 6,
    color: '#374151',
    fontSize: 12,
    fontWeight: '600',
  },
  metricWrap: {
    backgroundColor: '#FBFDFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EEF2F3',
    paddingHorizontal: 9,
    paddingVertical: 7,
  },
  metricRows: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  metricRow: {
    width: '48%',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  metricRowLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  metricRowValue: {
    fontSize: 12,
    color: '#111827',
    fontWeight: '700',
  },
  metricEmpty: {
    marginTop: 2,
    color: '#9CA3AF',
    fontSize: 12,
  },
  calendarBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  calendarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  calendarTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  calendarNavButton: {
    width: 32,
    height: 32,
    borderRadius: 999,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarNavNextIcon: {
    transform: [{ rotate: '180deg' }],
  },
  calendarWeekRow: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  calendarWeekLabel: {
    width: 32,
    textAlign: 'center',
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  calendarGrid: {
    marginTop: 8,
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
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarCellEmpty: {
    width: '14.285%',
    paddingVertical: 12,
  },
  calendarCellHasMeals: {
    borderWidth: 1,
    borderColor: '#D1FAE5',
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
  calendarDotHidden: {
    opacity: 0,
  },
  calendarDotSelected: {
    backgroundColor: '#D1FAE5',
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
  weeklyStrip: {
    marginTop: 16,
    marginHorizontal: 24,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: '#ECFDF3',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D1FAE5',
    flexDirection: 'column',
    alignItems: 'stretch',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 6 },
  },
  weeklyStripRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  weeklyStripComplete: {
    backgroundColor: '#ECFDF3',
    borderColor: '#D1FAE5',
  },
  weeklyStripPending: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FED7AA',
  },
  weeklyStripLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weeklyStatusDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    marginRight: 10,
  },
  weeklyStatusComplete: {
    backgroundColor: '#86EFAC',
  },
  weeklyStatusPending: {
    backgroundColor: '#FB923C',
  },
  weeklyStripTitle: {
    color: '#111827',
    fontSize: 13,
    fontWeight: '700',
  },
  weeklyStripCta: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  weeklyStripCtaComplete: {
    color: '#065F46',
  },
  weeklyStripCtaPending: {
    color: '#C2410C',
  },
  weeklyCardWrap: {
    marginTop: 12,
    marginHorizontal: 24,
  },
  addMeasurementInline: {
    marginTop: 12,
    marginHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addMeasurementInlineIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#D1FAE5',
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addMeasurementInlineText: {
    marginLeft: 8,
    color: '#111827',
    fontSize: 15,
    fontWeight: '600',
  },
  statsGrid: {
    marginTop: 12,
    paddingHorizontal: 24,
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 14,
    marginBottom: 12,
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 6 },
  },
  statsCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statsCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  statsCardChevron: {
    fontSize: 18,
    color: '#9CA3AF',
  },
  statsCardSub: {
    marginTop: 4,
    fontSize: 11,
    color: '#9CA3AF',
  },
  statsCardBody: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  statsCardValues: {
    flex: 1,
    paddingRight: 12,
  },
  statsCardValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  statsCardDelta: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '600',
  },
  statsCardDeltaUp: {
    color: '#16A34A',
  },
  statsCardDeltaDown: {
    color: '#DC2626',
  },
  statsCardDeltaMuted: {
    color: '#9CA3AF',
  },
  statsSparkline: {
    width: 90,
    height: 48,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  statsBar: {
    width: 8,
    borderRadius: 999,
  },
});
