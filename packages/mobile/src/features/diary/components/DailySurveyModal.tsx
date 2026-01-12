import React, { memo, useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AppButton, AppInput, colors, fonts, radii, spacing } from '../../../shared/ui';
import { X } from 'lucide-react-native';
import { DailySurveyData } from '../repositories/DailySurveyRepository';
import { SharedBottomSheet } from '../../profile/components/SharedBottomSheet';

interface DailySurveyModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: DailySurveyData) => void;
  date: string;
  initialData?: DailySurveyData | null;
}

const MOTIVATION_OPTIONS = ['low', 'moderate', 'high'] as const;
const MOTIVATION_LABELS: Record<(typeof MOTIVATION_OPTIONS)[number], string> = {
  low: 'Низкая',
  moderate: 'Умеренная',
  high: 'Высокая',
};
const SLEEP_OPTIONS = ['0-4', '4-6', '6-8', '8+'] as const;
const STRESS_OPTIONS = ['low', 'moderate', 'high'] as const;
const STRESS_LABELS: Record<(typeof STRESS_OPTIONS)[number], string> = {
  low: 'Низкий',
  moderate: 'Умеренный',
  high: 'Высокий',
};
const DIGESTION_OPTIONS = ['0', '1', '2+'] as const;
const DIGESTION_LABELS: Record<(typeof DIGESTION_OPTIONS)[number], string> = {
  '0': '0 раз',
  '1': '1 раз',
  '2+': '2+ раз',
};
const WATER_OPTIONS = ['0-1', '1-2', '2-3', '2+'] as const;
const HUNGER_OPTIONS = ['no_appetite', 'moderate', 'constant'] as const;
const HUNGER_LABELS: Record<(typeof HUNGER_OPTIONS)[number], string> = {
  no_appetite: 'Нет аппетита',
  moderate: 'Умеренно',
  constant: 'Постоянно',
};
const LIBIDO_OPTIONS = ['low', 'moderate', 'high'] as const;
const LIBIDO_LABELS: Record<(typeof LIBIDO_OPTIONS)[number], string> = {
  low: 'Низкое',
  moderate: 'Умеренное',
  high: 'Высокое',
};

