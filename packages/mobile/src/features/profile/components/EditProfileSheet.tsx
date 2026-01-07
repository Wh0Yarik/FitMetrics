import React, { useMemo } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { AppButton, AppInput, colors, fonts, spacing } from '../../../shared/ui';
import { normalizeBirthDateInput } from '../../../shared/lib/date';
import { SharedBottomSheet } from './SharedBottomSheet';
import { GenderKey } from '../model/useUserProfile';

const GENDERS = [
  { key: 'male', label: 'Мужской' },
  { key: 'female', label: 'Женский' },
] as const;

type EditProfileSheetProps = {
  visible: boolean;
  onClose: () => void;
  profile: {
    name: string;
    gender: GenderKey | null;
    birthDate: string;
    height: string;
    telegram: string;
    email: string;
    setName: React.Dispatch<React.SetStateAction<string>>;
    setGender: React.Dispatch<React.SetStateAction<GenderKey | null>>;
    setBirthDate: React.Dispatch<React.SetStateAction<string>>;
    setHeight: React.Dispatch<React.SetStateAction<string>>;
    setTelegram: React.Dispatch<React.SetStateAction<string>>;
  };
  onSave: () => Promise<void> | void;
};

export const EditProfileSheet = ({ visible, onClose, profile, onSave }: EditProfileSheetProps) => {
  const genderOptions = useMemo(() => GENDERS, []);

  return (
    <SharedBottomSheet visible={visible} onClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboard}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Редактировать профиль</Text>
        </View>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <AppInput
            label="Имя"
            value={profile.name}
            onChangeText={profile.setName}
            placeholder="Введите имя"
            containerStyle={styles.field}
            style={styles.input}
          />

          <AppInput
            label="Telegram"
            value={profile.telegram}
            onChangeText={profile.setTelegram}
            placeholder="@username"
            autoCapitalize="none"
            containerStyle={styles.field}
            style={styles.input}
          />

          <AppInput
            label="Почта"
            value={profile.email}
            placeholder="Введите почту"
            keyboardType="email-address"
            editable={false}
            containerStyle={styles.field}
            style={[styles.input, styles.fieldInputDisabled]}
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
                containerStyle={styles.field}
                style={styles.input}
              />
            </View>
            <View style={[styles.fieldHalf, styles.fieldHalfLast]}>
              <AppInput
                label="Рост (см)"
                value={profile.height}
                onChangeText={profile.setHeight}
                placeholder="0"
                keyboardType="numeric"
                containerStyle={styles.field}
                style={styles.input}
              />
            </View>
          </View>

          <View style={styles.actionRow}>
            <AppButton title="Сохранить" onPress={onSave} size="md" style={styles.actionButton} />
            <AppButton
              title="Отмена"
              onPress={onClose}
              variant="secondary"
              size="md"
              style={styles.actionButton}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SharedBottomSheet>
  );
};

const styles = StyleSheet.create({
  keyboard: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 16,
    fontFamily: fonts.semibold,
    color: colors.textPrimary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  field: {
    marginBottom: spacing.md,
  },
  fieldLabel: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  input: {
    height: 52,
    fontSize: 15,
    fontFamily: fonts.medium,
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
    fontFamily: fonts.medium,
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
    alignItems: 'stretch',
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  actionButton: {
    width: '100%',
  },
});
