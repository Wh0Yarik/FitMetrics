import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, Image, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Trash2, Calendar, Ruler } from 'lucide-react-native';
import { useFocusEffect } from 'expo-router';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';

import { measurementsRepository, MeasurementEntry } from '../repositories/MeasurementsRepository';
import { AddMeasurementModal } from '../components/AddMeasurementModal';
import { COLORS } from '../../../constants/Colors';

const MeasurementChip = React.memo(({ label, value }: { label: string; value: string }) => (
  <View style={styles.measureChip}>
    <Text style={styles.measureChipLabel}>{label}</Text>
    <Text style={styles.measureChipValue}>{value}</Text>
  </View>
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

            <View style={styles.headerMetaRow}>
              <View style={[styles.metaChip, { marginRight: 0 }]}>
                <Text style={styles.metaLabel}>Всего записей</Text>
                <Text style={styles.metaValue}>{measurements.length}</Text>
              </View>
            </View>
          </View>
        </View>

        <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 120 }}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>История замеров</Text>
            <View style={styles.sectionChip}>
              <Text style={styles.sectionChipText}>{measurements.length} записей</Text>
            </View>
          </View>

          <View style={styles.listWrap}>
            {measurements.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ruler size={48} color="#D1D5DB" />
                <Text style={styles.emptyText}>История замеров пуста.{'\n'}Добавьте свой первый результат!</Text>
              </View>
            ) : (
              measurements.map((item) => (
                <Swipeable
                  key={item.id}
                  overshootRight={false}
                  rightThreshold={60}
                  dragOffsetFromRightEdge={20}
                  renderRightActions={() => (
                    <View style={styles.swipeActions}>
                      <TouchableOpacity onPress={() => handleEdit(item)} style={[styles.swipeButton, styles.swipeEdit]}>
                        <Text style={styles.swipeText}>Редактировать</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDelete(item.id)} style={[styles.swipeButton, styles.swipeDelete]}>
                        <Text style={[styles.swipeText, styles.swipeDeleteText]}>Удалить</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                >
                  <View style={styles.measureCard}>
                    <View style={styles.measureHeader}>
                      <View style={styles.datePill}>
                        <Calendar size={14} color="#6B7280" />
                        <Text style={styles.dateText}>
                          {new Date(item.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </Text>
                      </View>
                      <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteButton}>
                        <Trash2 size={16} color="#EF4444" />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.measureChips}>
                      {item.weight != null && <MeasurementChip label="Вес" value={`${item.weight} кг`} />}
                      {item.waist != null && <MeasurementChip label="Талия" value={`${item.waist} см`} />}
                      {item.hips != null && <MeasurementChip label="Бедра" value={`${item.hips} см`} />}
                      {item.chest != null && <MeasurementChip label="Грудь" value={`${item.chest} см`} />}
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
              ))
            )}
          </View>
        </ScrollView>

        <TouchableOpacity onPress={() => setModalOpen(true)} style={styles.fab}>
          <Plus size={26} color="white" />
        </TouchableOpacity>

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
    marginBottom: 12,
  },
  datePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  dateText: {
    marginLeft: 6,
    color: '#374151',
    fontSize: 12,
    fontWeight: '600',
  },
  deleteButton: {
    padding: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
  },
  measureChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  measureChip: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  measureChipLabel: {
    fontSize: 10,
    color: '#6B7280',
  },
  measureChipValue: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  photoRow: {
    marginTop: 6,
    flexDirection: 'row',
  },
  photoThumb: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  fab: {
    position: 'absolute',
    bottom: 88,
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    zIndex: 50,
  },
});
