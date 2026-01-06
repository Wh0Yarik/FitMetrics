import React, { useEffect, useRef, useCallback } from 'react';
import { Modal, View, Text, TouchableOpacity, KeyboardAvoidingView, Platform, Animated, Dimensions, StyleSheet } from 'react-native';
import { X } from 'lucide-react-native';
import { MeasurementEntry } from '../repositories/MeasurementsRepository';
import { COLORS } from '../../../constants/Colors';
import { useMeasurementForm } from '../model/useMeasurementForm';
import { usePhotoUpload } from '../model/usePhotoUpload';
import { MeasurementForm } from './MeasurementForm';

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

  // Animation
  const screenHeight = Dimensions.get('window').height;
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      slideAnim.setValue(screenHeight);
      fadeAnim.setValue(0);
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, initialData, screenHeight]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: screenHeight, duration: 300, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => onClose());
  };

  const handlePickFront = useCallback(() => pickAndUpload(setPhotoFront), [pickAndUpload]);
  const handlePickSide = useCallback(() => pickAndUpload(setPhotoSide), [pickAndUpload]);
  const handlePickBack = useCallback(() => pickAndUpload(setPhotoBack), [pickAndUpload]);
  const handleClearFront = useCallback(() => setPhotoFront(null), []);
  const handleClearSide = useCallback(() => setPhotoSide(null), []);
  const handleClearBack = useCallback(() => setPhotoBack(null), []);

  const handleSubmit = () => {
    onSave(payload);
    handleClose();
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
      <Animated.View 
        style={[
          StyleSheet.absoluteFill, 
          { backgroundColor: 'black', opacity: fadeAnim.interpolate({inputRange: [0, 1], outputRange: [0, 0.5]}) }
        ]} 
      >
        <TouchableOpacity style={{flex:1}} onPress={handleClose} activeOpacity={1} />
      </Animated.View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 justify-end"
        pointerEvents="box-none"
      >
        <Animated.View style={{ height: '85%', transform: [{ translateY: slideAnim }] }}>
          <View style={styles.sheet}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>
                {initialData ? 'Редактировать замер' : 'Новый замер'}
              </Text>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <X size={18} color={COLORS.primary} />
              </TouchableOpacity>
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
              onCancel={handleClose}
              submitLabel={initialData ? 'Сохранить' : 'Добавить'}
            />
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  sheet: {
    backgroundColor: '#FFFFFF',
    height: '100%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: '#ECFDF3',
    borderWidth: 1,
    borderColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
