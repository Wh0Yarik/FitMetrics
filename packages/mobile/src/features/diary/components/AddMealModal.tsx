import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, PixelRatio, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { Minus, Plus, X } from 'lucide-react-native';
import { AppButton, AppInput, colors, fonts, radii, spacing } from '../../../shared/ui';
import { SharedBottomSheet } from '../../profile/components/SharedBottomSheet';

// Типы порций (можно вынести в shared/types)
export interface PortionCount {
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
}

interface AddMealModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (name: string, portions: PortionCount) => void;
  nextMealNumber?: number;
  mode?: 'create' | 'edit';
  initialName?: string;
  initialPortions?: PortionCount;
}

const PORTION_TYPES = [
  { key: 'protein', label: 'Белки', accent: colors.accentProtein },
  { key: 'fat', label: 'Жиры', accent: colors.accentFat },
  { key: 'carbs', label: 'Углеводы', accent: colors.accentCarbs },
  { key: 'fiber', label: 'Клетчатка', accent: colors.accentFiber },
];

export const AddMealModal: React.FC<AddMealModalProps> = ({
  visible,
  onClose,
  onSave,
  nextMealNumber = 1,
  mode = 'create',
  initialName,
  initialPortions,
}) => {
  const { width } = useWindowDimensions();
  const fontScale = PixelRatio.getFontScale();
  const isCompact = width <= 360 || fontScale > 1.1;
  const [name, setName] = useState('');
  const [portions, setPortions] = useState<PortionCount>({ protein: 0, fat: 0, carbs: 0, fiber: 0 });

  useEffect(() => {
    if (visible) {
      // Reset or prefill state
      setName(initialName ?? '');
      setPortions(initialPortions ?? { protein: 0, fat: 0, carbs: 0, fiber: 0 });
    }
  }, [visible, initialName, initialPortions]);

  const handleIncrement = (key: keyof PortionCount) => {
    setPortions(prev => ({ ...prev, [key]: prev[key] + 1 }));
  };

  const handleDecrement = (key: keyof PortionCount) => {
    setPortions(prev => ({ ...prev, [key]: Math.max(0, prev[key] - 1) }));
  };

  const handleSubmit = () => {
    let finalName = name.trim();
    if (!finalName) {
      finalName = mode === 'create' ? `Прием пищи №${nextMealNumber}` : 'Прием пищи';
    }

    const totalPortions = portions.protein + portions.fat + portions.carbs + portions.fiber;
    if (totalPortions === 0) {
      Alert.alert('Ошибка', 'Укажите хотя бы одну порцию');
      return;
    }

    onSave(finalName, portions);
    onClose();
  };

  return (
    <SharedBottomSheet visible={visible} onClose={onClose} headerSwipeHeight={56}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboard}
      >
        <View style={styles.header}>
          <Text style={[styles.headerTitle, isCompact && styles.headerTitleCompact]} allowFontScaling={false}>
            {mode === 'edit' ? 'Редактировать прием пищи' : 'Добавить прием пищи'}
          </Text>
        </View>

        <ScrollView
          style={[styles.modalContent, isCompact && styles.modalContentCompact]}
          contentContainerStyle={styles.modalContentBody}
        >
          <AppInput
            label="Название"
            value={name}
            onChangeText={setName}
            placeholder="Например: Завтрак, яблоко, перекус"
            containerStyle={styles.inputGroup}
            labelAllowFontScaling={false}
            inputAllowFontScaling={false}
            labelStyle={isCompact ? styles.inputLabelCompact : undefined}
            style={isCompact ? styles.inputFieldCompact : undefined}
          />

          <View style={styles.sectionBlock}>
            <Text style={[styles.sectionTitle, isCompact && styles.sectionTitleCompact]} allowFontScaling={false}>
              Порции
            </Text>
            <View style={styles.portionList}>
              {PORTION_TYPES.map((type) => {
                const count = portions[type.key as keyof PortionCount];
                return (
                  <View key={type.key} style={[styles.portionRow, isCompact && styles.portionRowCompact]}>
                    <View style={styles.portionLabel}>
                      <View style={[styles.portionDot, { backgroundColor: type.accent }]} />
                      <Text style={[styles.portionLabelText, isCompact && styles.portionLabelTextCompact]} allowFontScaling={false}>
                        {type.label}
                      </Text>
                    </View>
                    <View style={styles.stepperControls}>
                      <TouchableOpacity
                        onPress={() => handleDecrement(type.key as keyof PortionCount)}
                        style={[styles.stepperButton, isCompact && styles.stepperButtonCompact]}
                      >
                        <Minus size={16} color={colors.textSecondary} />
                      </TouchableOpacity>

                      <Text style={[styles.stepperCount, isCompact && styles.stepperCountCompact]} allowFontScaling={false}>
                        {count}
                      </Text>

                      <TouchableOpacity
                        onPress={() => handleIncrement(type.key as keyof PortionCount)}
                        style={[styles.stepperButtonPrimary, isCompact && styles.stepperButtonPrimaryCompact]}
                      >
                        <Plus size={16} color={colors.surface} />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          <View style={styles.actions}>
            <AppButton
              title={mode === 'edit' ? 'Сохранить' : 'Добавить'}
              onPress={handleSubmit}
              size="md"
              style={styles.actionButton}
            />
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
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.sm,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: fonts.semibold,
    color: colors.textPrimary,
  },
  headerTitleCompact: {
    fontSize: 14,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: spacing.sm,
  },
  modalContentCompact: {
    paddingHorizontal: spacing.xs,
  },
  modalContentBody: {
    paddingBottom: spacing.xl,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  inputLabelCompact: {
    fontSize: 11,
  },
  inputFieldCompact: {
    height: 46,
    fontSize: 14,
  },
  sectionBlock: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  sectionTitleCompact: {
    fontSize: 11,
  },
  portionList: {
    gap: spacing.sm,
  },
  portionRow: {
    width: '100%',
    borderRadius: radii.input,
    backgroundColor: colors.inputBg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  portionRowCompact: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  portionLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  portionDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
    marginRight: spacing.xs,
  },
  portionLabelText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.textPrimary,
  },
  portionLabelTextCompact: {
    fontSize: 12,
  },
  stepperControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  stepperButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.divider,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperButtonCompact: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  stepperButtonPrimary: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperButtonPrimaryCompact: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  stepperCount: {
    fontSize: 16,
    fontFamily: fonts.semibold,
    color: colors.textPrimary,
    minWidth: 24,
    textAlign: 'center',
  },
  stepperCountCompact: {
    fontSize: 14,
    minWidth: 20,
  },
  actions: {
    marginTop: spacing.lg,
    gap: spacing.sm,
    paddingBottom: spacing.lg,
  },
  actionButton: {
    width: '100%',
  },
});
