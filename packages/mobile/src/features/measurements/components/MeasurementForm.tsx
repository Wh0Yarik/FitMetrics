import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Check, X } from 'lucide-react-native';

import { COLORS } from '../../../constants/Colors';
import { PhotoPickerSlot } from './PhotoPickerSlot';

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
        placeholderTextColor="#9CA3AF"
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
          label="Грудь"
          value={chest}
          onChange={onChangeChest}
          unit="см"
        />
        <InputField
          label="Талия"
          value={waist}
          onChange={onChangeWaist}
          unit="см"
        />
        <InputField
          label="Бедра"
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

    <TouchableOpacity onPress={onSubmit} style={styles.primaryButton}>
      <Check size={20} color="#FFFFFF" />
      <Text style={styles.primaryButtonText}>{submitLabel}</Text>
    </TouchableOpacity>

    <TouchableOpacity onPress={onCancel} style={styles.secondaryButton}>
      <X size={18} color="#EF4444" />
      <Text style={styles.secondaryButtonText}>Отмена</Text>
    </TouchableOpacity>
  </ScrollView>
);

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 10,
    marginTop: 6,
  },
  sectionBlock: {
    marginBottom: 16,
  },
  subsectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
    marginTop: 6,
  },
  subsectionBlock: {
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  rowSpacer: {
    flex: 1,
  },
  inputField: {
    flex: 1,
    marginRight: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 6,
  },
  pillInputRow: {
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
  },
  pillInputText: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  pillUnit: {
    marginLeft: 8,
    fontSize: 14,
    color: '#9CA3AF',
  },
  photoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    marginBottom: 24,
  },
  primaryButtonText: {
    marginLeft: 8,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FECACA',
    marginBottom: 16,
  },
  secondaryButtonText: {
    marginLeft: 8,
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
  },
});
