import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, Alert, StyleSheet, Modal, Pressable, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, ChevronLeft, Check, SlidersHorizontal } from 'lucide-react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { measurementsRepository, MeasurementEntry } from '../repositories/MeasurementsRepository';
import { AddMeasurementModal } from '../components/AddMeasurementModal';
import { MeasurementHistoryItem } from '../components/MeasurementHistoryItem';
import { MeasurementProgressSheet } from '../components/MeasurementProgressSheet';
import { MeasurementStatsGrid } from '../components/MeasurementStatsGrid';
import { SharedBottomSheet } from '../../profile/components/SharedBottomSheet';
import { useMeasurementsList } from '../model/useMeasurementsList';
import { api } from '../../../shared/api/client';
import { dailySurveyRepository } from '../../diary/repositories/DailySurveyRepository';
import { CalendarHeader, CalendarWeekDay } from '../../../shared/components/CalendarHeader';
import { formatDateKey, getWeekDates, getHeaderTitle, getRelativeLabel, shiftDate, WEEKDAY_LABELS } from '../../../shared/lib/date';
import { useWeekCalendar } from '../../../shared/lib/calendar/useWeekCalendar';
import { colors, fonts, radii, shadows, spacing, useTabBarVisibility } from '../../../shared/ui';

const FILTER_STORAGE_KEY = 'measurementsStatsFilter';
const FILTER_OPTIONS = [
  { key: 'weight', label: 'Вес' },
  { key: 'waist', label: 'Талия' },
  { key: 'hips', label: 'Бедра' },
  { key: 'chest', label: 'Грудь' },
  { key: 'arms', label: 'Руки' },
  { key: 'legs', label: 'Ноги' },
] as const;


