import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Camera } from 'lucide-react-native';

type ProfileHeaderProps = {
  name: string;
  email: string;
  genderLabel: string;
  age: string;
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
  age,
  height,
  telegram,
  avatarUri,
  isLoading,
  onPickAvatar,
  onEditProfile,
}: ProfileHeaderProps) => (
  <View style={styles.headerWrap}>
    <View style={styles.headerCard}>
      <Text style={styles.headerKicker}>Профиль</Text>
      <Text style={styles.headerTitle}>Личные данные</Text>
      <Text style={styles.headerSubtitle}>Обновляйте профиль и связь с тренером</Text>

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
        <View style={styles.avatarInfo}>
          <Text style={styles.avatarName}>{name || (isLoading ? 'Загрузка...' : 'Имя пользователя')}</Text>
          <Text style={styles.avatarHint}>Нажмите, чтобы сменить фото</Text>
          <TouchableOpacity onPress={onPickAvatar} style={styles.avatarActionButton}>
            <Text style={styles.avatarActionText}>Выбрать фото</Text>
          </TouchableOpacity>
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
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Рост</Text>
            <Text style={styles.summaryValue}>{height ? `${height} см` : '—'}</Text>
          </View>
          <View style={[styles.summaryItem, styles.summaryItemLast]}>
            <Text style={styles.summaryLabel}>Telegram</Text>
            <Text style={styles.summaryValue}>{telegram || '—'}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={onEditProfile} style={styles.inlineEditButton}>
          <Text style={styles.inlineEditText}>Редактировать профиль</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
);

const styles = StyleSheet.create({
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
  avatarActionButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  avatarActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
  },
  summaryWrap: {
    marginTop: 16,
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
  summaryItemLast: {
    marginRight: 0,
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
});
