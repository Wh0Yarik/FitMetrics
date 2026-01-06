import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  LayoutAnimation,
  Platform,
  UIManager,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Pressable,
  StatusBar,
  Modal,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronDown, X } from 'lucide-react-native';

import { AppButton, AppInput, Card, colors, radii, spacing } from '../../../shared/ui';
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
] as const;

export default function ProfileScreen() {
  const [isEditOpen, setEditOpen] = useState(false);
  const [isEditVisible, setEditVisible] = useState(false);
  const [isTrainerOpen, setTrainerOpen] = useState(false);
  const editBackdropOpacity = useRef(new Animated.Value(0)).current;
  const editSheetTranslate = useRef(new Animated.Value(420)).current;

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

  useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  const handleToggleTrainer = () => {
    LayoutAnimation.configureNext(
      LayoutAnimation.create(240, LayoutAnimation.Types.easeInEaseOut, LayoutAnimation.Properties.opacity)
    );
    setTrainerOpen((prev) => !prev);
  };

  useEffect(() => {
    if (isEditOpen) {
      setEditVisible(true);
      Animated.parallel([
        Animated.timing(editBackdropOpacity, {
          toValue: 1,
          duration: 320,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(editSheetTranslate, {
          toValue: 0,
          duration: 360,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(editBackdropOpacity, {
          toValue: 0,
          duration: 200,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(editSheetTranslate, {
          toValue: 420,
          duration: 240,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) {
          setEditVisible(false);
        }
      });
    }
  }, [editBackdropOpacity, editSheetTranslate, isEditOpen]);

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <StatusBar barStyle="dark-content" />

        <ScrollView contentContainerStyle={styles.content}>
          <ProfileHeader
            name={profile.name}
            avatarUri={profile.avatarUri}
            isLoading={profile.isLoading}
            onPickAvatar={profile.pickAvatar}
            onEditProfile={() => setEditOpen(true)}
          />

          <Card onPress={handleToggleTrainer} style={styles.accordionHeader}>
            <View style={styles.accordionHeaderRow}>
              <Text style={styles.accordionTitle}>Тренер</Text>
              <ChevronDown
                size={18}
                color={colors.textSecondary}
                style={[styles.accordionChevron, isTrainerOpen && styles.accordionChevronOpen]}
              />
            </View>
          </Card>

          {isTrainerOpen ? (
            <View style={styles.accordionBody}>
              <TrainerCard
                trainerDisplayName={trainer.trainerDisplayName}
                trainerDisplayStatus={trainer.trainerDisplayStatus}
                trainerAvatar={trainer.trainerAvatar}
                trainerContacts={trainer.trainerContacts}
              />
              <View style={styles.trainerAction}>
                <AppButton
                  title="Сменить тренера"
                  onPress={() => trainer.setInviteOpen(true)}
                  variant="secondary"
                  size="md"
                  style={styles.trainerActionButton}
                />
              </View>
            </View>
          ) : null}

          <View style={styles.sectionDivider} />

          <Card style={styles.settingsCard}>
            <SettingsMenu
              onChangePassword={() => auth.setPasswordOpen(true)}
              onLogout={auth.handleLogout}
            />
          </Card>

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

        <Modal visible={isEditVisible} transparent animationType="none" onRequestClose={() => setEditOpen(false)}>
          <View style={styles.sheetRoot}>
            <Pressable onPress={() => setEditOpen(false)} style={StyleSheet.absoluteFillObject}>
              <Animated.View style={[styles.sheetOverlay, { opacity: editBackdropOpacity }]} />
            </Pressable>
            <Animated.View style={[styles.sheetCardContainer, { transform: [{ translateY: editSheetTranslate }] }]}>
              <Card style={styles.sheetCard}>
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
                containerStyle={styles.modalField}
                style={styles.modalInput}
              />

              <AppInput
                label="Telegram"
                value={profile.telegram}
                onChangeText={profile.setTelegram}
                placeholder="@username"
                autoCapitalize="none"
                containerStyle={styles.modalField}
                style={styles.modalInput}
              />

              <AppInput
                label="Почта"
                value={profile.email}
                placeholder="Введите почту"
                keyboardType="email-address"
                editable={false}
                containerStyle={styles.modalField}
                style={[styles.modalInput, styles.fieldInputDisabled]}
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
                    containerStyle={styles.modalField}
                    style={styles.modalInput}
                  />
                </View>
                <View style={[styles.fieldHalf, styles.fieldHalfLast]}>
                  <AppInput
                    label="Рост (см)"
                    value={profile.height}
                    onChangeText={profile.setHeight}
                    placeholder="0"
                    keyboardType="numeric"
                    containerStyle={styles.modalField}
                    style={styles.modalInput}
                  />
                </View>
              </View>

              <View style={styles.actionRow}>
                <AppButton title="Отмена" onPress={() => setEditOpen(false)} variant="secondary" size="md" />
                <AppButton title="Сохранить" onPress={handleSaveProfile} size="md" />
              </View>
              </Card>
            </Animated.View>
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
  accordionHeader: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.card,
  },
  accordionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  accordionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  accordionChevron: {
    transform: [{ rotate: '0deg' }],
  },
  accordionChevronOpen: {
    transform: [{ rotate: '180deg' }],
  },
  accordionBody: {
    marginTop: spacing.xs,
  },
  trainerAction: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.sm,
    alignItems: 'flex-start',
  },
  trainerActionButton: {
    paddingHorizontal: spacing.md,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: colors.divider,
    marginHorizontal: spacing.xl,
    marginTop: spacing.lg,
  },
  settingsCard: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
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
  sheetRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheetOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  sheetCardContainer: {
    width: '100%',
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  sheetCard: {
    width: '100%',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingBottom: spacing.xl,
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
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  fieldInputDisabled: {
    color: colors.textTertiary,
  },
  modalField: {
    marginBottom: spacing.md,
  },
  modalInput: {
    height: 48,
    fontSize: 15,
    fontWeight: '500',
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
    marginBottom: spacing.md,
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
    justifyContent: 'flex-end',
  },
});
