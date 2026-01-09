import React, { useRef } from 'react';
import { Animated, Dimensions, Pressable, View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Calendar, Ruler, Pencil, Trash2 } from 'lucide-react-native';

import { MeasurementEntry } from '../repositories/MeasurementsRepository';
import { colors, fonts, radii, shadows, spacing } from '../../../shared/ui';

type MeasurementHistoryItemProps = {
  item: MeasurementEntry;
  onEdit: (item: MeasurementEntry) => void;
  onDelete: (id: string) => void;
};

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });

const BENTO_SIZE = Math.round((Dimensions.get('window').width - spacing.xl * 2 - spacing.md) / 2);
const ACTION_BUTTON_SIZE = Math.round((BENTO_SIZE / 2)- spacing.xs);

export const MeasurementHistoryItem = React.memo(({
  item,
  onEdit,
  onDelete,
}: MeasurementHistoryItemProps) => {
  const swipeRef = useRef<Swipeable>(null);
  const isOpenRef = useRef(false);
  const hintTranslateX = useRef(new Animated.Value(0)).current;
  const previewPhotos = [item.photoFront, item.photoSide, item.photoBack].filter(Boolean) as string[];

  const metrics = [
    { key: 'weight', label: 'Вес', value: item.weight, unit: 'кг', accent: colors.accentFiber },
    { key: 'waist', label: 'Талия', value: item.waist, unit: 'см', accent: colors.accentCarbs },
    { key: 'hips', label: 'Бедра', value: item.hips, unit: 'см', accent: colors.accentFat },
    { key: 'chest', label: 'Грудь', value: item.chest, unit: 'см', accent: colors.accentProtein },
  ].filter((metric) => metric.value != null);

  const handleEdit = () => {
    swipeRef.current?.close();
    onEdit(item);
  };

  const handleDelete = () => {
    swipeRef.current?.close();
    onDelete(item.id);
  };

  const playSwipeHint = () => {
    if (isOpenRef.current) {
      swipeRef.current?.close();
    }
    hintTranslateX.stopAnimation();
    Animated.sequence([
      Animated.timing(hintTranslateX, {
        toValue: -16,
        duration: 140,
        useNativeDriver: true,
      }),
      Animated.timing(hintTranslateX, {
        toValue: 0,
        duration: 160,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <Swipeable
      ref={swipeRef}
      overshootRight={false}
      rightThreshold={60}
      dragOffsetFromRightEdge={20}
      onSwipeableOpen={() => {
        isOpenRef.current = true;
      }}
      onSwipeableClose={() => {
        isOpenRef.current = false;
      }}
      renderRightActions={() => (
        <View style={styles.swipeActions}>
          <TouchableOpacity onPress={handleEdit} style={[styles.swipeButton, styles.swipeEdit]}>
            <Pencil size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} style={[styles.swipeButton, styles.swipeDelete]}>
            <Trash2 size={22} color={colors.danger} />
          </TouchableOpacity>
        </View>
      )}
    >
      <Pressable
        onLongPress={playSwipeHint}
        delayLongPress={350}
        onPressIn={() => {
          if (isOpenRef.current) {
            swipeRef.current?.close();
          }
        }}
      >
        <Animated.View style={[styles.measureCard, { transform: [{ translateX: hintTranslateX }] }]}>
        <View style={styles.headerRow}>
          <View style={styles.headerDatePill}>
            <Calendar size={14} color={colors.textSecondary} />
            <Text style={styles.headerDateText}>{formatDate(item.date)}</Text>
          </View>
          {previewPhotos.length > 0 ? (
            <View style={styles.photoStack}>
              {previewPhotos.slice(0, 3).map((uri) => (
                <Image key={uri} source={{ uri }} style={styles.photoThumb} />
              ))}
            </View>
          ) : (
            <View style={styles.photoEmpty}>
              <Ruler size={18} color={colors.textTertiary} />
            </View>
          )}
        </View>

        {metrics.length > 0 ? (
          <View style={styles.metricsGrid}>
            {metrics.map((metric) => (
              <View key={metric.key} style={styles.metricChip}>
                <View style={[styles.metricAccent, { backgroundColor: `${metric.accent}66` }]} />
                <View style={styles.metricContent}>
                  <Text style={styles.metricChipLabel}>{metric.label}</Text>
                  <Text style={styles.metricChipValue}>{metric.value} {metric.unit}</Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.metricEmpty}>Нет данных</Text>
        )}
        </Animated.View>
      </Pressable>
    </Swipeable>
  );
});

const styles = StyleSheet.create({
  measureCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 24,
    marginBottom: spacing.sm,
    minHeight: BENTO_SIZE,
    borderWidth: 1,
    borderColor: colors.divider,
    ...shadows.card,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerDatePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.pill,
    backgroundColor: '#ECFDF3',
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  headerDateText: {
    fontSize: 13,
    fontFamily: fonts.semibold,
    color: colors.textPrimary,
  },
  photoStack: {
    flexDirection: 'row',
    gap: 6,
  },
  photoThumb: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.inputBg,
  },
  photoEmpty: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.divider,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.inputBg,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  metricChip: {
    width: '48%',
    minWidth: 0,
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingVertical: spacing.xs,
    paddingRight: spacing.xs,
    paddingLeft: spacing.sm,
    borderWidth: 1,
    borderColor: colors.divider,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metricAccent: {
    width: 4,
    alignSelf: 'stretch',
    borderRadius: radii.pill,
  },
  metricContent: {
    flex: 1,
    minWidth: 0,
  },
  metricChipLabel: {
    fontSize: 10,
    fontFamily: fonts.medium,
    color: colors.textTertiary,
  },
  metricChipValue: {
    marginTop: 2,
    fontSize: 13,
    fontFamily: fonts.semibold,
    color: colors.textPrimary,
  },
  metricEmpty: {
    fontSize: 13,
    color: colors.textSecondary,
    fontFamily: fonts.medium,
  },
  swipeActions: {
    flexDirection: 'column',
    justifyContent: 'flex-start',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  swipeButton: {
    width: ACTION_BUTTON_SIZE,
    height: ACTION_BUTTON_SIZE,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    ...shadows.card,
  },
  swipeEdit: {
    backgroundColor: colors.surface,
  },
  swipeDelete: {
    backgroundColor: colors.dangerLight,
  },
});