export default function MeasurementsScreen() {
  const { setHidden: setTabBarHidden } = useTabBarVisibility();
  const [isModalOpen, setModalOpen] = useState(false);
  const [isProgressOpen, setProgressOpen] = useState(false);
  const [isFilterOpen, setFilterOpen] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<'weight' | 'waist' | 'hips' | 'chest' | 'arms' | 'legs' | null>(null);
  const [metricFilter, setMetricFilter] = useState<typeof FILTER_OPTIONS[number]['key'][]>(
    FILTER_OPTIONS.map((option) => option.key)
  );
  const [draftFilter, setDraftFilter] = useState<typeof FILTER_OPTIONS[number]['key'][]>(
    FILTER_OPTIONS.map((option) => option.key)
  );
  const [editingMeasurement, setEditingMeasurement] = useState<MeasurementEntry | null>(null);
  const [currentDate, setCurrentDate] = useState(() => formatDateKey(new Date()));
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing'>('synced');
  const [surveyPrefill, setSurveyPrefill] = useState<number | null>(null);
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

  const {
    measurements,
    measurementsByDate,
    weeklyLatestInfo,
    currentMeasurement,
    statsCards,
    loadData,
  } = useMeasurementsList({ currentDate, setSyncStatus });

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
  const buildWeekDays = useCallback((baseDate: string) => {
    const today = new Date();
    const todayStr = formatDateKey(today);
    return getWeekDates(baseDate).map((day, index) => {
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
  }, [currentDate, measurementsByDate]);

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
    showProgress: day.hasMeasurement || day.isSelected,
    markerState: day.hasMeasurement ? 'complete' : 'none',
  }))), [weekSets]);
  useEffect(() => {
    const survey = dailySurveyRepository.getSurveyByDate(currentDate);
    setSurveyPrefill(survey?.weight ?? null);
  }, [currentDate]);

  useEffect(() => {
    setTabBarHidden(isModalOpen || isProgressOpen || isFilterOpen);
  }, [isModalOpen, isProgressOpen, isFilterOpen, setTabBarHidden]);

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(FILTER_STORAGE_KEY)
      .then((value) => {
        if (!mounted || !value) return;
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMetricFilter(parsed);
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

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

  const handleOpenProgress = useCallback((card: { key: 'weight' | 'waist' | 'hips' | 'chest' | 'arms' | 'legs' }) => {
    setSelectedMetric(card.key);
    setProgressOpen(true);
  }, []);

  const toggleMetric = useCallback((key: typeof FILTER_OPTIONS[number]['key']) => {
    setDraftFilter((prev) => {
      const next = prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key];
      if (next.length === 0) return prev;
      return next;
    });
  }, []);

  const applyFilter = useCallback(() => {
    if (draftFilter.length === 0) return;
    setMetricFilter(draftFilter);
    AsyncStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(draftFilter)).catch(() => {});
    setFilterOpen(false);
  }, [draftFilter]);

  const filteredStatsCards = useMemo(
    () => statsCards.filter((card) => metricFilter.includes(card.key)),
    [metricFilter, statsCards]
  );

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
          weekSets={calendarWeekSets}
          onOpenCalendar={openCalendar}
          onSelectDay={selectDate}
          weekSwipeAnim={weekSwipeAnim}
          weekPanHandlers={weekPanResponder.panHandlers}
          weekWidth={weekWidth}
          onWeekLayout={setWeekWidth}
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
                <View>
                  <Text
                    style={[
                      styles.weeklyStripCta,
                      weeklyLatestInfo?.isRecent ? styles.weeklyStripCtaComplete : styles.weeklyStripCtaPending,
                    ]}
                  >
                    {weeklyLatestInfo ? `Заполнено • ${weeklyLatestInfo.label}` : 'Нет данных'}
                  </Text>
                </View>
              </View>
              <View
                style={[
                  styles.weeklyAddButton,
                  weeklyLatestInfo?.isRecent ? styles.weeklyAddButtonCheck : styles.weeklyAddButtonIconOnly,
                ]}
              >
                {weeklyLatestInfo?.isRecent ? (
                  <Check size={16} color={colors.primary} />
                ) : (
                  <Plus size={16} color={colors.primary} />
                )}
              </View>
            </View>
          </TouchableOpacity>
          {currentMeasurement ? (
            <View style={styles.weeklyCardWrap}>
              <MeasurementHistoryItem
                item={currentMeasurement}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </View>
          ) : null}
          <View style={styles.listHeader}>
            <View>
              <Text style={styles.sectionTitle}>Замеры</Text>
            </View>
            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => {
                setDraftFilter(metricFilter);
                setFilterOpen(true);
              }}
            >
              <SlidersHorizontal size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <MeasurementStatsGrid statsCards={filteredStatsCards} onCardPress={handleOpenProgress} />
          
        </ScrollView>

        <Modal visible={isCalendarOpen} transparent animationType="fade" onRequestClose={closeCalendar}>
          <Pressable style={styles.calendarBackdrop} onPress={closeCalendar}>
            <Pressable style={styles.calendarCard} onPress={() => {}}>
              <View style={styles.calendarHeader}>
                <TouchableOpacity onPress={() => handleMonthShift(-1)} style={styles.calendarNavButton}>
                  <ChevronLeft size={16} color={colors.textSecondary} />
                </TouchableOpacity>
                <Text style={styles.calendarTitle}>{monthLabel}</Text>
                <TouchableOpacity onPress={() => handleMonthShift(1)} style={styles.calendarNavButton}>
                  <ChevronLeft size={16} color={colors.textSecondary} style={styles.calendarNavNextIcon} />
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
                        selectDate(dateStr);
                        closeCalendar();
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

        <SharedBottomSheet
          visible={isFilterOpen}
          onClose={() => setFilterOpen(false)}
          enableSwipeToDismiss
        >
          <View style={styles.filterSheet}>
            <Text style={styles.filterTitle}>Фильтр замеров</Text>
            {FILTER_OPTIONS.map((option) => {
              const active = draftFilter.includes(option.key);
              return (
                <TouchableOpacity
                  key={option.key}
                  style={[styles.filterRow, active ? styles.filterRowActive : null]}
                  onPress={() => toggleMetric(option.key)}
                >
                  <Text style={styles.filterRowText}>{option.label}</Text>
                  {active ? <Check size={18} color={colors.primary} /> : null}
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity style={styles.filterApplyButton} onPress={applyFilter}>
              <Text style={styles.filterApplyText}>Применить</Text>
            </TouchableOpacity>
          </View>
        </SharedBottomSheet>

        <AddMeasurementModal
          visible={isModalOpen}
          onClose={() => {
            setModalOpen(false);
            setEditingMeasurement(null);
          }}
          onSave={handleSave}
          initialData={editingMeasurement ?? (surveyPrefill != null ? { weight: surveyPrefill } : null)}
        />
        <MeasurementProgressSheet
          visible={isProgressOpen}
          onClose={() => setProgressOpen(false)}
          metricKey={selectedMetric}
          measurements={measurements}
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
    paddingHorizontal: spacing.xl,
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
  sectionChip: {
    alignSelf: 'flex-start',
    backgroundColor: colors.inputBg,
    paddingHorizontal: spacing.xs,
    paddingVertical: 4,
    borderRadius: radii.pill,
    marginTop: spacing.xs,
  },
  sectionChipText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontFamily: fonts.medium,
  },
  listHeader: {
    paddingHorizontal: spacing.xl,
    marginTop: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.pill,
    backgroundColor: colors.inputBg,
  },
  filterButtonText: {
    fontSize: 12,
    fontFamily: fonts.semibold,
    color: colors.textSecondary,
  },
  filterSheet: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
  filterTitle: {
    fontSize: 18,
    fontFamily: fonts.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  filterRow: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.divider,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  filterRowActive: {
    borderColor: `${colors.primary}50`,
    backgroundColor: `${colors.primary}12`,
  },
  filterRowText: {
    fontSize: 15,
    fontFamily: fonts.medium,
    color: colors.textPrimary,
  },
  filterApplyButton: {
    marginTop: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    ...shadows.button,
  },
  filterApplyText: {
    fontSize: 14,
    fontFamily: fonts.semibold,
    color: colors.surface,
  },
  listWrap: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
  },
  addButton: {
    marginTop: spacing.md,
    marginHorizontal: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    alignSelf: 'flex-start',
    ...shadows.button,
  },
  addButtonText: {
    marginLeft: spacing.xs,
    color: colors.surface,
    fontSize: 12,
    fontFamily: fonts.semibold,
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    ...shadows.card,
  },
  emptyText: {
    marginTop: spacing.sm,
    color: colors.textTertiary,
    textAlign: 'center',
    fontFamily: fonts.medium,
  },
  calendarBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  calendarCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: spacing.md,
    ...shadows.card,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  calendarTitle: {
    fontSize: 16,
    fontFamily: fonts.semibold,
    color: colors.textPrimary,
  },
  calendarNavButton: {
    width: 32,
    height: 32,
    borderRadius: radii.pill,
    backgroundColor: colors.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarNavNextIcon: {
    transform: [{ rotate: '180deg' }],
  },
  calendarWeekRow: {
    marginTop: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  calendarWeekLabel: {
    width: 32,
    textAlign: 'center',
    fontSize: 11,
    color: colors.textTertiary,
    fontFamily: fonts.medium,
  },
  calendarGrid: {
    marginTop: spacing.xs,
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
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: `${colors.accentFiber}40`,
  },
  calendarCellToday: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: `${colors.accentFiber}40`,
    backgroundColor: `${colors.accentFiber}40`,
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
    width: 6,
    height: 6,
    borderRadius: radii.pill,
    backgroundColor: colors.accentFiber,
  },
  calendarDotHidden: {
    opacity: 0,
  },
  calendarDotSelected: {
    backgroundColor: colors.surface,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    ...shadows.button,
  },
  primaryButtonText: {
    color: colors.surface,
    fontSize: 12,
    fontFamily: fonts.semibold,
    marginLeft: spacing.xs,
  },
  weeklyStrip: {
    marginTop: spacing.md,
    marginHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    flexDirection: 'column',
    alignItems: 'stretch',
    justifyContent: 'center',
  },
  weeklyStripRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  weeklyStripComplete: {
    backgroundColor: `${colors.accentFiber}18`,
  },
  weeklyStripPending: {
    backgroundColor: `${colors.accentFat}12`,
  },
  weeklyStripLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weeklyStatusDot: {
    width: 10,
    height: 10,
    borderRadius: radii.pill,
    marginRight: spacing.xs,
  },
  weeklyStatusComplete: {
    backgroundColor: colors.accentFiber,
  },
  weeklyStatusPending: {
    backgroundColor: colors.accentFat,
  },
  weeklyStripTitle: {
    color: colors.textPrimary,
    fontSize: 13,
    fontFamily: fonts.semibold,
  },
  weeklyStripCta: {
    marginTop: 2,
    fontSize: 12,
    fontFamily: fonts.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  weeklyStripCtaComplete: {
    color: colors.accentFiber,
  },
  weeklyStripCtaPending: {
    color: '#9A5B00',
  },
  weeklyAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
  },
  weeklyAddButtonIconOnly: {
    width: 38,
    height: 38,
    paddingHorizontal: 0,
    paddingVertical: 0,
    justifyContent: 'center',
  },
  weeklyAddButtonCheck: {
    width: 38,
    height: 38,
    paddingHorizontal: 0,
    paddingVertical: 0,
    justifyContent: 'center',
  },
  weeklyCardWrap: {
    marginTop: spacing.sm,
    marginHorizontal: spacing.xl,
  },
});
