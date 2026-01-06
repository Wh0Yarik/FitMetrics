import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

type TrainerContact = { label: string; value: string };

type TrainerCardProps = {
  trainerDisplayName: string;
  trainerDisplayStatus: string;
  trainerAvatar: string | null;
  trainerContacts: TrainerContact[];
};

export const TrainerCard = ({
  trainerDisplayName,
  trainerDisplayStatus,
  trainerAvatar,
  trainerContacts,
}: TrainerCardProps) => (
  <View style={styles.trainerCard}>
    <View style={styles.trainerHeader}>
      <View style={styles.trainerInfoRow}>
        <View style={styles.trainerAvatar}>
          {trainerAvatar ? (
            <Image source={{ uri: trainerAvatar }} style={styles.trainerAvatarImage} />
          ) : (
            <Text style={styles.trainerAvatarText}>{trainerDisplayName.charAt(0)}</Text>
          )}
        </View>
        <View>
          <Text style={styles.trainerName}>{trainerDisplayName}</Text>
        </View>
      </View>
    </View>

    <View style={styles.trainerContacts}>
      {trainerContacts.length === 0 ? (
        <Text style={styles.trainerContactEmpty}>Контакты не указаны</Text>
      ) : (
        trainerContacts.map((contact) => (
          <View key={contact.label} style={styles.trainerContactItem}>
            <Text style={styles.trainerContactLabel}>{contact.label}</Text>
            <Text style={styles.trainerContactValue}>{contact.value}</Text>
          </View>
        ))
      )}
    </View>
  </View>
);

const styles = StyleSheet.create({
  trainerCard: {
    marginTop: 12,
    marginHorizontal: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 14,
  },
  trainerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  trainerInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trainerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  trainerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    overflow: 'hidden',
  },
  trainerAvatarImage: {
    width: '100%',
    height: '100%',
  },
  trainerAvatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6B7280',
  },
  trainerContacts: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 10,
  },
  trainerContactEmpty: {
    fontSize: 12,
    color: '#6B7280',
  },
  trainerContactItem: {
    marginBottom: 8,
  },
  trainerContactLabel: {
    fontSize: 11,
    color: '#6B7280',
  },
  trainerContactValue: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
});
