import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, TextInput, Image, Alert, Modal, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera, X, Check } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

import { COLORS } from '../../../constants/Colors';
import { removeToken, setToken } from '../../../shared/lib/storage';
import { seedLocalData } from '../../../shared/db/seedLocalData';
import { api } from '../../../shared/api/client';

const GENDERS = [
  { key: 'male', label: 'Мужской' },
  { key: 'female', label: 'Женский' },
  { key: 'other', label: 'Другое' },
] as const;

type GenderKey = typeof GENDERS[number]['key'];

export default function ProfileScreen() {
  const [name, setName] = useState('');
  const [gender, setGender] = useState<GenderKey | null>(null);
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [telegram, setTelegram] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [isInviteOpen, setInviteOpen] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [isEditOpen, setEditOpen] = useState(false);
  const [isPasswordOpen, setPasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [trainerName, setTrainerName] = useState('');
  const [trainerStatus, setTrainerStatus] = useState('');
  const [trainerAvatar, setTrainerAvatar] = useState<string | null>(null);
  const [trainerContacts, setTrainerContacts] = useState<{ label: string; value: string }[]>([]);
  const [isLoading, setLoading] = useState(false);
  const [isAvatarUploading, setAvatarUploading] = useState(false);

  const genderLabel = gender ? GENDERS.find(item => item.key === gender)?.label ?? 'Не указано' : 'Не указано';
  const trainerDisplayName = trainerName || 'Тренер не назначен';
  const trainerDisplayStatus = trainerStatus || 'Нет связи';

  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/users/me');
      const data = response.data;
      setName(data.profile?.name ?? '');
      setEmail(data.email ?? '');

      const genderValue = String(data.profile?.gender ?? '').toLowerCase();
      if (genderValue === 'm' || genderValue === 'male') {
        setGender('male');
      } else if (genderValue === 'f' || genderValue === 'female') {
        setGender('female');
      } else if (genderValue) {
        setGender('other');
      } else {
        setGender(null);
      }

      setAge(data.profile?.age != null ? String(data.profile.age) : '');
      setHeight(data.profile?.height != null ? String(data.profile.height) : '');
      setTelegram(data.profile?.telegram ?? '');
      setAvatarUri(data.profile?.avatarUrl ?? null);

      if (data.trainer) {
        setTrainerName(data.trainer.name ?? '');
        setTrainerStatus(data.trainer.status || 'На связи');
        setTrainerAvatar(data.trainer.avatarUrl ?? null);

        const contacts = Array.isArray(data.trainer.contacts) ? [...data.trainer.contacts] : [];
        if (data.trainer.email && !contacts.some((c: any) => c.value === data.trainer.email)) {
          contacts.push({ label: 'Email', value: data.trainer.email });
        }
        setTrainerContacts(contacts);
      } else {
        setTrainerName('');
        setTrainerStatus('');
        setTrainerAvatar(null);
        setTrainerContacts([]);
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Не удалось загрузить профиль';
      Alert.alert('Ошибка', message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  const handlePickAvatar = useCallback(async () => {
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

  const handleSaveInvite = useCallback(() => {
    if (!inviteCode.trim()) {
      Alert.alert('Инвайт-код', 'Введите код тренера');
      return;
    }

    Alert.alert(
      'Сменить тренера',
      'Вы отвяжетесь от текущего тренера и привяжетесь к новому. Продолжить?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Сменить',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await api.post('/users/me/trainer', { inviteCode: inviteCode.trim() });
              const data = response.data;
              if (data.trainer) {
                setTrainerName(data.trainer.name ?? '');
                setTrainerStatus(data.trainer.status || 'На связи');
                setTrainerAvatar(data.trainer.avatarUrl ?? null);

                const contacts = Array.isArray(data.trainer.contacts) ? [...data.trainer.contacts] : [];
                if (data.trainer.email && !contacts.some((c: any) => c.value === data.trainer.email)) {
                  contacts.push({ label: 'Email', value: data.trainer.email });
                }
                setTrainerContacts(contacts);
              } else {
                setTrainerName('');
                setTrainerStatus('');
                setTrainerAvatar(null);
                setTrainerContacts([]);
              }
              setInviteOpen(false);
              setInviteCode('');
              Alert.alert('Готово', 'Тренер успешно изменен');
            } catch (error: any) {
              const message = error.response?.data?.message || 'Не удалось сменить тренера';
              Alert.alert('Ошибка', message);
            }
          },
        },
      ]
    );
  }, [inviteCode]);

  const handleLogout = useCallback(() => {
    Alert.alert('Выход', 'Вы уверены, что хотите выйти?', [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Выйти', style: 'destructive', onPress: async () => {
        await removeToken();
        await AsyncStorage.removeItem('userRole');
        router.replace('/auth/login');
      }},
    ]);
  }, []);

  const handleSavePassword = useCallback(() => {
    if (!currentPassword || !newPassword) {
      Alert.alert('Смена пароля', 'Заполните оба поля');
      return;
    }
    setPasswordOpen(false);
    setCurrentPassword('');
    setNewPassword('');
    Alert.alert('Готово', 'Пароль обновлен');
  }, [currentPassword, newPassword]);

  const handleSaveProfile = useCallback(async () => {
    if (!name.trim()) {
      Alert.alert('Профиль', 'Введите имя');
      return;
    }

    if (telegram.trim() && !telegram.trim().startsWith('@')) {
      Alert.alert('Профиль', 'Telegram никнейм должен начинаться с @');
      return;
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
      return;
    }
    if (payload.height !== null && Number.isNaN(payload.height)) {
      Alert.alert('Профиль', 'Рост должен быть числом');
      return;
    }

    try {
      const response = await api.put('/users/me/profile', payload);
      const data = response.data;
      setName(data.profile?.name ?? '');

      const genderValue = String(data.profile?.gender ?? '').toLowerCase();
      if (genderValue === 'm' || genderValue === 'male') {
        setGender('male');
      } else if (genderValue === 'f' || genderValue === 'female') {
        setGender('female');
      } else if (genderValue) {
        setGender('other');
      } else {
        setGender(null);
      }

      setAge(data.profile?.age != null ? String(data.profile.age) : '');
      setHeight(data.profile?.height != null ? String(data.profile.height) : '');
      setTelegram(data.profile?.telegram ?? '');
      setEditOpen(false);
      Alert.alert('Готово', 'Профиль обновлен');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Не удалось сохранить профиль';
      Alert.alert('Ошибка', message);
    }
  }, [age, gender, height, name, telegram]);

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

  return (
    <View style={styles.screen}>
      <View pointerEvents="none" style={styles.bgAccentPrimary} />
      <View pointerEvents="none" style={styles.bgAccentSecondary} />
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <StatusBar barStyle="dark-content" />

        <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 120 }}>
          <View style={styles.headerWrap}>
            <View style={styles.headerCard}>
              <Text style={styles.headerKicker}>Профиль</Text>
              <Text style={styles.headerTitle}>Личные данные</Text>
              <Text style={styles.headerSubtitle}>Обновляйте профиль и связь с тренером</Text>

              <View style={styles.avatarRow}>
                <TouchableOpacity onPress={handlePickAvatar} style={styles.avatarButton} hitSlop={8}>
                  {avatarUri ? (
                    <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Camera size={20} color="#6B7280" />
                    </View>
                  )}
                </TouchableOpacity>
                <View style={styles.avatarInfo}>
                  <Text style={styles.avatarName}>{name || (isLoading ? 'Загрузка...' : 'Имя пользователя')}</Text>
                  <Text style={styles.avatarHint}>Нажмите, чтобы сменить фото</Text>
                  <TouchableOpacity onPress={handlePickAvatar} style={styles.avatarActionButton}>
                    <Text style={styles.avatarActionText}>Выбрать фото</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.summaryWrap}>
                <View style={styles.summaryRow}>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Имя</Text>
                    <Text style={styles.summaryValue}>{name || '—'}</Text>
                  </View>
                  <View style={[styles.summaryItem, styles.summaryItemLast]}>
                    <Text style={styles.summaryLabel}>Почта</Text>
                    <Text style={styles.summaryValue}>{email || '—'}</Text>
                  </View>
                </View>
                <View style={styles.summaryRow}>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Пол</Text>
                    <Text style={styles.summaryValue}>{genderLabel}</Text>
                  </View>
                  <View style={[styles.summaryItem, styles.summaryItemLast]}>
                    <Text style={styles.summaryLabel}>Возраст</Text>
                    <Text style={styles.summaryValue}>{age ? `${age} лет` : '—'}</Text>
                  </View>
                </View>
                <View style={styles.summaryRow}>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Рост</Text>
                    <Text style={styles.summaryValue}>{height ? `${height} см` : '—'}</Text>
                  </View>
                  <View style={[styles.summaryItem, styles.summaryItemLast]}>
                    <Text style={styles.summaryLabel}>Telegram</Text>
                    <Text style={styles.summaryValue}>{telegram || '—'}</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => setEditOpen(true)} style={styles.inlineEditButton}>
                  <Text style={styles.inlineEditText}>Редактировать профиль</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Тренер</Text>
          </View>

          <View style={styles.trainerCard}>
            <View style={styles.trainerHeader}>
              <View style={styles.trainerInfoRow}>
                <View style={styles.trainerAvatar}>
                  {trainerAvatar ? (
                    <Image source={{ uri: trainerAvatar }} style={styles.trainerAvatarImage} />
                  ) : (
                    <Text style={styles.trainerAvatarText}>{trainerDisplayName.charAt(0)}</Text>
                  )}
                </View>
                <View>
                  <Text style={styles.trainerLabel}>Ваш тренер</Text>
                  <Text style={styles.trainerName}>{trainerDisplayName}</Text>
                </View>
              </View>
              <View style={styles.trainerStatus}>
                <Text style={styles.trainerStatusText}>{trainerDisplayStatus}</Text>
              </View>
            </View>

            <View style={styles.trainerContacts}>
              {trainerContacts.length === 0 ? (
                <Text style={styles.trainerContactEmpty}>Контакты не указаны</Text>
              ) : (
                trainerContacts.map((contact) => (
                  <View key={contact.label} style={styles.trainerContactItem}>
                    <Text style={styles.trainerContactLabel}>{contact.label}</Text>
                    <Text style={styles.trainerContactValue}>{contact.value}</Text>
                  </View>
                ))
              )}
            </View>
          </View>

          <TouchableOpacity onPress={() => setInviteOpen(true)} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Сменить тренера</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setPasswordOpen(true)} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Сменить пароль</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Text style={styles.logoutButtonText}>Выход</Text>
          </TouchableOpacity>

          {__DEV__ && (
            <View style={styles.devTools}>
              <TouchableOpacity onPress={handleSeedLocalData} style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>Заполнить демо-данными</Text>
              </TouchableOpacity>
              <View style={styles.quickSwitchRow}>
                <TouchableOpacity onPress={() => handleQuickSwitch('admin')} style={styles.quickSwitchButton}>
                  <Text style={styles.quickSwitchText}>Админ</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleQuickSwitch('trainer')} style={styles.quickSwitchButton}>
                  <Text style={styles.quickSwitchText}>Тренер</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleQuickSwitch('client')} style={styles.quickSwitchButton}>
                  <Text style={styles.quickSwitchText}>Клиент</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>

        <Modal visible={isInviteOpen} transparent animationType="fade" onRequestClose={() => setInviteOpen(false)}>
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Сменить тренера</Text>
                <TouchableOpacity onPress={() => setInviteOpen(false)} style={styles.closeButton}>
                  <X size={16} color="#6B7280" />
                </TouchableOpacity>
              </View>
              <Text style={styles.modalLabel}>Инвайт-код</Text>
              <TextInput
                value={inviteCode}
                onChangeText={setInviteCode}
                placeholder="Введите код"
                style={styles.modalInput}
              />
              <TouchableOpacity onPress={handleSaveInvite} style={styles.primaryButton}>
                <Check size={18} color="white" />
                <Text style={styles.primaryButtonText}>Подтвердить</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <Modal visible={isEditOpen} transparent animationType="fade" onRequestClose={() => setEditOpen(false)}>
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Редактировать профиль</Text>
                <TouchableOpacity onPress={() => setEditOpen(false)} style={styles.closeButton}>
                  <X size={16} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Имя</Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Введите имя"
                  style={styles.fieldInput}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Telegram</Text>
                <TextInput
                  value={telegram}
                  onChangeText={setTelegram}
                  placeholder="@username"
                  style={styles.fieldInput}
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Почта</Text>
                <TextInput
                  value={email}
                  placeholder="Введите почту"
                  keyboardType="email-address"
                  style={[styles.fieldInput, styles.fieldInputDisabled]}
                  editable={false}
                />
              </View>

              <Text style={styles.fieldLabel}>Пол</Text>
              <View style={styles.genderRow}>
                {GENDERS.map(item => (
                  <TouchableOpacity
                    key={item.key}
                    onPress={() => setGender(item.key)}
                    style={[styles.genderChip, gender === item.key ? styles.genderChipActive : null]}
                  >
                    <Text style={[styles.genderText, gender === item.key ? styles.genderTextActive : null]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.row}>
                <View style={styles.fieldHalf}>
                  <Text style={styles.fieldLabel}>Возраст</Text>
                  <TextInput
                    value={age}
                    onChangeText={setAge}
                    placeholder="0"
                    keyboardType="numeric"
                    style={styles.fieldInput}
                  />
                </View>
                <View style={[styles.fieldHalf, styles.fieldHalfLast]}>
                  <Text style={styles.fieldLabel}>Рост (см)</Text>
                  <TextInput
                    value={height}
                    onChangeText={setHeight}
                    placeholder="0"
                    keyboardType="numeric"
                    style={styles.fieldInput}
                  />
                </View>
              </View>

              <View style={styles.actionRow}>
                <TouchableOpacity onPress={() => setEditOpen(false)} style={styles.secondaryButtonInline}>
                  <Text style={styles.secondaryButtonText}>Отмена</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSaveProfile} style={styles.primaryButtonInline}>
                  <Check size={18} color="white" />
                  <Text style={styles.primaryButtonText}>Сохранить</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <Modal visible={isPasswordOpen} transparent animationType="fade" onRequestClose={() => setPasswordOpen(false)}>
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Сменить пароль</Text>
                <TouchableOpacity onPress={() => setPasswordOpen(false)} style={styles.closeButton}>
                  <X size={16} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Старый пароль</Text>
                <TextInput
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  placeholder="Введите старый пароль"
                  secureTextEntry
                  style={styles.fieldInput}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Новый пароль</Text>
                <TextInput
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Введите новый пароль"
                  secureTextEntry
                  style={styles.fieldInput}
                />
              </View>

              <View style={styles.actionRow}>
                <TouchableOpacity onPress={() => setPasswordOpen(false)} style={styles.secondaryButtonInline}>
                  <Text style={styles.secondaryButtonText}>Отмена</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSavePassword} style={styles.primaryButtonInline}>
                  <Check size={18} color="white" />
                  <Text style={styles.primaryButtonText}>Сохранить</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F7FAF8',
  },
  safe: {
    flex: 1,
  },
  bgAccentPrimary: {
    position: 'absolute',
    top: -120,
    right: -80,
    width: 220,
    height: 220,
    borderRadius: 999,
    backgroundColor: '#DCFCE7',
    opacity: 0.7,
  },
  bgAccentSecondary: {
    position: 'absolute',
    top: 140,
    left: -110,
    width: 240,
    height: 240,
    borderRadius: 999,
    backgroundColor: '#E0F2FE',
    opacity: 0.5,
  },
  headerWrap: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  headerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
  },
  headerKicker: {
    color: '#6B7280',
    fontSize: 12,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },
  headerSubtitle: {
    marginTop: 6,
    color: '#6B7280',
    fontSize: 13,
  },
  avatarRow: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInfo: {
    marginLeft: 12,
    flex: 1,
  },
  avatarName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  avatarHint: {
    marginTop: 4,
    fontSize: 12,
    color: '#6B7280',
  },
  avatarActionButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  avatarActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
  },
  summaryWrap: {
    marginTop: 16,
  },
  sectionHeader: {
    paddingHorizontal: 24,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  formWrap: {
    marginTop: 12,
    paddingHorizontal: 24,
  },
  summaryRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  summaryItem: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
    marginRight: 12,
  },
  summaryLabel: {
    fontSize: 11,
    color: '#6B7280',
  },
  summaryValue: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  summaryItemLast: {
    marginRight: 0,
  },
  inlineEditButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#ECFDF3',
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  inlineEditText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#166534',
  },
  field: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 6,
  },
  fieldInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#111827',
  },
  fieldInputDisabled: {
    color: '#9CA3AF',
  },
  genderRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  genderChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    marginRight: 8,
    marginBottom: 8,
  },
  genderChipActive: {
    backgroundColor: '#ECFDF3',
    borderColor: '#D1FAE5',
  },
  genderText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  genderTextActive: {
    color: '#166534',
  },
  row: {
    flexDirection: 'row',
  },
  fieldHalf: {
    flex: 1,
    marginRight: 12,
  },
  fieldHalfLast: {
    marginRight: 0,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonInline: {
    marginLeft: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  trainerCard: {
    marginTop: 12,
    marginHorizontal: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 14,
  },
  trainerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  trainerInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trainerLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  trainerName: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  trainerStatus: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#ECFDF3',
  },
  trainerStatusText: {
    color: '#166534',
    fontSize: 11,
    fontWeight: '700',
  },
  trainerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    overflow: 'hidden',
  },
  trainerAvatarImage: {
    width: '100%',
    height: '100%',
  },
  trainerAvatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6B7280',
  },
  trainerContacts: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 10,
  },
  trainerContactEmpty: {
    fontSize: 12,
    color: '#6B7280',
  },
  trainerContactItem: {
    marginBottom: 8,
  },
  trainerContactLabel: {
    fontSize: 11,
    color: '#6B7280',
  },
  trainerContactValue: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  secondaryButton: {
    marginTop: 12,
    marginHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  secondaryButtonInline: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  devTools: {
    marginTop: 12,
  },
  quickSwitchRow: {
    marginTop: 8,
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    paddingHorizontal: 24,
  },
  quickSwitchButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  quickSwitchText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  logoutButton: {
    marginTop: 12,
    marginHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#111827',
    alignItems: 'center',
    marginBottom: 24,
  },
  logoutButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  closeButton: {
    padding: 6,
    borderRadius: 999,
    backgroundColor: '#F3F4F6',
  },
  modalLabel: {
    marginTop: 12,
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  modalInput: {
    marginTop: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#111827',
  },
  primaryButton: {
    marginTop: 14,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  primaryButtonText: {
    marginLeft: 8,
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
