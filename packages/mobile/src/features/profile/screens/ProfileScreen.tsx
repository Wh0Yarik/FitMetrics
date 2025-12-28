import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, TextInput, Image, Alert, Modal, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera, X, Check } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';

import { COLORS } from '../../../constants/Colors';

const GENDERS = [
  { key: 'male', label: 'Мужской' },
  { key: 'female', label: 'Женский' },
  { key: 'other', label: 'Другое' },
] as const;

type GenderKey = typeof GENDERS[number]['key'];

export default function ProfileScreen() {
  const [name, setName] = useState('Алексей');
  const [gender, setGender] = useState<GenderKey>('male');
  const [age, setAge] = useState('28');
  const [height, setHeight] = useState('178');
  const [email, setEmail] = useState('alex@example.com');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [isInviteOpen, setInviteOpen] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [isEditOpen, setEditOpen] = useState(false);
  const [isPasswordOpen, setPasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const trainerName = 'Андрей С.';
  const trainerStatus = 'Подключен';
  const trainerAvatar = null;
  const trainerContacts = [
    { label: 'Телефон', value: '+7 999 123-45-67' },
    { label: 'Соцсеть', value: 'instagram.com/coach_andrey' },
  ];

  const genderLabel = GENDERS.find(item => item.key === gender)?.label ?? 'Не указано';

  const handlePickAvatar = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled) {
      setAvatarUri(result.assets[0].uri);
    }
  }, []);

  const handleSaveInvite = useCallback(() => {
    if (!inviteCode.trim()) {
      Alert.alert('Инвайт-код', 'Введите код тренера');
      return;
    }
    setInviteOpen(false);
    setInviteCode('');
    Alert.alert('Готово', 'Запрос на смену тренера отправлен');
  }, [inviteCode]);

  const handleLogout = useCallback(() => {
    Alert.alert('Выход', 'Вы уверены, что хотите выйти?', [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Выйти', style: 'destructive', onPress: () => {} },
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
                <TouchableOpacity onPress={handlePickAvatar} style={styles.avatarButton}>
                  {avatarUri ? (
                    <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Camera size={20} color="#6B7280" />
                    </View>
                  )}
                  <View style={styles.avatarBadge}>
                    <Camera size={12} color="#FFFFFF" style={styles.avatarBadgeIcon} />
                  </View>
                </TouchableOpacity>
                <View style={styles.avatarInfo}>
                  <Text style={styles.avatarName}>{name || 'Имя пользователя'}</Text>
                  <Text style={styles.avatarHint}>Нажмите, чтобы сменить фото</Text>
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
                  <View style={[styles.summaryItem, styles.summaryItemLast]}>
                    <Text style={styles.summaryLabel}>Рост</Text>
                    <Text style={styles.summaryValue}>{height ? `${height} см` : '—'}</Text>
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
                    <Text style={styles.trainerAvatarText}>{trainerName.charAt(0)}</Text>
                  )}
                </View>
                <View>
                  <Text style={styles.trainerLabel}>Ваш тренер</Text>
                  <Text style={styles.trainerName}>{trainerName}</Text>
                </View>
              </View>
              <View style={styles.trainerStatus}>
                <Text style={styles.trainerStatusText}>{trainerStatus}</Text>
              </View>
            </View>

            <View style={styles.trainerContacts}>
              {trainerContacts.map((contact) => (
                <View key={contact.label} style={styles.trainerContactItem}>
                  <Text style={styles.trainerContactLabel}>{contact.label}</Text>
                  <Text style={styles.trainerContactValue}>{contact.value}</Text>
                </View>
              ))}
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
                <Text style={styles.fieldLabel}>Почта</Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Введите почту"
                  keyboardType="email-address"
                  style={styles.fieldInput}
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
                <TouchableOpacity onPress={() => setEditOpen(false)} style={styles.primaryButtonInline}>
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
  avatarBadge: {
    position: 'absolute',
    right: 6,
    bottom: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarBadgeIcon: {
    transform: [{ translateX: 0.5 }, { translateY: 0.5 }],
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
