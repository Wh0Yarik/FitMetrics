import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, PixelRatio, useWindowDimensions } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { ChevronLeft, Pencil, Trash2 } from 'lucide-react-native';

import { MealEntry } from '../repositories/DiaryRepository';

type MealItemProps = {
  meal: MealEntry;
  onDelete: (id: string) => void;
  onEdit: (meal: MealEntry) => void;
  showSwipeHint: boolean;
  onFirstSwipe: () => void;
  onSwipeableOpen: (ref: Swipeable | null) => void;
  onSwipeableClose: (ref: Swipeable | null) => void;
};

const MealPortionChip = React.memo((
  { label, value, color, isCompact }: { label: string; value: number; color: string; isCompact: boolean }
) => (
  <View style={[styles.mealChip, isCompact && styles.mealChipCompact, { borderColor: `${color}33` }]}>
    <View style={[styles.mealChipDot, isCompact && styles.mealChipDotCompact, { backgroundColor: color }]} />
    <Text style={[styles.mealChipText, isCompact && styles.mealChipTextCompact]} allowFontScaling={false}>
      {label} {value > 0 ? value : '–'}
    </Text>
  </View>
));

export const MealItem = React.memo(({
  meal,
  onDelete,
  onEdit,
  showSwipeHint,
  onFirstSwipe,
  onSwipeableOpen,
  onSwipeableClose,
}: MealItemProps) => {
  const { width } = useWindowDimensions();
  const fontScale = PixelRatio.getFontScale();
  const isCompact = width <= 360 || fontScale > 1.1;
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
          <TouchableOpacity onPress={handleEdit} style={[styles.swipeButton, styles.swipeEdit, styles.swipeButtonSpacing]}>
            <Pencil size={18} color="#334155" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} style={[styles.swipeButton, styles.swipeDelete]}>
            <Trash2 size={18} color="#DC2626" />
          </TouchableOpacity>
        </View>
      )}
    >
      <View
        style={[styles.mealCard, isCompact && styles.mealCardCompact]}
        onTouchStart={() => {
          if (isOpenRef.current) {
            swipeRef.current?.close();
          }
        }}
      >
        <View style={styles.mealHeader}>
          <View style={[styles.mealTimePill, isCompact && styles.mealTimePillCompact]}>
            <Text style={[styles.mealTimeText, isCompact && styles.mealTimeTextCompact]} allowFontScaling={false}>
              {new Date(meal.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
          <Text style={[styles.mealName, isCompact && styles.mealNameCompact]} numberOfLines={1} ellipsizeMode="tail" allowFontScaling={false}>
            {meal.name}
          </Text>
        </View>

        <View style={styles.mealChipsRow}>
          <MealPortionChip label="Б" value={meal.portions.protein} color="#06B6D4" isCompact={isCompact} />
          <MealPortionChip label="Ж" value={meal.portions.fat} color="#F59E0B" isCompact={isCompact} />
          <MealPortionChip label="У" value={meal.portions.carbs} color="#3B82F6" isCompact={isCompact} />
          <MealPortionChip label="К" value={meal.portions.fiber} color="#50CA64" isCompact={isCompact} />
        </View>

        {showSwipeHint && (
          <View style={styles.swipeHint}>
            <Text style={[styles.swipeHintText, isCompact && styles.swipeHintTextCompact]} allowFontScaling={false}>
              Свайпните
            </Text>
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

const styles = StyleSheet.create({
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
  mealCardCompact: {
    padding: 14,
    borderRadius: 20,
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
  mealTimePillCompact: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 8,
  },
  mealTimeText: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '500',
  },
  mealTimeTextCompact: {
    fontSize: 11,
  },
  mealName: {
    flex: 1,
    color: '#111827',
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 20,
  },
  mealNameCompact: {
    fontSize: 14,
    lineHeight: 18,
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
  mealChipCompact: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  mealChipDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
    marginRight: 6,
  },
  mealChipDotCompact: {
    width: 5,
    height: 5,
    marginRight: 5,
  },
  mealChipText: {
    color: '#374151',
    fontSize: 12,
    fontWeight: '500',
  },
  mealChipTextCompact: {
    fontSize: 11,
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
  swipeHintTextCompact: {
    fontSize: 10,
  },
  swipeHintChevrons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  swipeHintChevron: {
    marginLeft: -6,
  },
  swipeActions: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '88%',
    paddingRight: 12,
    paddingLeft: 12,
    paddingVertical: 0,
  },
  swipeButton: {
    width: 44,
    height: '45%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 0,
  },
  swipeButtonSpacing: {
    marginBottom: 0,
  },
  swipeEdit: {
    borderColor: '#CBD5E1',
  },
  swipeDelete: {
    borderColor: '#FCA5A5',
    backgroundColor: '#FFF1F2',
  },
});