// Вспомогательный компонент для группы кнопок выбора
const SelectionGroup = memo(({
  label,
  options,
  value,
  onChange,
  labels,
}: {
  label: string;
  options: readonly string[];
  value: string | null;
  onChange: (val: string) => void;
  labels?: Record<string, string>;
}) => (
  <View style={styles.selectionBlock}>
    <Text style={styles.sectionLabel}>{label}</Text>
    <View style={styles.selectionRow}>
      {options.map((opt) => {
        const isSelected = value === opt;
        return (
          <TouchableOpacity
            key={opt}
            onPress={() => onChange(opt)}
            style={[
              styles.selectionButton,
              isSelected ? styles.selectionButtonActive : null,
            ]}
          >
            <Text style={[styles.selectionText, isSelected ? styles.selectionTextActive : null]}>
              {labels ? labels[opt] : opt}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  </View>
));

export const DailySurveyModal: React.FC<DailySurveyModalProps> = ({
  visible,
  onClose,
  onSave,
  date,
  initialData,
}) => {
  // State
  const [weight, setWeight] = useState('');
  const [motivation, setMotivation] = useState<DailySurveyData['motivation'] | null>(null);
  const [sleep, setSleep] = useState<DailySurveyData['sleep'] | null>(null);
  const [stress, setStress] = useState<DailySurveyData['stress'] | null>(null);
  const [digestion, setDigestion] = useState<DailySurveyData['digestion'] | null>(null);
  const [water, setWater] = useState<DailySurveyData['water'] | null>(null);
  const [hunger, setHunger] = useState<DailySurveyData['hunger'] | null>(null);
  const [libido, setLibido] = useState<DailySurveyData['libido'] | null>(null);
  const [comment, setComment] = useState('');

  // Load initial data if editing
  useEffect(() => {
    if (visible) {
      if (initialData) {
        setWeight(initialData.weight?.toString() || '');
        setMotivation(initialData.motivation);
        setSleep(initialData.sleep);
        setStress(initialData.stress);
        setDigestion(initialData.digestion);
        setWater(initialData.water);
        setHunger(initialData.hunger);
        setLibido(initialData.libido);
        setComment(initialData.comment || '');
      } else {
        // Reset defaults
        setWeight('');
        setMotivation(null);
        setSleep(null);
        setStress(null);
        setDigestion(null);
        setWater(null);
        setHunger(null);
        setLibido(null);
        setComment('');
      }
    }
  }, [visible, initialData]);

  const handleSubmit = () => {
    // Валидация веса
    const weightNum = parseFloat(weight.replace(',', '.'));
    const hasWeight = weight.trim().length > 0;
    const validWeight = (!hasWeight || isNaN(weightNum) || weightNum <= 0)
      ? null
      : parseFloat(weightNum.toFixed(1));

    const surveyData: DailySurveyData = {
      date,
      weight: validWeight,
      motivation,
      sleep,
      stress,
      digestion,
      water,
      hunger,
      libido,
      comment: comment.trim() || undefined,
    };

    onSave(surveyData);
    onClose();
  };

  return (
    <SharedBottomSheet visible={visible} onClose={onClose} headerSwipeHeight={56}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboard}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Анкета</Text>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          <AppInput
            label="Вес (кг)"
            value={weight}
            onChangeText={setWeight}
            placeholder="0.0"
            keyboardType="decimal-pad"
            containerStyle={styles.weightInput}
          />

          <SelectionGroup
            label="Мотивация"
            options={MOTIVATION_OPTIONS}
            labels={MOTIVATION_LABELS}
            value={motivation}
            onChange={setMotivation}
          />

          <SelectionGroup
            label="Сон (часов)"
            options={SLEEP_OPTIONS}
            value={sleep}
            onChange={setSleep}
          />

          <SelectionGroup
            label="Уровень стресса"
            options={STRESS_OPTIONS}
            labels={STRESS_LABELS}
            value={stress}
            onChange={setStress}
          />

          <SelectionGroup
            label="Пищеварение (стул)"
            options={DIGESTION_OPTIONS}
            labels={DIGESTION_LABELS}
            value={digestion}
            onChange={setDigestion}
          />

          <SelectionGroup
            label="Вода (литров)"
            options={WATER_OPTIONS}
            value={water}
            onChange={setWater}
          />

          <SelectionGroup
            label="Чувство голода"
            options={HUNGER_OPTIONS}
            labels={HUNGER_LABELS}
            value={hunger}
            onChange={setHunger}
          />

          <SelectionGroup
            label="Либидо"
            options={LIBIDO_OPTIONS}
            labels={LIBIDO_LABELS}
            value={libido}
            onChange={setLibido}
          />

          <AppInput
            label="Комментарий тренеру (опционально)"
            value={comment}
            onChangeText={setComment}
            placeholder="Напишите, если что-то беспокоит..."
            multiline
            numberOfLines={4}
            containerStyle={styles.commentInput}
            style={styles.commentField}
            textAlignVertical="top"
          />

          <View style={styles.actions}>
            <AppButton title="Сохранить" onPress={handleSubmit} size="md" style={styles.actionButton} />
            <AppButton
              title="Отмена"
              onPress={onClose}
              variant="secondary"
              size="md"
              style={styles.actionButton}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SharedBottomSheet>
  );
};

const styles = StyleSheet.create({
  keyboard: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: fonts.semibold,
    color: colors.textPrimary,
  },
  scroll: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  weightInput: {
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  selectionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.xs,
  },
  selectionButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.divider,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  selectionButtonActive: {
    backgroundColor: `${colors.primary}14`,
    borderColor: `${colors.primary}55`,
  },
  selectionText: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: colors.textPrimary,
  },
  selectionTextActive: {
    color: colors.textPrimary,
  },
  selectionBlock: {
    marginBottom: spacing.lg,
  },
  commentInput: {
    marginBottom: spacing.lg,
  },
  commentField: {
    height: 120,
    paddingTop: spacing.sm,
  },
  actions: {
    gap: spacing.sm,
    paddingBottom: spacing.lg,
  },
  actionButton: {
    width: '100%',
  },
});
