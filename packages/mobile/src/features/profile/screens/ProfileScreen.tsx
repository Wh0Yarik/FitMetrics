import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Linking,
  Platform,
  UIManager,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Modal,
  StyleSheet,
  Switch,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronRight, Crown, Dumbbell, HelpCircle, Pencil, Settings, X } from 'lucide-react-native';
import Constants from 'expo-constants';
import { useFocusEffect } from 'expo-router';

import { AppButton, AppInput, Card, colors, fonts, radii, shadows, spacing, useTabBarVisibility } from '../../../shared/ui';
import { ProfileHeader } from '../components/ProfileHeader';
import { EditProfileSheet } from '../components/EditProfileSheet';
import { SharedBottomSheet } from '../components/SharedBottomSheet';
import { TrainerSheet } from '../components/TrainerSheet';
import { useUserProfile } from '../model/useUserProfile';
import { useTrainerConnection } from '../model/useTrainerConnection';
import { useAuthActions } from '../model/useAuthActions';

const PRIVACY_URL = 'https://fitmetrics.ru/privacy';
const TERMS_URL = 'https://fitmetrics.ru/terms';

let Updates: typeof import('expo-updates') | null = null;
try {
  // ExpoUpdates may be missing in some dev clients.
  Updates = require('expo-updates');
} catch {
  Updates = null;
}

