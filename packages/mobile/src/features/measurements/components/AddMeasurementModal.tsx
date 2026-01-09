import React, { useCallback } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { MeasurementEntry } from '../repositories/MeasurementsRepository';
import { useMeasurementForm } from '../model/useMeasurementForm';
import { usePhotoUpload } from '../model/usePhotoUpload';
import { MeasurementForm } from './MeasurementForm';
import { colors, fonts, spacing } from '../../../shared/ui';
import { SharedBottomSheet } from '../../profile/components/SharedBottomSheet';

interface AddMeasurementModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: Partial<MeasurementEntry>) => void;
  initialData?: Partial<MeasurementEntry> | null;
}


export const AddMeasurementModal: React.FC<AddMeasurementModalProps> = ({ visible, onClose, onSave, initialData }) => {
  const {
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
    setWeight,
    setChest,
    setWaist,
    setHips,
    setLeftArm,
    setRightArm,
    setLeftLeg,
    setRightLeg,
    setPhotoFront,
    setPhotoSide,
    setPhotoBack,
    payload,
  } = useMeasurementForm({ visible, initialData });
  const { pickAndUpload } = usePhotoUpload();

  const handlePickFront = useCallback(() => pickAndUpload(setPhotoFront), [pickAndUpload]);
  const handlePickSide = useCallback(() => pickAndUpload(setPhotoSide), [pickAndUpload]);
  const handlePickBack = useCallback(() => pickAndUpload(setPhotoBack), [pickAndUpload]);
  const handleClearFront = useCallback(() => setPhotoFront(null), []);
  const handleClearSide = useCallback(() => setPhotoSide(null), []);
  const handleClearBack = useCallback(() => setPhotoBack(null), []);

  const requiredFilled = [chest, waist, hips].every((value) => {
    const num = Number(value);
    return value.trim() !== '' && Number.isFinite(num) && num > 0;
  });

  const handleSubmit = () => {
    if (!requiredFilled) return;
    onSave(payload);
    onClose();
  };

  return (
    <SharedBottomSheet visible={visible} onClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboard}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {initialData ? 'Редактировать замер' : 'Новый замер'}
          </Text>
        </View>

        <MeasurementForm
          weight={weight}
          chest={chest}
          waist={waist}
          hips={hips}
          leftArm={leftArm}
          rightArm={rightArm}
          leftLeg={leftLeg}
          rightLeg={rightLeg}
          photoFront={photoFront}
          photoSide={photoSide}
          photoBack={photoBack}
          onChangeWeight={setWeight}
          onChangeChest={setChest}
          onChangeWaist={setWaist}
          onChangeHips={setHips}
          onChangeLeftArm={setLeftArm}
          onChangeRightArm={setRightArm}
          onChangeLeftLeg={setLeftLeg}
          onChangeRightLeg={setRightLeg}
          onPickFront={handlePickFront}
          onPickSide={handlePickSide}
          onPickBack={handlePickBack}
          onClearFront={handleClearFront}
          onClearSide={handleClearSide}
          onClearBack={handleClearBack}
          onSubmit={handleSubmit}
          onCancel={onClose}
          submitLabel={initialData ? 'Сохранить' : 'Добавить'}
          isSubmitDisabled={!requiredFilled}
        />
      </KeyboardAvoidingView>
    </SharedBottomSheet>
  );
};

const styles = StyleSheet.create({
  keyboard: {
    flex: 1,
  },
  header: {
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: fonts.semibold,
    color: colors.textPrimary,
  },
});
