import React, { useState, useEffect, useRef, memo } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Animated, Dimensions, StyleSheet, Image } from 'react-native';
import { X, Check, Camera } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { MeasurementEntry } from '../repositories/MeasurementsRepository';
import { COLORS } from '../../../constants/Colors';

interface AddMeasurementModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: Partial<MeasurementEntry>) => void;
  initialData?: MeasurementEntry | null;
}

const InputField = memo(({
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

const PhotoPicker = memo(({
  label,
  uri,
  onPick,
  onClear,
}: {
  label: string;
  uri: string | null;
  onPick: () => void;
  onClear: () => void;
}) => (
  <View style={styles.photoPicker}>
    <Text style={styles.photoLabel}>{label}</Text>
    <TouchableOpacity
      onPress={onPick}
      style={[styles.photoCard, uri ? styles.photoCardActive : styles.photoCardIdle]}
    >
      {uri ? (
        <>
          <Image source={{ uri }} style={styles.photoImage} resizeMode="cover" />
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              onClear();
            }}
            style={styles.photoClear}
          >
            <X size={12} color="#FFFFFF" />
          </TouchableOpacity>
        </>
      ) : (
        <Camera size={22} color="#9CA3AF" />
      )}
    </TouchableOpacity>
  </View>
));

export const AddMeasurementModal: React.FC<AddMeasurementModalProps> = ({ visible, onClose, onSave, initialData }) => {
  // State
  const [weight, setWeight] = useState('');
  const [chest, setChest] = useState('');
  const [waist, setWaist] = useState('');
  const [hips, setHips] = useState('');
  const [leftArm, setLeftArm] = useState('');
  const [rightArm, setRightArm] = useState('');
  const [leftLeg, setLeftLeg] = useState('');
  const [rightLeg, setRightLeg] = useState('');
  
  const [photoFront, setPhotoFront] = useState<string | null>(null);
  const [photoSide, setPhotoSide] = useState<string | null>(null);
  const [photoBack, setPhotoBack] = useState<string | null>(null);

  // Animation
  const screenHeight = Dimensions.get('window').height;
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Reset or Load Data
      if (initialData) {
        setWeight(initialData.weight?.toString() || '');
        setChest(initialData.chest?.toString() || '');
        setWaist(initialData.waist?.toString() || '');
        setHips(initialData.hips?.toString() || '');
        setLeftArm(initialData.leftArm?.toString() || '');
        setRightArm(initialData.rightArm?.toString() || '');
        setLeftLeg(initialData.leftLeg?.toString() || '');
        setRightLeg(initialData.rightLeg?.toString() || '');
        setPhotoFront(initialData.photoFront || null);
        setPhotoSide(initialData.photoSide || null);
        setPhotoBack(initialData.photoBack || null);
      } else {
        setWeight('');
        setChest('');
        setWaist('');
        setHips('');
        setLeftArm('');
        setRightArm('');
        setLeftLeg('');
        setRightLeg('');
        setPhotoFront(null);
        setPhotoSide(null);
        setPhotoBack(null);
      }

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

  const pickImage = async (setter: (uri: string | null) => void) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      setter(result.assets[0].uri);
    }
  };

  const handleSubmit = () => {
    const data: Partial<MeasurementEntry> = {
      weight: parseFloat(weight) || null,
      chest: parseFloat(chest) || null,
      waist: parseFloat(waist) || null,
      hips: parseFloat(hips) || null,
      leftArm: parseFloat(leftArm) || null,
      rightArm: parseFloat(rightArm) || null,
      leftLeg: parseFloat(leftLeg) || null,
      rightLeg: parseFloat(rightLeg) || null,
      photoFront,
      photoSide,
      photoBack,
    };
    onSave(data);
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

            <ScrollView
              className="flex-1 p-4"
              contentContainerStyle={{ paddingBottom: 100 }}
              keyboardShouldPersistTaps="handled"
            >
              
              {/* Основные */}
              <View style={styles.sectionBlock}>
                <Text style={styles.subsectionTitle}>Вес</Text>
                <View style={styles.row}>
                  <InputField value={weight} onChange={setWeight} unit="кг" />
                  <View style={styles.rowSpacer} /> 
                </View>
              </View>

              {/* Объемы */}
              <View style={styles.sectionBlock}>
                <Text style={styles.subsectionTitle}>Объемы</Text>
                <View style={styles.row}>
                  <InputField label="Грудь" value={chest} onChange={setChest} unit="см" />
                  <InputField label="Талия" value={waist} onChange={setWaist} unit="см" />
                  <InputField label="Бедра" value={hips} onChange={setHips} unit="см" />
                </View>
              </View>

              {/* Руки */}
              <View style={styles.subsectionBlock}>
                <Text style={styles.subsectionTitle}>Руки</Text>
                <View style={styles.row}>
                  <InputField label="Левая" value={leftArm} onChange={setLeftArm} unit="см" />
                  <InputField label="Правая" value={rightArm} onChange={setRightArm} unit="см" />
                </View>
              </View>

              {/* Ноги */}
              <View style={styles.subsectionBlock}>
                <Text style={styles.subsectionTitle}>Ноги</Text>
                <View style={styles.row}>
                  <InputField label="Левая" value={leftLeg} onChange={setLeftLeg} unit="см" />
                  <InputField label="Правая" value={rightLeg} onChange={setRightLeg} unit="см" />
                </View>
              </View>

              {/* Фото */}
              <View style={styles.sectionBlock}>
                <Text style={styles.sectionTitle}>Фото прогресса</Text>
                <View style={styles.photoRow}>
                  <PhotoPicker 
                    label="Спереди" 
                    uri={photoFront} 
                    onPick={() => pickImage(setPhotoFront)} 
                    onClear={() => setPhotoFront(null)} 
                  />
                  <PhotoPicker 
                    label="Сбоку" 
                    uri={photoSide} 
                    onPick={() => pickImage(setPhotoSide)} 
                    onClear={() => setPhotoSide(null)} 
                  />
                  <PhotoPicker 
                    label="Сзади" 
                    uri={photoBack} 
                    onPick={() => pickImage(setPhotoBack)} 
                    onClear={() => setPhotoBack(null)} 
                  />
                </View>
              </View>

              {/* Кнопка */}
              <TouchableOpacity onPress={handleSubmit} style={styles.primaryButton}>
                <Check size={20} color="#FFFFFF" />
                <Text style={styles.primaryButtonText}>
                  {initialData ? 'Сохранить' : 'Добавить'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleClose} style={styles.secondaryButton}>
                <X size={18} color="#EF4444" />
                <Text style={styles.secondaryButtonText}>Отмена</Text>
              </TouchableOpacity>
            </ScrollView>
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
  photoPicker: {
    flex: 1,
    alignItems: 'center',
  },
  photoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  photoCard: {
    width: 88,
    height: 120,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  photoCardIdle: {
    backgroundColor: '#F9FAFB',
  },
  photoCardActive: {
    borderColor: '#D1FAE5',
    backgroundColor: '#FFFFFF',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoClear: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    padding: 4,
    borderRadius: 999,
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
