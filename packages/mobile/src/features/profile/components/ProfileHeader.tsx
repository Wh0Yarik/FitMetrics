import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Camera } from 'lucide-react-native';

import { Card, colors, radii, shadows, spacing } from '../../../shared/ui';

type ProfileHeaderProps = {
  name: string;
  email: string;
  genderLabel: string;
  birthDate: string;
  height: string;
  telegram: string;
  avatarUri: string | null;
  isLoading: boolean;
  onPickAvatar: () => void;
  onEditProfile: () => void;
};

export const ProfileHeader = ({
  name,
  email,
  genderLabel,
  birthDate,
  height,
  telegram,
  avatarUri,
  isLoading,
  onPickAvatar,
  onEditProfile,
}: ProfileHeaderProps) => (
  <View style={styles.headerWrap}>
    <Card style={styles.headerCard}>
      <View style={styles.avatarRow}>
        <TouchableOpacity onPress={onPickAvatar} style={styles.avatarButton} hitSlop={8}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Camera size={20} color="#6B7280" />
            </View>
          )}
        </TouchableOpacity>
        <Text style={styles.avatarName}>{name || (isLoading ? 'Загрузка...' : 'Имя пользователя')}</Text>
        <TouchableOpacity onPress={onPickAvatar} style={styles.avatarActionButton}>
          <Text style={styles.avatarActionText}>Выбрать фото</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.summaryWrap}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Рост</Text>
            <Text style={styles.summaryValue}>{height ? `${height} см` : '—'}</Text>
          </View>
          <View style={[styles.summaryItem, styles.summaryItemLast]}>
            <Text style={styles.summaryLabel}>Дата рождения</Text>
            <Text style={styles.summaryValue}>{birthDate || '—'}</Text>
          </View>
        </View>
      </View>
      <TouchableOpacity onPress={onEditProfile} style={styles.primaryEditButton}>
        <Text style={styles.primaryEditText}>Редактировать профиль</Text>
      </TouchableOpacity>
    </Card>
  </View>
);

const styles = StyleSheet.create({
  headerWrap: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
  },
  headerCard: {
    padding: spacing.md,
    borderRadius: radii.card,
    ...shadows.card,
  },
  avatarRow: {
    alignItems: 'center',
  },
  avatarButton: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.divider,
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
  avatarName: {
    marginTop: spacing.sm,
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  avatarActionButton: {
    marginTop: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.divider,
    backgroundColor: colors.surface,
  },
  avatarActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  summaryWrap: {
    marginTop: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  summaryItem: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.divider,
    padding: spacing.sm,
    marginRight: spacing.sm,
  },
  summaryItemLast: {
    marginRight: 0,
  },
  summaryLabel: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  summaryValue: {
    marginTop: spacing.xs,
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  primaryEditButton: {
    marginTop: spacing.md,
    alignSelf: 'stretch',
    paddingVertical: spacing.sm,
    borderRadius: radii.button,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  primaryEditText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.surface,
  },
});
