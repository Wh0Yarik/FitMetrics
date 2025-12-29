import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, Image, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Calendar, Ruler } from 'lucide-react-native';
import { useFocusEffect } from 'expo-router';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';

import { measurementsRepository, MeasurementEntry } from '../repositories/MeasurementsRepository';
import { AddMeasurementModal } from '../components/AddMeasurementModal';
import { COLORS } from '../../../constants/Colors';

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });

const MeasurementCard = React.memo(({ label, value }: { label: string; value: string }) => (
  <View style={styles.metricCard}>
    <Text style={styles.metricLabel}>{label}</Text>
    <Text style={styles.metricValue}>{value}</Text>
  </View>
));

const MeasurementItem = React.memo(({
  item,
  onEdit,
  onDelete,
}: {
  item: MeasurementEntry;
  onEdit: (item: MeasurementEntry) => void;
  onDelete: (id: string) => void;
}) => (
  <Swipeable
    overshootRight={false}
    rightThreshold={60}
    dragOffsetFromRightEdge={20}
    renderRightActions={() => (
      <View style={styles.swipeActions}>
        <TouchableOpacity onPress={() => onEdit(item)} style={[styles.swipeButton, styles.swipeEdit]}>
          <Text style={styles.swipeText}>Редактировать</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onDelete(item.id)} style={[styles.swipeButton, styles.swipeDelete]}>
          <Text style={[styles.swipeText, styles.swipeDeleteText]}>Удалить</Text>
        </TouchableOpacity>
      </View>
    )}
  >
    <View style={styles.measureCard}>
      <View style={styles.measureHeader}>
        <View style={styles.datePill}>
          <Calendar size={14} color="#6B7280" />
          <Text style={styles.dateText}>{formatDate(item.date)}</Text>
        </View>
      </View>

      <View style={styles.metricGrid}>
        {item.weight != null && <MeasurementCard label="Вес" value={`${item.weight} кг`} />}
        {item.waist != null && <MeasurementCard label="Талия" value={`${item.waist} см`} />}
        {item.hips != null && <MeasurementCard label="Бедра" value={`${item.hips} см`} />}
        {item.chest != null && <MeasurementCard label="Грудь" value={`${item.chest} см`} />}
      </View>

      {(item.photoFront || item.photoSide || item.photoBack) && (
        <View style={styles.photoRow}>
          {item.photoFront && <Image source={{ uri: item.photoFront }} style={styles.photoThumb} />}
          {item.photoSide && <Image source={{ uri: item.photoSide }} style={styles.photoThumb} />}
          {item.photoBack && <Image source={{ uri: item.photoBack }} style={styles.photoThumb} />}
        </View>
      )}
    </View>
  </Swipeable>
));

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
    paddingVertical: 32,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  emptyText: {
    marginTop: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  measureCard: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    marginBottom: 10,
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
    fontSize: 11,
    fontWeight: '600',
    color: '#111827',
  },
  swipeDeleteText: {
    color: '#EF4444',
  },
  measureHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  datePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  dateText: {
    marginLeft: 6,
    color: '#374151',
    fontSize: 12,
    fontWeight: '600',
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 8,
    marginBottom: 8,
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
  },
  metricLabel: {
    fontSize: 10,
    color: '#6B7280',
  },
  metricValue: {
    marginTop: 3,
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  photoRow: {
    marginTop: 4,
    flexDirection: 'row',
  },
  photoThumb: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
});
