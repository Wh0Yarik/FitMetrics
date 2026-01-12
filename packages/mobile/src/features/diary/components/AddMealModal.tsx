import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <SharedBottomSheet visible={visible} onClose={onClose} headerSwipeHeight={56}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboard}
        >
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              {mode === 'edit' ? 'Редактировать прием пищи' : 'Добавить прием пищи'}
            </Text>
          </View>

          <ScrollView style={styles.modalContent} contentContainerStyle={styles.modalContentBody}>
            <AppInput
              label="Название"
              value={name}
              onChangeText={setName}
              placeholder="Например: Завтрак, яблоко, перекус"
              containerStyle={styles.inputGroup}
            />

            <View style={styles.sectionBlock}>
              <Text style={styles.sectionTitle}>Порции</Text>
              <View style={styles.portionList}>
                {PORTION_TYPES.map((type) => {
                  const count = portions[type.key as keyof PortionCount];
                  return (
                    <View key={type.key} style={styles.portionRow}>
                      <View style={styles.portionLabel}>
                        <View style={[styles.portionDot, { backgroundColor: type.accent }]} />
                        <Text style={styles.portionLabelText}>{type.label}</Text>
                      </View>
                      <View style={styles.stepperControls}>
                        <TouchableOpacity
                          onPress={() => handleDecrement(type.key as keyof PortionCount)}
                          style={styles.stepperButton}
                        >
                          <Minus size={16} color={colors.textSecondary} />
                        </TouchableOpacity>

                        <Text style={styles.stepperCount}>{count}</Text>

                        <TouchableOpacity
                          onPress={() => handleIncrement(type.key as keyof PortionCount)}
                          style={styles.stepperButtonPrimary}
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
    </Modal>
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
  modalContent: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  modalContentBody: {
    paddingBottom: spacing.xl,
  },
  inputGroup: {
    marginBottom: spacing.lg,
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
  stepperButtonPrimary: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperCount: {
    fontSize: 16,
    fontFamily: fonts.semibold,
    color: colors.textPrimary,
    minWidth: 24,
    textAlign: 'center',
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
