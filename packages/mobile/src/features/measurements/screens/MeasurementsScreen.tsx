import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, Image, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Calendar, Ruler, Pencil, Trash2 } from 'lucide-react-native';
import { useFocusEffect } from 'expo-router';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';

import { measurementsRepository, MeasurementEntry } from '../repositories/MeasurementsRepository';
import { AddMeasurementModal } from '../components/AddMeasurementModal';
import { COLORS } from '../../../constants/Colors';

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
            <Text style={styles.dateText}>{formatDate(item.date)}</Text>
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

  const loadData = useCallback(() => {
    const data = measurementsRepository.getAllMeasurements();
    setMeasurements(data);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleSave = (data: Partial<MeasurementEntry>) => {
    const today = new Date().toISOString().split('T')[0];
    measurementsRepository.saveMeasurement({
      ...data,
      id: editingMeasurement?.id,
      date: editingMeasurement?.date ?? today,
    });
    setEditingMeasurement(null);
    setModalOpen(false);
    loadData();
  };

  const handleEdit = (item: MeasurementEntry) => {
    setEditingMeasurement(item);
    setModalOpen(true);
  };

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

        <View style={styles.headerWrap}>
          <View style={styles.headerCard}>
            <Text style={styles.headerKicker}>Прогресс</Text>
            <Text style={styles.headerTitle}>Замеры тела</Text>
            <Text style={styles.headerSubtitle}>Отслеживайте изменения и форму</Text>

            
            {measurements.length > 0 && (
              <View style={styles.headerHintRow}>
                <Text style={styles.headerHintLabel}>Последний замер</Text>
                <Text style={styles.headerHintValue}>{formatDate(measurements[0].date)}</Text>
              </View>
            )}
          </View>
        </View>

        <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 120 }}>
          <View style={styles.listHeader}>
            <View>
              <Text style={styles.sectionTitle}>История замеров</Text>
              <View style={styles.sectionChip}>
                <Text style={styles.sectionChipText}>{measurements.length} записей</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => setModalOpen(true)} style={styles.primaryButton}>
              <Plus size={16} color="white" />
              <Text style={styles.primaryButtonText}>Добавить</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.listWrap}>
            {measurements.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ruler size={48} color="#D1D5DB" />
                <Text style={styles.emptyText}>История замеров пуста.{'\n'}Добавьте свой первый результат!</Text>
              </View>
            ) : (
              measurements.map((item) => (
                <MeasurementItem key={item.id} item={item} onEdit={handleEdit} onDelete={handleDelete} />
              ))
            )}
          </View>
        </ScrollView>

        <AddMeasurementModal
          visible={isModalOpen}
          onClose={() => {
            setModalOpen(false);
            setEditingMeasurement(null);
          }}
          onSave={handleSave}
          initialData={editingMeasurement}
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
  headerWrap: {
    paddingHorizontal: 24,
    paddingTop: 8,
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
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },
  headerSubtitle: {
    marginTop: 6,
    color: '#6B7280',
    fontSize: 13,
  },
  headerHintRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  headerHintLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
  },
  headerHintValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
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
  listWrap: {
    paddingHorizontal: 24,
    paddingTop: 12,
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
  dateText: {
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
});
