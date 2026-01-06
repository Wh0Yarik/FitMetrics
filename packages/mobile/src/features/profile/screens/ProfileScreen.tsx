import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Alert,
  Dimensions,
  Easing,
  LayoutAnimation,
  Linking,
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

import { AppButton, AppInput, Card, colors, radii, spacing, useTabBarVisibility } from '../../../shared/ui';
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

const SHEET_HEIGHT = Math.round(Dimensions.get('window').height * 0.75);
const SHEET_ANIM = {
  inDuration: 200,
  outDuration: 200,
  inEasing: Easing.out(Easing.cubic),
  outEasing: Easing.in(Easing.cubic),
  translateStart: SHEET_HEIGHT,
  translateInDuration: 800,
  translateOutDuration: 450,
};

export default function ProfileScreen() {
  const { setHidden: setTabBarHidden } = useTabBarVisibility();
  const [isEditOpen, setEditOpen] = useState(false);
  const [isEditVisible, setEditVisible] = useState(false);
  const [isTrainerOpen, setTrainerOpen] = useState(false);
  const [isTrainerSheetOpen, setTrainerSheetOpen] = useState(false);
  const [isTrainerSheetVisible, setTrainerSheetVisible] = useState(false);
  const [isPasswordSheetOpen, setPasswordSheetOpen] = useState(false);
  const [isPasswordSheetVisible, setPasswordSheetVisible] = useState(false);
  const editBackdropOpacity = useRef(new Animated.Value(0)).current;
  const editSheetTranslate = useRef(new Animated.Value(SHEET_ANIM.translateStart)).current;
  const trainerSheetOpacity = useRef(new Animated.Value(0)).current;
  const trainerSheetTranslate = useRef(new Animated.Value(SHEET_ANIM.translateStart)).current;
  const passwordSheetOpacity = useRef(new Animated.Value(0)).current;
  const passwordSheetTranslate = useRef(new Animated.Value(SHEET_ANIM.translateStart)).current;

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

  const genderOptions = useMemo(() => GENDERS, []);

  useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  useEffect(() => {
    setTabBarHidden(isEditOpen || isTrainerSheetOpen || isPasswordSheetOpen);
  }, [isEditOpen, isPasswordSheetOpen, isTrainerSheetOpen, setTabBarHidden]);

  const handleToggleTrainer = () => {
    LayoutAnimation.configureNext(
      LayoutAnimation.create(240, LayoutAnimation.Types.easeInEaseOut, LayoutAnimation.Properties.opacity)
    );
    setTrainerOpen((prev) => !prev);
  };

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

  useEffect(() => {
    if (isEditOpen) {
      setEditVisible(true);
      Animated.parallel([
        Animated.timing(editBackdropOpacity, {
          toValue: 1,
          duration: SHEET_ANIM.inDuration,
          easing: SHEET_ANIM.inEasing,
          useNativeDriver: true,
        }),
        Animated.timing(editSheetTranslate, {
          toValue: 0,
          duration: SHEET_ANIM.translateInDuration,
          easing: SHEET_ANIM.inEasing,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(editBackdropOpacity, {
          toValue: 0,
          duration: SHEET_ANIM.outDuration,
          easing: SHEET_ANIM.outEasing,
          useNativeDriver: true,
        }),
        Animated.timing(editSheetTranslate, {
          toValue: SHEET_ANIM.translateStart,
          duration: SHEET_ANIM.translateOutDuration,
          easing: SHEET_ANIM.outEasing,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) {
          setEditVisible(false);
        }
      });
    }
  }, [editBackdropOpacity, editSheetTranslate, isEditOpen]);

  useEffect(() => {
    if (isTrainerSheetOpen) {
      setTrainerSheetVisible(true);
      Animated.parallel([
        Animated.timing(trainerSheetOpacity, {
          toValue: 1,
          duration: SHEET_ANIM.inDuration,
          easing: SHEET_ANIM.inEasing,
          useNativeDriver: true,
        }),
        Animated.timing(trainerSheetTranslate, {
          toValue: 0,
          duration: SHEET_ANIM.translateInDuration,
          easing: SHEET_ANIM.inEasing,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(trainerSheetOpacity, {
          toValue: 0,
          duration: SHEET_ANIM.outDuration,
          easing: SHEET_ANIM.outEasing,
          useNativeDriver: true,
        }),
        Animated.timing(trainerSheetTranslate, {
          toValue: SHEET_ANIM.translateStart,
          duration: SHEET_ANIM.translateOutDuration,
          easing: SHEET_ANIM.outEasing,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) {
          setTrainerSheetVisible(false);
        }
      });
    }
  }, [isTrainerSheetOpen, trainerSheetOpacity, trainerSheetTranslate]);

  useEffect(() => {
    if (isPasswordSheetOpen) {
      setPasswordSheetVisible(true);
      Animated.parallel([
        Animated.timing(passwordSheetOpacity, {
          toValue: 1,
          duration: SHEET_ANIM.inDuration,
          easing: SHEET_ANIM.inEasing,
          useNativeDriver: true,
        }),
        Animated.timing(passwordSheetTranslate, {
          toValue: 0,
          duration: SHEET_ANIM.translateInDuration,
          easing: SHEET_ANIM.inEasing,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(passwordSheetOpacity, {
          toValue: 0,
          duration: SHEET_ANIM.outDuration,
          easing: SHEET_ANIM.outEasing,
          useNativeDriver: true,
        }),
        Animated.timing(passwordSheetTranslate, {
          toValue: SHEET_ANIM.translateStart,
          duration: SHEET_ANIM.translateOutDuration,
          easing: SHEET_ANIM.outEasing,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) {
          setPasswordSheetVisible(false);
        }
      });
    }
  }, [isPasswordSheetOpen, passwordSheetOpacity, passwordSheetTranslate]);

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
              {trainer.trainerId ? (
                <>
                  <Pressable onPress={openTrainerSheet}>
                    <TrainerCard
                      trainerDisplayName={trainer.trainerDisplayName}
                      trainerDisplayStatus={trainer.trainerDisplayStatus}
                      trainerAvatar={trainer.trainerAvatar}
                      trainerContacts={trainer.trainerContacts}
                    />
                  </Pressable>
                </>
              ) : (
                <Card style={styles.trainerEmptyCard}>
                  <AppInput
                    label="Инвайт-код"
                    value={trainer.inviteCode}
                    onChangeText={trainer.setInviteCode}
                    placeholder="6 символов"
                    autoCapitalize="characters"
                    containerStyle={styles.modalField}
                    style={styles.modalInput}
                  />
                  <AppButton title="Применить" onPress={trainer.handleSaveInvite} size="md" />
                </Card>
              )}
            </View>
          ) : null}

          <View style={styles.sectionDivider} />

          <Card style={styles.settingsCard}>
            <SettingsMenu
              onChangePassword={() => setPasswordSheetOpen(true)}
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

        {isEditVisible ? (
          <View style={styles.sheetPortal} pointerEvents="auto">
            <Pressable onPress={() => setEditOpen(false)} style={StyleSheet.absoluteFillObject}>
              <Animated.View style={[styles.sheetOverlay, { opacity: editBackdropOpacity }]} />
            </Pressable>
            <Animated.View style={[styles.sheetCardContainer, { transform: [{ translateY: editSheetTranslate }] }]}>
              <Card style={styles.sheetCardLarge}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Редактировать профиль</Text>
                  <TouchableOpacity onPress={() => setEditOpen(false)} style={styles.closeButton}>
                    <X size={16} color="#6B7280" />
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.sheetScroll} contentContainerStyle={styles.sheetScrollContent} showsVerticalScrollIndicator={false}>
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

              <View style={styles.sheetActionRow}>
                <AppButton
                  title="Сохранить"
                  onPress={handleSaveProfile}
                  size="md"
                  style={styles.sheetActionButton}
                />
                <AppButton
                  title="Отмена"
                  onPress={() => setEditOpen(false)}
                  variant="secondary"
                  size="md"
                  style={styles.sheetActionButton}
                />
              </View>
                </ScrollView>
              </Card>
            </Animated.View>
          </View>
        ) : null}

        {isPasswordSheetVisible ? (
          <View style={styles.sheetPortal} pointerEvents="auto">
            <Pressable onPress={() => setPasswordSheetOpen(false)} style={StyleSheet.absoluteFillObject}>
              <Animated.View style={[styles.sheetOverlay, { opacity: passwordSheetOpacity }]} />
            </Pressable>
            <Animated.View style={[styles.sheetCardContainer, { transform: [{ translateY: passwordSheetTranslate }] }]}>
              <Card style={styles.sheetCardLarge}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Сменить пароль</Text>
                  <TouchableOpacity onPress={() => setPasswordSheetOpen(false)} style={styles.closeButton}>
                    <X size={16} color="#6B7280" />
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.sheetScroll} contentContainerStyle={styles.sheetScrollContent} showsVerticalScrollIndicator={false}>
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
              </Card>
            </Animated.View>
          </View>
        ) : null}

        {isTrainerSheetVisible && trainer.trainerId ? (
          <View style={styles.sheetPortal} pointerEvents="auto">
            <Pressable onPress={closeTrainerSheet} style={StyleSheet.absoluteFillObject}>
              <Animated.View style={[styles.sheetOverlay, { opacity: trainerSheetOpacity }]} />
            </Pressable>
            <Animated.View style={[styles.sheetCardContainer, { transform: [{ translateY: trainerSheetTranslate }] }]}>
              <Card style={styles.sheetCardLarge}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Тренер</Text>
                  <TouchableOpacity onPress={closeTrainerSheet} style={styles.closeButton}>
                    <X size={16} color="#6B7280" />
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.sheetScroll} contentContainerStyle={styles.sheetScrollContent} showsVerticalScrollIndicator={false}>

                <View style={styles.trainerSheetHeader}>
                  <View style={styles.trainerSheetAvatar}>
                    {trainer.trainerAvatar ? (
                      <Animated.Image source={{ uri: trainer.trainerAvatar }} style={styles.trainerSheetAvatarImage} />
                    ) : (
                      <Text style={styles.trainerSheetAvatarText}>{trainer.trainerDisplayName.charAt(0)}</Text>
                    )}
                  </View>
                  <Text style={styles.trainerSheetName}>{trainer.trainerDisplayName}</Text>
                  {trainer.trainerSpecialization ? (
                    <Text style={styles.trainerSheetSubtitle}>{trainer.trainerSpecialization}</Text>
                  ) : null}
                </View>

                {trainer.trainerBio ? (
                  <Text style={styles.trainerSheetBio}>{trainer.trainerBio}</Text>
                ) : null}

                <View style={styles.trainerSheetContacts}>
                  {trainer.trainerContacts.length === 0 ? (
                    <Text style={styles.trainerSheetEmpty}>Контакты не указаны</Text>
                  ) : (
                    trainer.trainerContacts.map((contact) => (
                      <TouchableOpacity
                        key={`${contact.label}-${contact.value}`}
                        onPress={() => handleTrainerContactPress(contact.label, contact.value)}
                        style={styles.trainerSheetContactItem}
                      >
                        <Text style={styles.trainerSheetContactLabel}>{contact.label}</Text>
                        <Text style={styles.trainerSheetContactValue}>{contact.value}</Text>
                      </TouchableOpacity>
                    ))
                  )}
                </View>

                <View style={styles.sheetActionRow}>
                  <AppButton
                    title="Расстаться с тренером"
                    onPress={handleRemoveTrainer}
                    variant="danger"
                    size="md"
                    style={styles.sheetActionButton}
                  />
                </View>
                </ScrollView>
              </Card>
            </Animated.View>
          </View>
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
  trainerEmptyCard: {
    marginHorizontal: spacing.xl,
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
    backgroundColor: 'rgba(43, 54, 81, 0.45)',
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
  sheetPortal: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    zIndex: 20,
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
  sheetCardLarge: {
    width: '100%',
    height: SHEET_HEIGHT,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingBottom: 0,
  },
  sheetScroll: {
    flex: 1,
  },
  sheetScrollContent: {
    paddingBottom: 0,
  },
  trainerSheetHeader: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  trainerSheetAvatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.divider,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  trainerSheetAvatarImage: {
    width: '100%',
    height: '100%',
  },
  trainerSheetAvatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  trainerSheetName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  trainerSheetSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  trainerSheetBio: {
    fontSize: 13,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  trainerSheetContacts: {
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: spacing.sm,
  },
  trainerSheetContactItem: {
    paddingVertical: spacing.xs,
  },
  trainerSheetContactLabel: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  trainerSheetContactValue: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  trainerSheetEmpty: {
    fontSize: 12,
    color: colors.textSecondary,
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
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: spacing.sm,
    justifyContent: 'space-between',
    marginHorizontal: spacing.xl,
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