export default function ProfileScreen() {
  const { width } = useWindowDimensions();
  const isCompact = width <= 360;
  const bentoIconSize = isCompact ? 36 : 44;
  const { setHidden: setTabBarHidden } = useTabBarVisibility();
  const [isEditOpen, setEditOpen] = useState(false);
  const [isTrainerSheetOpen, setTrainerSheetOpen] = useState(false);
  const [isPasswordSheetOpen, setPasswordSheetOpen] = useState(false);
  const [isSettingsSheetOpen, setSettingsSheetOpen] = useState(false);
  const [showUpdateDebug, setShowUpdateDebug] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [updatesEnabled, setUpdatesEnabled] = useState<boolean | null>(null);
  const [updatesStatus, setUpdatesStatus] = useState('idle');
  const [updatesError, setUpdatesError] = useState<string | null>(null);

  const trainer = useTrainerConnection();
  const profile = useUserProfile({ onTrainerLoaded: trainer.applyTrainerData });
  const auth = useAuthActions();

  const handleSaveProfile = async () => {
    const saved = await profile.saveProfile();
    if (saved) {
      setEditOpen(false);
    }
  };

  const isPasswordSaveDisabled = !auth.currentPassword.trim()
    || !auth.newPassword.trim()
    || !auth.confirmPassword.trim();

  const versionText = useMemo(() => {
    const appVersion = Constants.expoConfig?.version ?? '0.1.0';
    const buildNumber = Constants.expoConfig?.ios?.buildNumber
      ?? Constants.expoConfig?.android?.versionCode?.toString();
    return `v${appVersion}${buildNumber ? ` (build ${buildNumber})` : ''}`;
  }, []);
  const runtimeVersion = useMemo(() => {
    const runtime = Constants.expoConfig?.runtimeVersion;
    if (!runtime) return '—';
    if (typeof runtime === 'string') return runtime;
    if (typeof runtime === 'object' && 'policy' in runtime) {
      return runtime.policy ?? '—';
    }
    return '—';
  }, []);
  const updateId = useMemo(() => Updates?.updateId ?? '—', []);
  const isDevUser = useMemo(() => {
    const allowedEmails = new Set([
      'client1@fitmetrics.com',
      'trainer@fitmetrics.com',
      'admin@fitmetrics.com',
    ]);
    return __DEV__ && allowedEmails.has(profile.email.trim().toLowerCase());
  }, [profile.email]);

  useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  useEffect(() => {
    setTabBarHidden(isEditOpen || isTrainerSheetOpen || isPasswordSheetOpen || isSettingsSheetOpen);
  }, [isEditOpen, isPasswordSheetOpen, isSettingsSheetOpen, isTrainerSheetOpen, setTabBarHidden]);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      if (__DEV__) {
        setUpdatesStatus('available');
        setUpdatesError(null);
        setUpdatesEnabled(Updates?.isEnabled ?? null);
        return () => {
          mounted = false;
        };
      }
      const checkUpdates = async () => {
        setUpdatesEnabled(Updates?.isEnabled ?? null);
        if (!Updates?.isEnabled) return;
        try {
          setUpdatesStatus('checking');
          const update = await Updates.checkForUpdateAsync();
          if (!mounted) return;
            if (update.isAvailable) {
              setUpdatesStatus('available');
              await Updates.fetchUpdateAsync();
            } else {
              setUpdatesStatus('none');
            }
        } catch (error: any) {
          const message = typeof error?.message === 'string' ? error.message : 'unknown';
          setUpdatesError(message);
          setUpdatesStatus('error');
          // Ignore update errors to avoid blocking the screen.
        }
      };
      checkUpdates();
      return () => {
        mounted = false;
      };
    }, [])
  );

  const handleRemoveTrainer = useCallback(() => {
    Alert.alert('Расстаться с тренером', 'Вы уверены, что хотите расстаться с тренером?', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: () => {
          setTrainerSheetOpen(false);
          trainer.removeTrainer();
        },
      },
    ]);
  }, [trainer]);

  const openTrainerSheet = useCallback(() => {
    setTrainerSheetOpen(true);
  }, []);

  const closeTrainerSheet = useCallback(() => {
    setTrainerSheetOpen(false);
  }, []);

  const handleTrainerCellPress = useCallback(() => {
    if (trainer.trainerId) {
      openTrainerSheet();
    } else {
      trainer.setInviteOpen(true);
    }
  }, [openTrainerSheet, trainer]);

  const handleTrainerContactPress = useCallback(async (label: string, value: string) => {
    const normalized = value.trim();
    let url = '';

    if (label.toLowerCase().includes('телефон')) {
      url = `tel:${normalized}`;
    } else if (normalized.startsWith('@')) {
      url = `https://t.me/${normalized.slice(1)}`;
    } else if (normalized.includes('t.me')) {
      url = normalized.startsWith('http') ? normalized : `https://${normalized}`;
    } else if (normalized.startsWith('http')) {
      url = normalized;
    }

    if (!url) {
      return;
    }

    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    }
  }, []);

  const handleExternalLink = useCallback(async (url: string) => {
    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) {
      Alert.alert('Ссылка недоступна', 'Не удалось открыть ссылку.');
      return;
    }
    await Linking.openURL(url);
  }, []);

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <StatusBar barStyle="dark-content"/>

        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.accountTitle}>Аккаунт</Text>
          <ProfileHeader
            name={profile.name}
            avatarUri={profile.avatarUri}
            isLoading={profile.isLoading}
            birthDate={profile.birthDate}
            height={profile.height}
            currentWeight={profile.currentWeight}
            onPickAvatar={profile.pickAvatar}
            onLogout={auth.handleLogout}
          />

          <View style={styles.bentoRow}>
            <Card onPress={handleTrainerCellPress} style={[styles.bentoCell, isCompact && styles.bentoCellCompact]}>
              <View style={styles.bentoCellHeader}>
               <View style={[styles.bentoCellIcon, isCompact && styles.bentoCellIconCompact, { backgroundColor: `${colors.accentCarbs}22` }]}>
                  <Dumbbell size={bentoIconSize} color={colors.accentCarbs} strokeWidth={1.5} />
                </View>
              </View>
              <View style={styles.bentoCellFooter}>
                <Text style={[styles.bentoCellTitle, isCompact && styles.bentoCellTitleCompact]} numberOfLines={2}>
                  Тренер
                </Text>
                <ChevronRight size={18} color={colors.textSecondary} strokeWidth={1.5} />
              </View>
            </Card>
            <Card onPress={() => setEditOpen(true)} style={[styles.bentoCell, isCompact && styles.bentoCellCompact]}>
              <View style={styles.bentoCellHeader}>
                <View style={[styles.bentoCellIcon, isCompact && styles.bentoCellIconCompact, { backgroundColor: `${colors.accentFiber}22` }]}>
                  <Pencil size={bentoIconSize} color={colors.accentFiber} strokeWidth={1.5} />
                </View>
              </View>
              <View style={styles.bentoCellFooter}>
                <Text style={[styles.bentoCellTitle, isCompact && styles.bentoCellTitleCompact]} numberOfLines={2}>
                  Профиль
                </Text>
                <ChevronRight size={18} color={colors.textSecondary} strokeWidth={1.5} />
              </View>
            </Card>
          </View>
          <View style={styles.bentoRowCompact}>
            <Card
              onPress={() => setSettingsSheetOpen(true)}
              onLongPress={() => setShowUpdateDebug(true)}
              delayLongPress={10000}
              style={[styles.bentoCell, isCompact && styles.bentoCellCompact]}
            >
              <View style={styles.bentoCellHeader}>
                <View style={[styles.bentoCellIcon, isCompact && styles.bentoCellIconCompact, { backgroundColor: `${colors.accentProtein}22` }]}>
                  <Settings size={bentoIconSize} color={colors.accentProtein} strokeWidth={1.5} />
                </View>
              </View>
              <View style={styles.bentoCellFooter}>
                <Text style={[styles.bentoCellTitle, isCompact && styles.bentoCellTitleCompact]} numberOfLines={2}>
                  Настройки
                </Text>
                <ChevronRight size={18} color={colors.textSecondary} strokeWidth={1.5} />
              </View>
            </Card>
            <Card onPress={() => Alert.alert('Скоро', 'Подписка будет доступна позже')} style={[styles.bentoCell, isCompact && styles.bentoCellCompact]}>
              <View style={styles.bentoCellHeader}>
                <View style={[styles.bentoCellIcon, isCompact && styles.bentoCellIconCompact, { backgroundColor: `${colors.accentFat}22` }]}>
                  <Crown size={bentoIconSize} color={colors.accentFat} strokeWidth={1.5} />
                </View>
              </View>
              <View style={styles.bentoCellFooter}>
                <Text style={[styles.bentoCellTitle, isCompact && styles.bentoCellTitleCompact]} numberOfLines={2}>
                  Подписка
                </Text>
                <ChevronRight size={18} color={colors.textSecondary} strokeWidth={1.5} />
              </View>
            </Card>
          </View>
          <View style={styles.bentoRowCompact}>
            <Card onPress={() => Alert.alert('Скоро', 'Раздел поддержки будет доступен позже')} style={[styles.bentoCell, isCompact && styles.bentoCellCompact]}>
              <View style={styles.bentoCellHeader}>
                <View style={[styles.bentoCellIcon, isCompact && styles.bentoCellIconCompact, { backgroundColor: `${colors.accentCarbs}22` }]}>
                  <HelpCircle size={bentoIconSize} color={colors.accentCarbs} strokeWidth={1.5} />
                </View>
              </View>
              <View style={styles.bentoCellFooter}>
                <Text style={[styles.bentoCellTitle, isCompact && styles.bentoCellTitleCompact]} numberOfLines={2}>
                  Поддержка
                </Text>
                <ChevronRight size={18} color={colors.textSecondary} strokeWidth={1.5} />
              </View>
            </Card>
            {isDevUser ? (
              <Card style={[styles.bentoCell, styles.bentoDevSquare]}>
                <TouchableOpacity onPress={() => auth.handleQuickSwitch('client')} style={styles.bentoDevSquareFull}>
                  <Text style={styles.bentoDevTitle}>Клиент</Text>
                </TouchableOpacity>
                <View style={styles.bentoDevRow}>
                  <TouchableOpacity onPress={() => auth.handleQuickSwitch('admin')} style={styles.bentoDevSquareHalf}>
                    <Text style={styles.bentoDevTitle}>Админ</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => auth.handleQuickSwitch('trainer')} style={styles.bentoDevSquareHalf}>
                    <Text style={styles.bentoDevTitle}>Тренер</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            ) : (
              <View style={[styles.bentoCell, styles.bentoCellPlaceholder]} />
            )}
          </View>
          <View style={styles.accountFooter}>
            <View style={styles.accountLinks}>
              <TouchableOpacity onPress={() => handleExternalLink(PRIVACY_URL)}>
                <Text style={styles.accountLinkText}>Политика конфиденциальности</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleExternalLink(TERMS_URL)}>
                <Text style={styles.accountLinkText}>Условия использования</Text>
              </TouchableOpacity>
            </View>
            {showUpdateDebug ? (
              <View style={styles.updateDebugRow}>
                <Text style={styles.updateDebugText}>
                  Updates enabled: {updatesEnabled == null ? '—' : updatesEnabled ? 'yes' : 'no'}
                </Text>
                <Text style={styles.updateDebugText}>Status: {updatesStatus}</Text>
                {updatesError ? (
                  <Text style={styles.updateDebugText}>Error: {updatesError}</Text>
                ) : null}
                <Text style={styles.updateDebugText}>Runtime: {runtimeVersion}</Text>
                <Text style={styles.updateDebugText}>Update ID: {updateId}</Text>
              </View>
            ) : null}
            <Text style={styles.accountVersion}>{versionText}</Text>
          </View>

        </ScrollView>

        <Modal visible={trainer.isInviteOpen} transparent animationType="fade" onRequestClose={() => trainer.setInviteOpen(false)}>
          <View style={styles.modalBackdrop}>
            <Card style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{trainer.trainerId ? 'Сменить тренера' : 'Привязать тренера'}</Text>
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

        <EditProfileSheet
          visible={isEditOpen}
          onClose={() => setEditOpen(false)}
          profile={profile}
          onSave={handleSaveProfile}
        />

        <SharedBottomSheet
          visible={isPasswordSheetOpen}
          onClose={() => setPasswordSheetOpen(false)}
          headerSwipeHeight={56}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Сменить пароль</Text>
          </View>
          <ScrollView
            style={styles.sheetScroll}
            contentContainerStyle={styles.sheetScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <AppInput
              label="Старый пароль"
              value={auth.currentPassword}
              onChangeText={(value) => {
                auth.setCurrentPassword(value);
                if (auth.currentPasswordError) {
                  auth.setCurrentPasswordError(null);
                }
              }}
              placeholder="Введите старый пароль"
              secureTextEntry
              containerStyle={styles.modalField}
              style={styles.modalInput}
              error={auth.currentPasswordError}
            />

            <AppInput
              label="Новый пароль"
              value={auth.newPassword}
              onChangeText={(value) => {
                auth.setNewPassword(value);
                if (auth.confirmPasswordError) {
                  auth.setConfirmPasswordError(null);
                }
              }}
              placeholder="Введите новый пароль"
              secureTextEntry
              containerStyle={styles.modalField}
              style={styles.modalInput}
            />

            <AppInput
              label="Повторите пароль"
              value={auth.confirmPassword}
              onChangeText={(value) => {
                auth.setConfirmPassword(value);
                if (auth.confirmPasswordError) {
                  auth.setConfirmPasswordError(null);
                }
              }}
              placeholder="Повторите новый пароль"
              secureTextEntry
              containerStyle={styles.modalField}
              style={styles.modalInput}
              error={auth.confirmPasswordError}
            />

            <View style={styles.sheetActionRow}>
              <AppButton
                title="Сохранить"
                onPress={async () => {
                  const saved = await auth.handleSavePassword();
                  if (saved) {
                    setPasswordSheetOpen(false);
                  }
                }}
                disabled={isPasswordSaveDisabled}
                size="md"
                style={styles.sheetActionButton}
              />
              <AppButton
                title="Отмена"
                onPress={() => setPasswordSheetOpen(false)}
                variant="secondary"
                size="md"
                style={styles.sheetActionButton}
              />
            </View>
          </ScrollView>
        </SharedBottomSheet>

        <SharedBottomSheet
          visible={isSettingsSheetOpen}
          onClose={() => setSettingsSheetOpen(false)}
          headerSwipeHeight={56}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Настройки</Text>
          </View>
          <ScrollView
            style={styles.sheetScroll}
            contentContainerStyle={styles.sheetScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Уведомления</Text>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: colors.divider, true: `${colors.primary}55` }}
                thumbColor={notificationsEnabled ? colors.primary : colors.textTertiary}
              />
            </View>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Напоминания</Text>
              <Switch
                value={remindersEnabled}
                onValueChange={setRemindersEnabled}
                trackColor={{ false: colors.divider, true: `${colors.primary}55` }}
                thumbColor={remindersEnabled ? colors.primary : colors.textTertiary}
              />
            </View>

            <View style={styles.sheetActionRow}>
              <AppButton
                title="Сменить пароль"
                onPress={() => {
                  setSettingsSheetOpen(false);
                  setPasswordSheetOpen(true);
                }}
                size="md"
                style={styles.sheetActionButton}
              />
              <AppButton
                title="Удалить профиль"
                onPress={() => Alert.alert('Удаление профиля', 'Функция будет доступна позже')}
                variant="danger"
                size="md"
                style={styles.sheetActionButton}
              />
            </View>
            {__DEV__ ? (
              <View style={styles.sheetActionRow}>
                <AppButton
                  title="Заполнить замеры (2 мес)"
                  onPress={auth.handleSeedWeightHistory}
                  variant="secondary"
                  size="md"
                  style={styles.sheetActionButton}
                />
              </View>
            ) : null}
          </ScrollView>
        </SharedBottomSheet>

        {trainer.trainerId ? (
          <TrainerSheet
            visible={isTrainerSheetOpen}
            onClose={closeTrainerSheet}
            trainerAvatar={trainer.trainerAvatar}
            trainerDisplayName={trainer.trainerDisplayName}
            trainerSpecialization={trainer.trainerSpecialization}
            trainerBio={trainer.trainerBio}
            trainerContacts={trainer.trainerContacts}
            onContactPress={handleTrainerContactPress}
            onRemoveTrainer={handleRemoveTrainer}
          />
        ) : null}
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
  accountTitle:{
    fontSize: 24,
    textAlign: 'center',
    fontFamily: fonts.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.xl,
  },
  content: {
    paddingTop: 44,
    paddingBottom: 120,
  },
  bentoRow: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.lg,
    flexDirection: 'row',
    gap: spacing.md,
  },
  bentoRowCompact: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.md,
    flexDirection: 'row',
    gap: spacing.md,
  },
  bentoCell: {
    flex: 1,
    aspectRatio: 1,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    borderRadius: radii.card,
    justifyContent: 'flex-start',
  },
  bentoCellCompact: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  bentoCellHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    marginBottom: spacing.md,
  },
  bentoCellIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bentoCellIconCompact: {
    width: 34,
    height: 34,
    borderRadius: 10,
  },
  bentoCellTitle: {
    fontSize: 18,
    fontFamily: fonts.semibold,
    color: colors.textPrimary,
    textAlign: 'left',
  },
  bentoCellTitleCompact: {
    fontSize: 15,
    lineHeight: 18,
  },
  bentoCellFooter: {
    marginTop: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bentoCellPlaceholder: {
    opacity: 0,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  settingLabel: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.textPrimary,
  },
  accountFooter: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.xl,
    gap: spacing.xs,
    alignItems: 'center',
  },
  accountLinks: {
    gap: spacing.xs,
    alignItems: 'center',
  },
  accountLinkText: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },
  accountVersion: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.textTertiary,
  },
  updateDebugRow: {
    marginTop: spacing.sm,
    gap: 4,
    alignItems: 'center',
  },
  updateDebugText: {
    fontSize: 11,
    fontFamily: fonts.medium,
    color: colors.textTertiary,
  },
  bentoDevRow: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
  },
  bentoDevSquare: {
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  bentoDevSquareFull: {
    paddingVertical: spacing.sm,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.divider,
    alignItems: 'center',
    width: '100%',
  },
  bentoDevSquareHalf: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.divider,
    alignItems: 'center',
  },
  bentoDevTitle: {
    fontSize: 14,
    fontFamily: fonts.semibold,
    color: colors.textPrimary,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(43, 54, 81, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
  },
  sheetScroll: {
    flex: 1,
  },
  sheetScrollContent: {
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
    fontFamily: fonts.semibold,
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
  modalField: {
    marginBottom: spacing.md,
  },
  modalInput: {
    height: 52,
    fontSize: 15,
    fontFamily: fonts.medium,
  },
  sheetActionRow: {
    flexDirection: 'column',
    alignItems: 'stretch',
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  sheetActionButton: {
    width: '100%',
  },
});
