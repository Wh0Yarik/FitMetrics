import React, { useState, useEffect, useRef } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Animated, Dimensions, StyleSheet, Image, Alert } from 'react-native';
import { X, Check, Camera, Trash2 } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { MeasurementEntry } from '../repositories/MeasurementsRepository';

interface AddMeasurementModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: Partial<MeasurementEntry>) => void;
  initialData?: MeasurementEntry | null;
}

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

  const InputField = ({ label, value, onChange, placeholder = "0.0" }: any) => (
    <View className="flex-1 mb-4">
      <Text className="text-sm font-medium text-gray-700 mb-1">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        keyboardType="decimal-pad"
        className="bg-white p-3 rounded-xl border border-gray-200 text-gray-900"
      />
    </View>
  );

  const PhotoPicker = ({ label, uri, onPick, onClear }: any) => (
    <View className="flex-1 items-center">
      <Text className="text-sm font-medium text-gray-700 mb-2">{label}</Text>
      <TouchableOpacity 
        onPress={onPick}
        className={`w-24 h-32 rounded-xl border-2 border-dashed ${uri ? 'border-green-500 bg-white' : 'border-gray-300 bg-gray-50'} items-center justify-center overflow-hidden relative`}
      >
        {uri ? (
          <>
            <Image source={{ uri }} className="w-full h-full" resizeMode="cover" />
            <TouchableOpacity 
              onPress={(e) => { e.stopPropagation(); onClear(); }}
              className="absolute top-1 right-1 bg-black/50 p-1 rounded-full"
            >
              <X size={12} color="white" />
            </TouchableOpacity>
          </>
        ) : (
          <Camera size={24} color="#9CA3AF" />
        )}
      </TouchableOpacity>
    </View>
  );

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
          <View className="bg-gray-50 h-full rounded-t-3xl overflow-hidden">
            <View className="flex-row justify-between items-center p-4 bg-white border-b border-gray-100">
              <Text className="text-xl font-bold text-gray-900">Новый замер</Text>
              <TouchableOpacity onPress={handleClose} className="p-2 bg-gray-100 rounded-full">
                <X size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 p-4" contentContainerStyle={{ paddingBottom: 100 }}>
              
              {/* Основные */}
              <Text className="text-lg font-bold text-gray-900 mb-3">Основные</Text>
              <View className="flex-row gap-4">
                <InputField label="Вес (кг)" value={weight} onChange={setWeight} />
                <View className="flex-1" /> 
              </View>

              {/* Объемы */}
              <Text className="text-lg font-bold text-gray-900 mb-3 mt-2">Объемы (см)</Text>
              <View className="flex-row gap-4">
                <InputField label="Грудь" value={chest} onChange={setChest} />
                <InputField label="Талия" value={waist} onChange={setWaist} />
                <InputField label="Бедра" value={hips} onChange={setHips} />
              </View>

              {/* Руки */}
              <Text className="text-sm font-semibold text-gray-500 mb-2 mt-1">Руки</Text>
              <View className="flex-row gap-4">
                <InputField label="Левая" value={leftArm} onChange={setLeftArm} />
                <InputField label="Правая" value={rightArm} onChange={setRightArm} />
              </View>

              {/* Ноги */}
              <Text className="text-sm font-semibold text-gray-500 mb-2 mt-1">Ноги</Text>
              <View className="flex-row gap-4">
                <InputField label="Левая" value={leftLeg} onChange={setLeftLeg} />
                <InputField label="Правая" value={rightLeg} onChange={setRightLeg} />
              </View>

              {/* Фото */}
              <Text className="text-lg font-bold text-gray-900 mb-3 mt-4">Фото прогресса</Text>
              <View className="flex-row justify-between gap-2">
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

              {/* Кнопка */}
              <TouchableOpacity 
                onPress={handleSubmit}
                className="bg-green-600 py-3 rounded-xl flex-row justify-center items-center shadow-sm active:bg-green-700 mt-8 mb-6"
              >
                <Check size={20} color="white" />
                <Text className="text-white font-bold text-lg ml-2">Сохранить</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};