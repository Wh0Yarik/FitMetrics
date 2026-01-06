import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, Alert, StyleSheet, Modal, Pressable, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, ChevronLeft } from 'lucide-react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { measurementsRepository, MeasurementEntry } from '../repositories/MeasurementsRepository';
import { AddMeasurementModal } from '../components/AddMeasurementModal';
import { MeasurementHistoryItem } from '../components/MeasurementHistoryItem';
import { MeasurementStatsGrid } from '../components/MeasurementStatsGrid';
import { useMeasurementsList } from '../model/useMeasurementsList';
import { COLORS } from '../../../constants/Colors';
import { api } from '../../../shared/api/client';
import { dailySurveyRepository } from '../../diary/repositories/DailySurveyRepository';
import { CalendarHeader, CalendarWeekDay } from '../../../shared/components/CalendarHeader';
import { formatDateKey, getWeekDates, getHeaderTitle, getRelativeLabel, WEEKDAY_LABELS } from '../../../shared/lib/date';
import { useWeekCalendar } from '../../../shared/lib/calendar/useWeekCalendar';


export default function MeasurementsScreen() {
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingMeasurement, setEditingMeasurement] = useState<MeasurementEntry | null>(null);
  const [currentDate, setCurrentDate] = useState(() => formatDateKey(new Date()));
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing'>('synced');
  const [surveyPrefill, setSurveyPrefill] = useState<number | null>(null);
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

  const {
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
  useEffect(() => {
    const survey = dailySurveyRepository.getSurveyByDate(currentDate);
    setSurveyPrefill(survey?.weight ?? null);
  }, [currentDate]);

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
          onOpenCalendar={openCalendar}
          onSelectDay={selectDate}
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
              <MeasurementHistoryItem
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

          <MeasurementStatsGrid statsCards={statsCards} />
          
        </ScrollView>

        <Modal visible={isCalendarOpen} transparent animationType="fade" onRequestClose={closeCalendar}>
          <Pressable style={styles.calendarBackdrop} onPress={closeCalendar}>
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
});
