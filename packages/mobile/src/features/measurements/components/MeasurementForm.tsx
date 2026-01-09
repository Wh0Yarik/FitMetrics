import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Check, X } from 'lucide-react-native';

import { PhotoPickerSlot } from './PhotoPickerSlot';
import { colors, fonts, shadows, spacing } from '../../../shared/ui';

type MeasurementFormProps = {
  weight: string;
  chest: string;
  waist: string;
  hips: string;
  leftArm: string;
  rightArm: string;
  leftLeg: string;
  rightLeg: string;
  photoFront: string | null;
  photoSide: string | null;
  photoBack: string | null;
  onChangeWeight: (value: string) => void;
  onChangeChest: (value: string) => void;
  onChangeWaist: (value: string) => void;
  onChangeHips: (value: string) => void;
  onChangeLeftArm: (value: string) => void;
  onChangeRightArm: (value: string) => void;
  onChangeLeftLeg: (value: string) => void;
  onChangeRightLeg: (value: string) => void;
  onPickFront: () => void;
  onPickSide: () => void;
  onPickBack: () => void;
  onClearFront: () => void;
  onClearSide: () => void;
  onClearBack: () => void;
  onSubmit: () => void;
  onCancel: () => void;
  submitLabel: string;
  isSubmitDisabled?: boolean;
};

const InputField = React.memo(({
  label,
  value,
  onChange,
  placeholder = '0.0',
  unit,
}: {
  label: string;
  value: string;
  onChange: (text: string) => void;
  placeholder?: string;
  unit?: string;
}) => (
  <View style={styles.inputField}>
    <Text style={styles.inputLabel}>{label}</Text>
    <View style={styles.pillInputRow}>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        keyboardType="decimal-pad"
        style={styles.pillInputText}
        placeholderTextColor={colors.textTertiary}
      />
      {unit ? <Text style={styles.pillUnit}>{unit}</Text> : null}
    </View>
  </View>
));

export const MeasurementForm = ({
  weight,
  chest,
  waist,
  hips,
  leftArm,
  rightArm,
  leftLeg,
  rightLeg,
  photoFront,
  photoSide,
  photoBack,
  onChangeWeight,
  onChangeChest,
  onChangeWaist,
  onChangeHips,
  onChangeLeftArm,
  onChangeRightArm,
  onChangeLeftLeg,
  onChangeRightLeg,
  onPickFront,
  onPickSide,
  onPickBack,
  onClearFront,
  onClearSide,
  onClearBack,
  onSubmit,
  onCancel,
  submitLabel,
  isSubmitDisabled = false,
}: MeasurementFormProps) => (
  <ScrollView
    className="flex-1 p-4"
    contentContainerStyle={{ paddingBottom: 100 }}
    keyboardShouldPersistTaps="handled"
  >
    <View style={styles.sectionBlock}>
      <Text style={styles.subsectionTitle}>Вес</Text>
      <View style={styles.row}>
        <InputField
          label=""
          value={weight}
          onChange={onChangeWeight}
          unit="кг"
        />
        <View style={styles.rowSpacer} />
      </View>
    </View>

    <View style={styles.sectionBlock}>
      <Text style={styles.subsectionTitle}>Объемы</Text>
      <View style={styles.row}>
        <InputField
          label="Грудь *"
          value={chest}
          onChange={onChangeChest}
          unit="см"
        />
        <InputField
          label="Талия *"
          value={waist}
          onChange={onChangeWaist}
          unit="см"
        />
        <InputField
          label="Бедра *"
          value={hips}
          onChange={onChangeHips}
          unit="см"
        />
      </View>
    </View>

    <View style={styles.subsectionBlock}>
      <Text style={styles.subsectionTitle}>Руки</Text>
      <View style={styles.row}>
        <InputField
          label="Левая"
          value={leftArm}
          onChange={onChangeLeftArm}
          unit="см"
        />
        <InputField
          label="Правая"
          value={rightArm}
          onChange={onChangeRightArm}
          unit="см"
        />
      </View>
    </View>

    <View style={styles.subsectionBlock}>
      <Text style={styles.subsectionTitle}>Ноги</Text>
      <View style={styles.row}>
        <InputField
          label="Левая"
          value={leftLeg}
          onChange={onChangeLeftLeg}
          unit="см"
        />
        <InputField
          label="Правая"
          value={rightLeg}
          onChange={onChangeRightLeg}
          unit="см"
        />
      </View>
    </View>

    <View style={styles.sectionBlock}>
      <Text style={styles.sectionTitle}>Фото прогресса</Text>
      <View style={styles.photoRow}>
        <PhotoPickerSlot
          label="Спереди"
          uri={photoFront}
          onPick={onPickFront}
          onClear={onClearFront}
        />
        <PhotoPickerSlot
          label="Сбоку"
          uri={photoSide}
          onPick={onPickSide}
          onClear={onClearSide}
        />
        <PhotoPickerSlot
          label="Сзади"
          uri={photoBack}
          onPick={onPickBack}
          onClear={onClearBack}
        />
      </View>
    </View>

    <TouchableOpacity
      onPress={onSubmit}
      style={[styles.primaryButton, isSubmitDisabled && styles.primaryButtonDisabled]}
      disabled={isSubmitDisabled}
    >
      <Check size={20} color={colors.surface} />
      <Text style={styles.primaryButtonText}>{submitLabel}</Text>
    </TouchableOpacity>

    <TouchableOpacity onPress={onCancel} style={styles.secondaryButton}>
      <X size={18} color={colors.danger} />
      <Text style={styles.secondaryButtonText}>Отмена</Text>
    </TouchableOpacity>
  </ScrollView>
);

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 15,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  sectionBlock: {
    marginBottom: spacing.md,
  },
  subsectionTitle: {
    fontSize: 20,
    fontFamily: fonts.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  subsectionBlock: {
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  rowSpacer: {
    flex: 1,
  },
  inputField: {
    flex: 1,
    marginRight: spacing.sm,
  },
  inputLabel: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  pillInputRow: {
    backgroundColor: colors.inputBg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
  },
  pillInputText: {
    flex: 1,
    fontSize: 20,
    fontFamily: fonts.semibold,
    color: colors.textPrimary,
  },
  pillUnit: {
    marginLeft: spacing.xs,
    fontSize: 14,
    color: colors.textTertiary,
    fontFamily: fonts.medium,
  },
  photoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
    ...shadows.button,
  },
  primaryButtonDisabled: {
    backgroundColor: colors.textTertiary,
  },
  primaryButtonText: {
    marginLeft: spacing.xs,
    color: colors.surface,
    fontSize: 16,
    fontFamily: fonts.semibold,
  },
  secondaryButton: {
    width: '100%',
    paddingVertical: spacing.sm,
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: `${colors.danger}66`,
    marginBottom: spacing.md,
  },
  secondaryButtonText: {
    marginLeft: spacing.xs,
    color: colors.danger,
    fontSize: 16,
    fontFamily: fonts.semibold,
  },
});
