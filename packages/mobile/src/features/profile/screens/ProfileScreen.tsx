import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, TextInput, Modal, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Check } from 'lucide-react-native';

import { COLORS } from '../../../constants/Colors';
import { ProfileHeader } from '../components/ProfileHeader';
import { TrainerCard } from '../components/TrainerCard';
import { SettingsMenu } from '../components/SettingsMenu';
import { useUserProfile } from '../model/useUserProfile';
import { useTrainerConnection } from '../model/useTrainerConnection';
import { useAuthActions } from '../model/useAuthActions';

const GENDERS = [
  { key: 'male', label: 'Мужской' },
  { key: 'female', label: 'Женский' },
  { key: 'other', label: 'Другое' },
] as const;

export default function ProfileScreen() {
  const [isEditOpen, setEditOpen] = useState(false);

  const trainer = useTrainerConnection();
  const profile = useUserProfile({ onTrainerLoaded: trainer.applyTrainerData });
  const auth = useAuthActions();

  const handleSaveProfile = async () => {
    const saved = await profile.saveProfile();
    if (saved) {
      setEditOpen(false);
    }
  };

  const genderOptions = useMemo(() => GENDERS, []);

  return (
    <View style={styles.screen}>
      <View pointerEvents="none" style={styles.bgAccentPrimary} />
      <View pointerEvents="none" style={styles.bgAccentSecondary} />
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <StatusBar barStyle="dark-content" />

        <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 120 }}>
          <ProfileHeader
            name={profile.name}
            email={profile.email}
            genderLabel={profile.genderLabel}
            age={profile.age}
            height={profile.height}
            telegram={profile.telegram}
            avatarUri={profile.avatarUri}
            isLoading={profile.isLoading}
            onPickAvatar={profile.pickAvatar}
            onEditProfile={() => setEditOpen(true)}
          />

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Тренер</Text>
          </View>

          <TrainerCard
            trainerDisplayName={trainer.trainerDisplayName}
            trainerDisplayStatus={trainer.trainerDisplayStatus}
            trainerAvatar={trainer.trainerAvatar}
            trainerContacts={trainer.trainerContacts}
          />

          <SettingsMenu
            onInvite={() => trainer.setInviteOpen(true)}
            onChangePassword={() => auth.setPasswordOpen(true)}
            onLogout={auth.handleLogout}
          />

          {__DEV__ && (
            <View style={styles.devTools}>
              <TouchableOpacity onPress={auth.handleSeedLocalData} style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>Заполнить демо-данными</Text>
              </TouchableOpacity>
              <View style={styles.quickSwitchRow}>
                <TouchableOpacity onPress={() => auth.handleQuickSwitch('admin')} style={styles.quickSwitchButton}>
                  <Text style={styles.quickSwitchText}>Админ</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => auth.handleQuickSwitch('trainer')} style={styles.quickSwitchButton}>
                  <Text style={styles.quickSwitchText}>Тренер</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => auth.handleQuickSwitch('client')} style={styles.quickSwitchButton}>
                  <Text style={styles.quickSwitchText}>Клиент</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>

        <Modal visible={trainer.isInviteOpen} transparent animationType="fade" onRequestClose={() => trainer.setInviteOpen(false)}>
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Сменить тренера</Text>
                <TouchableOpacity onPress={() => trainer.setInviteOpen(false)} style={styles.closeButton}>
                  <X size={16} color="#6B7280" />
                </TouchableOpacity>
              </View>
              <Text style={styles.modalLabel}>Инвайт-код</Text>
              <TextInput
                value={trainer.inviteCode}
                onChangeText={trainer.setInviteCode}
                placeholder="Введите код"
                style={styles.modalInput}
              />
              <TouchableOpacity onPress={trainer.handleSaveInvite} style={styles.primaryButton}>
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
                  value={profile.name}
                  onChangeText={profile.setName}
                  placeholder="Введите имя"
                  style={styles.fieldInput}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Telegram</Text>
                <TextInput
                  value={profile.telegram}
                  onChangeText={profile.setTelegram}
                  placeholder="@username"
                  style={styles.fieldInput}
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Почта</Text>
                <TextInput
                  value={profile.email}
                  placeholder="Введите почту"
                  keyboardType="email-address"
                  style={[styles.fieldInput, styles.fieldInputDisabled]}
                  editable={false}
                />
              </View>

              <Text style={styles.fieldLabel}>Пол</Text>
              <View style={styles.genderRow}>
                {genderOptions.map((item) => (
                  <TouchableOpacity
                    key={item.key}
                    onPress={() => profile.setGender(item.key)}
                    style={[styles.genderChip, profile.gender === item.key ? styles.genderChipActive : null]}
                  >
                    <Text style={[styles.genderText, profile.gender === item.key ? styles.genderTextActive : null]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.row}>
                <View style={styles.fieldHalf}>
                  <Text style={styles.fieldLabel}>Возраст</Text>
                  <TextInput
                    value={profile.age}
                    onChangeText={profile.setAge}
                    placeholder="0"
                    keyboardType="numeric"
                    style={styles.fieldInput}
                  />
                </View>
                <View style={[styles.fieldHalf, styles.fieldHalfLast]}>
                  <Text style={styles.fieldLabel}>Рост (см)</Text>
                  <TextInput
                    value={profile.height}
                    onChangeText={profile.setHeight}
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

        <Modal visible={auth.isPasswordOpen} transparent animationType="fade" onRequestClose={() => auth.setPasswordOpen(false)}>
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Сменить пароль</Text>
                <TouchableOpacity onPress={() => auth.setPasswordOpen(false)} style={styles.closeButton}>
                  <X size={16} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Старый пароль</Text>
                <TextInput
                  value={auth.currentPassword}
                  onChangeText={auth.setCurrentPassword}
                  placeholder="Введите старый пароль"
                  secureTextEntry
                  style={styles.fieldInput}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Новый пароль</Text>
                <TextInput
                  value={auth.newPassword}
                  onChangeText={auth.setNewPassword}
                  placeholder="Введите новый пароль"
                  secureTextEntry
                  style={styles.fieldInput}
                />
              </View>

              <View style={styles.actionRow}>
                <TouchableOpacity onPress={() => auth.setPasswordOpen(false)} style={styles.secondaryButtonInline}>
                  <Text style={styles.secondaryButtonText}>Отмена</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={auth.handleSavePassword} style={styles.primaryButtonInline}>
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
  sectionHeader: {
    paddingHorizontal: 24,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
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
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  devTools: {
    marginTop: 12,
  },
  quickSwitchRow: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  quickSwitchButton: {
    flex: 1,
    marginRight: 8,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#111827',
    alignItems: 'center',
  },
  quickSwitchText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  modalLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 6,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#111827',
    marginBottom: 12,
  },
  primaryButton: {
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
    fontSize: 14,
    fontWeight: '700',
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
  secondaryButtonInline: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
});
