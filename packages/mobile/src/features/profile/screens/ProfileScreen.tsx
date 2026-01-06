import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, Modal, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';

import { AppButton, AppInput, Card, colors, spacing } from '../../../shared/ui';
import { normalizeBirthDateInput } from '../../../shared/lib/date';
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
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <StatusBar barStyle="dark-content" />

        <ScrollView contentContainerStyle={styles.content}>
          <ProfileHeader
            name={profile.name}
            email={profile.email}
            genderLabel={profile.genderLabel}
            birthDate={profile.birthDate}
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
            <Card style={styles.devTools}>
              <AppButton title="Заполнить демо-данными" onPress={auth.handleSeedLocalData} variant="secondary" size="md" />
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
            </Card>
          )}
        </ScrollView>

        <Modal visible={trainer.isInviteOpen} transparent animationType="fade" onRequestClose={() => trainer.setInviteOpen(false)}>
          <View style={styles.modalBackdrop}>
            <Card style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Сменить тренера</Text>
                <TouchableOpacity onPress={() => trainer.setInviteOpen(false)} style={styles.closeButton}>
                  <X size={16} color="#6B7280" />
                </TouchableOpacity>
              </View>
              <AppInput
                label="Инвайт-код"
                value={trainer.inviteCode}
                onChangeText={trainer.setInviteCode}
                placeholder="Введите код"
              />
              <AppButton title="Подтвердить" onPress={trainer.handleSaveInvite} />
            </Card>
          </View>
        </Modal>

        <Modal visible={isEditOpen} transparent animationType="fade" onRequestClose={() => setEditOpen(false)}>
          <View style={styles.modalBackdrop}>
            <Card style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Редактировать профиль</Text>
                <TouchableOpacity onPress={() => setEditOpen(false)} style={styles.closeButton}>
                  <X size={16} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <AppInput
                label="Имя"
                value={profile.name}
                onChangeText={profile.setName}
                placeholder="Введите имя"
              />

              <AppInput
                label="Telegram"
                value={profile.telegram}
                onChangeText={profile.setTelegram}
                placeholder="@username"
                autoCapitalize="none"
              />

              <AppInput
                label="Почта"
                value={profile.email}
                placeholder="Введите почту"
                keyboardType="email-address"
                editable={false}
                style={styles.fieldInputDisabled}
              />

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
                  <AppInput
                    label="Дата рождения"
                    value={profile.birthDate}
                    onChangeText={(value) => profile.setBirthDate(normalizeBirthDateInput(value))}
                    placeholder="ДД.ММ.ГГГГ"
                    autoCapitalize="none"
                    keyboardType="numeric"
                  />
                </View>
                <View style={[styles.fieldHalf, styles.fieldHalfLast]}>
                  <AppInput
                    label="Рост (см)"
                    value={profile.height}
                    onChangeText={profile.setHeight}
                    placeholder="0"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.actionRow}>
                <AppButton title="Отмена" onPress={() => setEditOpen(false)} variant="secondary" size="md" />
                <AppButton title="Сохранить" onPress={handleSaveProfile} size="md" />
              </View>
            </Card>
          </View>
        </Modal>

        <Modal visible={auth.isPasswordOpen} transparent animationType="fade" onRequestClose={() => auth.setPasswordOpen(false)}>
          <View style={styles.modalBackdrop}>
            <Card style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Сменить пароль</Text>
                <TouchableOpacity onPress={() => auth.setPasswordOpen(false)} style={styles.closeButton}>
                  <X size={16} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <AppInput
                label="Старый пароль"
                value={auth.currentPassword}
                onChangeText={auth.setCurrentPassword}
                placeholder="Введите старый пароль"
                secureTextEntry
              />

              <AppInput
                label="Новый пароль"
                value={auth.newPassword}
                onChangeText={auth.setNewPassword}
                placeholder="Введите новый пароль"
                secureTextEntry
              />

              <View style={styles.actionRow}>
                <AppButton title="Отмена" onPress={() => auth.setPasswordOpen(false)} variant="secondary" size="md" />
                <AppButton title="Сохранить" onPress={auth.handleSavePassword} size="md" />
              </View>
            </Card>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safe: {
    flex: 1,
  },
  content: {
    paddingBottom: 120,
  },
  sectionHeader: {
    paddingHorizontal: spacing.xl,
    marginTop: spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  devTools: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.md,
    gap: spacing.md,
  },
  quickSwitchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickSwitchButton: {
    flex: 1,
    marginRight: 8,
    paddingVertical: spacing.sm,
    borderRadius: 12,
    backgroundColor: colors.textPrimary,
    alignItems: 'center',
  },
  quickSwitchText: {
    color: colors.surface,
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
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.inputBg,
  },
  field: {
    marginBottom: spacing.md,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  fieldInputDisabled: {
    color: colors.textTertiary,
  },
  genderRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.md,
  },
  genderChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.divider,
    backgroundColor: colors.surface,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  genderChipActive: {
    backgroundColor: `${colors.primary}18`,
    borderColor: `${colors.primary}55`,
  },
  genderText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  genderTextActive: {
    color: colors.primary,
  },
  row: {
    flexDirection: 'row',
  },
  fieldHalf: {
    flex: 1,
    marginRight: spacing.sm,
  },
  fieldHalfLast: {
    marginRight: 0,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
});
