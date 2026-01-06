import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Camera, Pencil } from 'lucide-react-native';

import { Card, colors, radii, shadows, spacing } from '../../../shared/ui';

type ProfileHeaderProps = {
  name: string;
  avatarUri: string | null;
  isLoading: boolean;
  onPickAvatar: () => void;
  onEditProfile: () => void;
};

export const ProfileHeader = ({
  name,
  avatarUri,
  isLoading,
  onPickAvatar,
  onEditProfile,
}: ProfileHeaderProps) => (
  <View style={styles.headerWrap}>
    <Card style={styles.headerCard}>
      <TouchableOpacity onPress={onEditProfile} style={styles.editIconButton}>
        <Pencil size={16} color={colors.textPrimary} />
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
          <View style={styles.avatarBadge}>
            <Camera size={14} color={colors.surface} />
          </View>
        </View>
        <Text style={styles.avatarName}>{name || (isLoading ? 'Загрузка...' : 'Имя пользователя')}</Text>
      </View>
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
  editIconButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 32,
    height: 32,
    borderRadius: 16,
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
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
});
