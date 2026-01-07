import React from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Phone, Send } from 'lucide-react-native';

import { AppButton, colors, fonts, spacing } from '../../../shared/ui';
import { SharedBottomSheet } from './SharedBottomSheet';

type TrainerContact = { label: string; value: string };

type TrainerSheetProps = {
  visible: boolean;
  onClose: () => void;
  trainerAvatar: string | null;
  trainerDisplayName: string;
  trainerSpecialization: string;
  trainerBio: string;
  trainerContacts: TrainerContact[];
  onContactPress: (label: string, value: string) => void;
  onRemoveTrainer: () => void;
};

const getContactIcon = (label: string, value: string) => {
  const normalizedLabel = label.toLowerCase();
  const normalizedValue = value.toLowerCase();
  if (normalizedLabel.includes('телефон') || /\d{5,}/.test(value)) {
    return Phone;
  }
  if (normalizedLabel.includes('telegram') || normalizedValue.includes('t.me') || normalizedValue.startsWith('@')) {
    return Send;
  }
  return Send;
};

export const TrainerSheet = ({
  visible,
  onClose,
  trainerAvatar,
  trainerDisplayName,
  trainerSpecialization,
  trainerBio,
  trainerContacts,
  onContactPress,
  onRemoveTrainer,
}: TrainerSheetProps) => (
  <SharedBottomSheet visible={visible} onClose={onClose}>
    <View style={styles.header}>
      <Text style={styles.title}>Тренер</Text>
    </View>
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.trainerHeader}>
        <View style={styles.avatar}>
          {trainerAvatar ? (
            <Image source={{ uri: trainerAvatar }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarText}>{trainerDisplayName.charAt(0)}</Text>
          )}
        </View>
        <Text style={styles.name}>{trainerDisplayName}</Text>
        {trainerSpecialization ? <Text style={styles.subtitle}>{trainerSpecialization}</Text> : null}
      </View>

      {trainerBio ? <Text style={styles.bio}>{trainerBio}</Text> : null}

      <View style={styles.contacts}>
        {trainerContacts.length === 0 ? (
          <Text style={styles.empty}>Контакты не указаны</Text>
        ) : (
          trainerContacts.map((contact) => {
            const Icon = getContactIcon(contact.label, contact.value);
            return (
              <TouchableOpacity
                key={`${contact.label}-${contact.value}`}
                onPress={() => onContactPress(contact.label, contact.value)}
                style={styles.contactRow}
              >
                <View style={styles.contactIconWrap}>
                  <Icon size={18} color={colors.textPrimary} strokeWidth={1.5} />
                </View>
                <View style={styles.contactTextWrap}>
                  <Text style={styles.contactLabel}>{contact.label}</Text>
                  <Text style={styles.contactValue}>{contact.value}</Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </View>

      <View style={styles.actionRow}>
        <AppButton
          title="Расстаться с тренером"
          onPress={onRemoveTrainer}
          variant="danger"
          size="md"
          style={styles.actionButton}
        />
      </View>
    </ScrollView>
  </SharedBottomSheet>
);

const styles = StyleSheet.create({
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
  trainerHeader: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.divider,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    fontSize: 30,
    fontFamily: fonts.semibold,
    color: colors.textSecondary,
  },
  name: {
    fontSize: 18,
    fontFamily: fonts.semibold,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  bio: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  contacts: {
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: spacing.md,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  contactIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  contactTextWrap: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
  },
  contactValue: {
    marginTop: 2,
    fontSize: 16,
    fontFamily: fonts.semibold,
    color: colors.textPrimary,
  },
  empty: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
  },
  actionRow: {
    flexDirection: 'column',
    alignItems: 'stretch',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  actionButton: {
    width: '100%',
  },
});
