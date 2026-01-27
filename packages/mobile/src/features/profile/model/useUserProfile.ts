import { useCallback, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';

import { api } from '../../../shared/api/client';
import { formatBirthDateDisplay, parseBirthDateDisplay } from '../../../shared/lib/date';

export type GenderKey = 'male' | 'female' | 'other';

type UseUserProfileParams = {
  onTrainerLoaded?: (trainer: any | null) => void;
};

export const useUserProfile = ({ onTrainerLoaded }: UseUserProfileParams = {}) => {
  const [name, setName] = useState('');
  const [gender, setGender] = useState<GenderKey | null>(null);
  const [birthDate, setBirthDate] = useState('');
  const [height, setHeight] = useState('');
  const [telegram, setTelegram] = useState('');
  const [email, setEmail] = useState('');
  const [currentWeight, setCurrentWeight] = useState<number | null>(null);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [isLoading, setLoading] = useState(false);
  const [isAvatarUploading, setAvatarUploading] = useState(false);

  const genderLabel = useMemo(() => {
    if (gender === 'male') return 'Мужской';
    if (gender === 'female') return 'Женский';
    if (gender === 'other') return 'Другое';
    return 'Не указано';
  }, [gender]);

  const applyGender = useCallback((value: string | null | undefined) => {
    const genderValue = String(value ?? '').toLowerCase();
    if (genderValue === 'm' || genderValue === 'male') {
      setGender('male');
    } else if (genderValue === 'f' || genderValue === 'female') {
      setGender('female');
    } else if (genderValue) {
      setGender('other');
    } else {
      setGender(null);
    }
  }, []);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/users/me');
      const data = response.data;
      setName(data.profile?.name ?? '');
      setEmail(data.email ?? '');
      applyGender(data.profile?.gender);
      setBirthDate(formatBirthDateDisplay(data.profile?.birthDate ?? null));
      setHeight(data.profile?.height != null ? String(data.profile.height) : '');
      setCurrentWeight(data.profile?.currentWeight ?? null);
      setTelegram(data.profile?.telegram ?? '');
      setAvatarUri(data.profile?.avatarUrl ?? null);
      if (onTrainerLoaded) {
        onTrainerLoaded(data.trainer ?? null);
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Не удалось загрузить профиль';
      Alert.alert('Ошибка', message);
    } finally {
      setLoading(false);
    }
  }, [applyGender, onTrainerLoaded]);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  const saveProfile = useCallback(async () => {
    if (!name.trim()) {
      Alert.alert('Профиль', 'Введите имя');
      return false;
    }
    if (telegram.trim() && !telegram.trim().startsWith('@')) {
      Alert.alert('Профиль', 'Telegram никнейм должен начинаться с @');
      return false;
    }

    const payload = {
      name: name.trim(),
      gender: gender ?? null,
      birthDate: parseBirthDateDisplay(birthDate),
      height: height ? Number(height) : null,
      telegram: telegram.trim() || null,
      avatarUrl: avatarUri && avatarUri.startsWith('http') ? avatarUri : null,
    };

    if (birthDate.trim() && payload.birthDate === null) {
      Alert.alert('Профиль', 'Дата рождения должна быть в формате ДД.ММ.ГГГГ');
      return false;
    }
    if (payload.height !== null && Number.isNaN(payload.height)) {
      Alert.alert('Профиль', 'Рост должен быть числом');
      return false;
    }

    try {
      const response = await api.put('/users/me/profile', payload);
      const data = response.data;
      setName(data.profile?.name ?? '');
      applyGender(data.profile?.gender);
      setBirthDate(formatBirthDateDisplay(data.profile?.birthDate ?? null));
      setHeight(data.profile?.height != null ? String(data.profile.height) : '');
      setCurrentWeight(data.profile?.currentWeight ?? null);
      setTelegram(data.profile?.telegram ?? '');
      return true;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Не удалось сохранить профиль';
      Alert.alert('Ошибка', message);
      return false;
    }
  }, [applyGender, avatarUri, birthDate, gender, height, name, telegram]);

  const pickAvatar = useCallback(async () => {
    if (isAvatarUploading) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        quality: 0.7,
      });

      if (result.canceled) {
        return;
      }

      const asset = result.assets[0];
      const width = asset.width ?? 0;
      const height = asset.height ?? 0;
      const maxSide = Math.max(width, height);
      let uploadUri = asset.uri;
      if (maxSide > 512 && width && height) {
        try {
          // Lazy require to avoid crashing if the native module is missing in OTA builds
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const ImageManipulator = require('expo-image-manipulator');
          const scale = 512 / maxSide;
          const targetWidth = Math.round(width * scale);
          const targetHeight = Math.round(height * scale);
          const resized = await ImageManipulator.manipulateAsync(
            asset.uri,
            [{ resize: { width: targetWidth, height: targetHeight } }],
            { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
          );
          uploadUri = resized.uri;
        } catch (manipulatorError) {
          console.warn('ImageManipulator is unavailable, using original image', manipulatorError);
        }
      }
      setAvatarUri(uploadUri);

      setAvatarUploading(true);
      const fileName = asset.fileName ?? asset.uri.split('/').pop() ?? 'avatar.jpg';
      const contentType = 'image/jpeg';
      const presign = await api.post('/storage/presign', {
        fileName,
        contentType,
        folder: 'avatars',
      });
      const uploadUrl = presign.data.uploadUrl;
      const publicUrl = presign.data.publicUrl;
      const fileResponse = await fetch(uploadUri);
      const blob = await fileResponse.blob();
      if (blob.size > 4 * 1024 * 1024) {
        throw new Error('FILE_TOO_LARGE');
      }
      await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': contentType },
        body: blob,
      });
      setAvatarUri(publicUrl);
      await api.put('/users/me/profile', {
        name: name.trim() || 'Пользователь',
        gender: gender ?? null,
        birthDate: parseBirthDateDisplay(birthDate),
        height: height ? Number(height) : null,
        telegram: telegram.trim() || null,
        avatarUrl: publicUrl,
      });
    } catch (error: any) {
      if (error instanceof Error && error.message === 'FILE_TOO_LARGE') {
        Alert.alert('Ошибка', 'Фото слишком большое. Максимум 4 МБ.');
        return;
      }
      const rawMessage = error.response?.data?.message || error?.message || 'Не удалось открыть галерею';
      const message = rawMessage.includes('Network request failed')
        ? 'Не удалось загрузить фото. Проверьте доступ к API и хранилищу S3.'
        : rawMessage;
      Alert.alert('Ошибка', message);
    } finally {
      setAvatarUploading(false);
    }
  }, [birthDate, gender, height, isAvatarUploading, name, telegram]);

  return {
    name,
    gender,
    birthDate,
    height,
    currentWeight,
    telegram,
    email,
    avatarUri,
    isLoading,
    isAvatarUploading,
    genderLabel,
    setName,
    setGender,
    setBirthDate,
    setHeight,
    setTelegram,
    setEmail,
    setAvatarUri,
    loadProfile,
    saveProfile,
    pickAvatar,
  };
};
