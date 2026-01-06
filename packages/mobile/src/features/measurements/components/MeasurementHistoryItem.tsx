import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Calendar, Ruler, Pencil, Trash2 } from 'lucide-react-native';

import { MeasurementEntry } from '../repositories/MeasurementsRepository';

type MeasurementHistoryItemProps = {
  item: MeasurementEntry;
  onEdit: (item: MeasurementEntry) => void;
  onDelete: (id: string) => void;
};

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });

export const MeasurementHistoryItem = React.memo(({
  item,
  onEdit,
  onDelete,
}: MeasurementHistoryItemProps) => {
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

const styles = StyleSheet.create({
  measureCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E6ECEA',
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    marginBottom: 12,
  },
  measureTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  datePill: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  measureDateText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  measureAvatar: {
    width: 36,
    height: 36,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: '#F8FAFC',
  },
  measureAvatarImage: {
    width: '100%',
    height: '100%',
  },
  metricWrap: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  metricRows: {
    gap: 6,
  },
  metricRow: {
    flexDirection: 'row',
  },
  metricRowLabel: {
    fontSize: 13,
    color: '#94A3B8',
  },
  metricRowValue: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '600',
  },
  metricEmpty: {
    fontSize: 13,
    color: '#94A3B8',
  },
  swipeActions: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingRight: 12,
  },
  swipeButton: {
    width: 100,
    height: '47%',
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    gap: 4,
  },
  swipeEdit: {
    borderColor: '#CBD5E1',
  },
  swipeDelete: {
    borderColor: '#FCA5A5',
    backgroundColor: '#FFF1F2',
  },
  swipeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },
  swipeDeleteText: {
    color: '#DC2626',
  },
});
