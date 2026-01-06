import { useCallback, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';

import { api } from '../../../shared/api/client';

export type GenderKey = 'male' | 'female' | 'other';

type UseUserProfileParams = {
  onTrainerLoaded?: (trainer: any | null) => void;
};

export const useUserProfile = ({ onTrainerLoaded }: UseUserProfileParams = {}) => {
  const [name, setName] = useState('');
  const [gender, setGender] = useState<GenderKey | null>(null);
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [telegram, setTelegram] = useState('');
  const [email, setEmail] = useState('');
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
      setAge(data.profile?.age != null ? String(data.profile.age) : '');
      setHeight(data.profile?.height != null ? String(data.profile.height) : '');
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
      age: age ? Number(age) : null,
      height: height ? Number(height) : null,
      telegram: telegram.trim() || null,
      avatarUrl: avatarUri && avatarUri.startsWith('http') ? avatarUri : null,
    };

    if (payload.age !== null && Number.isNaN(payload.age)) {
      Alert.alert('Профиль', 'Возраст должен быть числом');
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
      setAge(data.profile?.age != null ? String(data.profile.age) : '');
      setHeight(data.profile?.height != null ? String(data.profile.height) : '');
      setTelegram(data.profile?.telegram ?? '');
      Alert.alert('Готово', 'Профиль обновлен');
      return true;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Не удалось сохранить профиль';
      Alert.alert('Ошибка', message);
      return false;
    }
  }, [age, applyGender, avatarUri, gender, height, name, telegram]);

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
      setAvatarUri(asset.uri);

      setAvatarUploading(true);
      const fileName = asset.fileName ?? asset.uri.split('/').pop() ?? 'avatar.jpg';
      const contentType = asset.mimeType ?? 'image/jpeg';
      const presign = await api.post('/storage/presign', {
        fileName,
        contentType,
        folder: 'avatars',
      });
      const uploadUrl = presign.data.uploadUrl;
      const publicUrl = presign.data.publicUrl;
      const fileResponse = await fetch(asset.uri);
      const blob = await fileResponse.blob();
      await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': contentType },
        body: blob,
      });
      setAvatarUri(publicUrl);
      await api.put('/users/me/profile', {
        name: name.trim() || 'Пользователь',
        gender: gender ?? null,
        age: age ? Number(age) : null,
        height: height ? Number(height) : null,
        telegram: telegram.trim() || null,
        avatarUrl: publicUrl,
      });
    } catch (error: any) {
      const rawMessage = error.response?.data?.message || error?.message || 'Не удалось открыть галерею';
      const message = rawMessage.includes('Network request failed')
        ? 'Не удалось загрузить фото. Проверьте доступ к API и хранилищу S3.'
        : rawMessage;
      Alert.alert('Ошибка', message);
    } finally {
      setAvatarUploading(false);
    }
  }, [age, gender, height, isAvatarUploading, name, telegram]);

  return {
    name,
    gender,
    age,
    height,
    telegram,
    email,
    avatarUri,
    isLoading,
    isAvatarUploading,
    genderLabel,
    setName,
    setGender,
    setAge,
    setHeight,
    setTelegram,
    setEmail,
    setAvatarUri,
    loadProfile,
    saveProfile,
    pickAvatar,
  };
};
