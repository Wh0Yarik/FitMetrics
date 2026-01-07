import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Camera, LogOut } from 'lucide-react-native';

import { colors, fonts, radii, spacing } from '../../../shared/ui';

type ProfileHeaderProps = {
  name: string;
  avatarUri: string | null;
  isLoading: boolean;
  birthDate: string;
  height: string;
  currentWeight: number | null;
  onPickAvatar: () => void;
  onLogout: () => void;
};

export const ProfileHeader = ({
  name,
  avatarUri,
  isLoading,
  birthDate,
  height,
  currentWeight,
  onPickAvatar,
  onLogout,
}: ProfileHeaderProps) => {
  const normalizedBirthDate = birthDate.trim();
  let ageText = '-- лет';
  if (normalizedBirthDate.length === 10) {
    const [day, month, year] = normalizedBirthDate.split('.').map((value) => Number(value));
    if (!Number.isNaN(day) && !Number.isNaN(month) && !Number.isNaN(year)) {
      const today = new Date();
      const birth = new Date(year, month - 1, day);
      let age = today.getFullYear() - birth.getFullYear();
      const hasBirthdayPassed =
        today.getMonth() > birth.getMonth() ||
        (today.getMonth() === birth.getMonth() && today.getDate() >= birth.getDate());
      if (!hasBirthdayPassed) {
        age -= 1;
      }
      if (age >= 0 && age < 130) {
        ageText = `${age} лет`;
      }
    }
  }

  const heightText = height.trim() ? `${height.trim()} см` : '-- см';
  const weightValue = currentWeight != null && Number.isFinite(currentWeight)
    ? Math.round(currentWeight * 10) / 10
    : null;
  const weightText = weightValue != null ? `${weightValue} кг` : '-- кг';

  return (
    <View style={styles.headerWrap}>
      <TouchableOpacity onPress={onLogout} style={styles.logOutIconButton}>
        <LogOut size={24} color={colors.textPrimary} />
      </TouchableOpacity>
      <View style={styles.avatarRow}>
        <View style={styles.avatarWrap}>
          <TouchableOpacity onPress={onPickAvatar} style={styles.avatarButton} hitSlop={8}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Camera size={20} color="#6B7280" />
              </View>
            )}
          </TouchableOpacity>
        </View>
        <Text style={styles.avatarName}>{name || (isLoading ? 'Загрузка...' : 'Имя пользователя')}</Text>
        <View style={styles.avatarMetaRow}>
          <Text style={styles.avatarMeta}>{ageText}</Text>
          <Text style={styles.avatarMeta}>{heightText}</Text>
          <Text style={styles.avatarMeta}>{weightText}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerWrap: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
  },
  logOutIconButton: {
    position: 'absolute',
    top: 0,
    right: spacing.xl,
    width: 44,
    height: 44,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  avatarRow: {
    alignItems: 'center',
  },
  avatarWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarButton: {
    width: 160,
    height: 160,
    borderRadius: 56,
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.divider,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarBadge: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.textPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
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
  avatarName: {
    marginTop: spacing.sm,
    fontSize: 32,
    fontFamily: 'Comfortaa-Bold',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  avatarMeta: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  avatarMetaRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
});
