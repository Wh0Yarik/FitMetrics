import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { removeRefreshToken, removeToken, removeUserId, setRefreshToken, setToken, setUserId } from '../../../shared/lib/storage';
import { setCurrentUserId } from '../../../shared/db/userSession';
import { seedLocalData } from '../../../shared/db/seedLocalData';
import { api } from '../../../shared/api/client';

export const useAuthActions = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentPasswordError, setCurrentPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);

  const handleLogout = useCallback(() => {
    Alert.alert('Выход', 'Вы уверены, что хотите выйти?', [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Выйти', style: 'destructive', onPress: async () => {
        await removeToken();
        await removeRefreshToken();
        await removeUserId();
        setCurrentUserId(null);
        await AsyncStorage.removeItem('userRole');
        router.replace('/auth/login');
      }},
    ]);
  }, []);

  const handleSavePassword = useCallback(async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Смена пароля', 'Заполните все поля');
      return false;
    }
    if (newPassword !== confirmPassword) {
      setConfirmPasswordError('Пароли не совпадают');
      return false;
    }
    try {
      await api.put('/users/me/password', {
        currentPassword,
        newPassword,
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setCurrentPasswordError(null);
      setConfirmPasswordError(null);
      Alert.alert('Готово', 'Пароль обновлен');
      return true;
    } catch (error: any) {
      const message = error.response?.data?.message;
      if (typeof message === 'string' && message.toLowerCase().includes('current password')) {
        setCurrentPasswordError('Неверный пароль');
        return false;
      }
      Alert.alert('Ошибка', message || 'Не удалось обновить пароль');
      return false;
    }
  }, [confirmPassword, currentPassword, newPassword]);

  const handleSeedLocalData = useCallback(() => {
    Alert.alert('Демо-данные', 'Заполнить неделю локальными данными?', [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Заполнить', style: 'default', onPress: () => {
        const result = seedLocalData();
        Alert.alert('Готово', `Добавлено приемов пищи: ${result.mealsAdded}\nАнкет: ${result.surveysSaved}`);
      }},
    ]);
  }, []);

  const handleQuickSwitch = useCallback(async (role: 'admin' | 'trainer' | 'client') => {
    const credentials = {
      admin: { email: 'admin@fitmetrics.com', password: 'admin123' },
      trainer: { email: 'trainer@fitmetrics.com', password: 'trainer123' },
      client: { email: 'client1@fitmetrics.com', password: 'client123' },
    };

    try {
      const response = await api.post('/auth/login', credentials[role]);
      if (response.data.accessToken) {
        await setToken(response.data.accessToken);
        if (response.data.refreshToken) {
          await setRefreshToken(response.data.refreshToken);
        }
        const currentUserId = response.data.user?.id;
        if (currentUserId) {
          await setUserId(currentUserId);
          setCurrentUserId(currentUserId);
        }
        await AsyncStorage.setItem('userRole', response.data.user?.role ?? role.toUpperCase());
        if (role === 'trainer') {
          router.replace('/(trainer)/clients');
        } else {
          router.replace('/(tabs)');
        }
      } else {
        Alert.alert('Ошибка', 'Не удалось получить токен');
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Не удалось переключить пользователя';
      Alert.alert('Ошибка', message);
    }
  }, []);

  return {
    currentPassword,
    newPassword,
    confirmPassword,
    currentPasswordError,
    confirmPasswordError,
    setCurrentPassword,
    setNewPassword,
    setConfirmPassword,
    setCurrentPasswordError,
    setConfirmPasswordError,
    handleLogout,
    handleSavePassword,
    handleSeedLocalData,
    handleQuickSwitch,
  };
};
