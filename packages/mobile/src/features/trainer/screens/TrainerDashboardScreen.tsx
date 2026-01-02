import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Plus, UserRound, ClipboardCopy, LogOut, Filter } from 'lucide-react-native';
import { router, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';

import { COLORS } from '../../../constants/Colors';
import { trainerApi, TrainerClientSummary, TrainerInvite } from '../services/trainerApi';
import { onClientsUpdated } from '../services/trainerEvents';
import { api } from '../../../shared/api/client';
import { removeToken } from '../../../shared/lib/storage';

type FilterKey = 'all' | 'attention' | 'no-measurements' | 'archived';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'Активные' },
  { key: 'attention', label: 'Требуют внимания' },
  { key: 'no-measurements', label: 'Без замеров' },
  { key: 'archived', label: 'Архив' },
];

const ClientCard = ({ client, onPress }: { client: TrainerClientSummary; onPress: () => void }) => {
  const attention = client.unreviewedSurveys > 0 || client.lastMeasurementDays === null || client.lastMeasurementDays > 7;
  const measurementLabel =
    client.lastMeasurementDays === null ? 'нет' : `${client.lastMeasurementDays} дн.`;
  return (
    <TouchableOpacity onPress={onPress} style={styles.clientCard}>
      <View style={styles.clientRow}>
        <View style={styles.clientAvatar}>
          {client.avatarUrl ? (
            <Image source={{ uri: client.avatarUrl }} style={styles.clientAvatarImage} />
          ) : (
            <UserRound size={18} color="#111827" />
          )}
        </View>
        <View style={styles.clientInfo}>
          <Text style={styles.clientName}>{client.name}</Text>
          <Text style={styles.clientMeta}>
            Приверженность: {client.complianceScore.toFixed(1)}/7
          </Text>
        </View>
        <View
          style={[
            styles.clientBadge,
            attention && styles.clientBadgeAttention,
            client.archived && styles.clientBadgeArchived,
          ]}
        >
          <Text
            style={[
              styles.clientBadgeText,
              attention && styles.clientBadgeTextAttention,
              client.archived && styles.clientBadgeTextArchived,
            ]}
          >
            {client.archived ? 'В архиве' : attention ? 'Нужно внимание' : 'Стабильно'}
          </Text>
        </View>
      </View>
      <View style={styles.clientStats}>
        <View style={styles.clientStat}>
          <Text style={styles.clientStatLabel}>Анкеты</Text>
          <Text style={styles.clientStatValue}>
            {client.unreviewedSurveys > 0 ? `⚠️ ${client.unreviewedSurveys}` : '✓'}
          </Text>
        </View>
        <View style={styles.clientStat}>
          <Text style={styles.clientStatLabel}>Замеры</Text>
          <Text style={styles.clientStatValue}>{measurementLabel}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function TrainerDashboardScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [isAddOpen, setAddOpen] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [isGenerating, setGenerating] = useState(false);
  const [isLoading, setLoading] = useState(true);
  const [clients, setClients] = useState<TrainerClientSummary[]>([]);
  const [invites, setInvites] = useState<TrainerInvite[]>([]);
  const [invitesLoading, setInvitesLoading] = useState(false);

  const loadClients = useCallback(async () => {
    try {
      const data = await trainerApi.getClients();
      setClients(data);
    } catch (error: any) {
      const message = error.response?.data?.message || 'Не удалось загрузить клиентов';
      Alert.alert('Ошибка', message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    loadClients();
  }, [loadClients]);

  useFocusEffect(
    useCallback(() => {
      loadClients();
    }, [loadClients])
  );

  useEffect(() => {
    const subscription = onClientsUpdated(() => {
      loadClients();
    });
    return () => subscription.remove();
  }, [loadClients]);

  const filteredClients = useMemo(() => {
    const searchLower = searchQuery.trim().toLowerCase();
    return clients.filter((client) => {
      const matchesSearch = !searchLower || client.name.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;

      if (activeFilter === 'archived') {
        return client.archived;
      }

      if (client.archived) {
        return false;
      }

      if (activeFilter === 'attention') {
        return client.unreviewedSurveys > 0 || client.lastMeasurementDays === null || client.lastMeasurementDays > 7;
      }
      if (activeFilter === 'no-measurements') {
        return client.lastMeasurementDays === null || client.lastMeasurementDays > 7;
      }
      return true;
    });
  }, [searchQuery, activeFilter, clients]);

  const handleOpenClient = (client: TrainerClientSummary) => {
    router.push({ pathname: '/(trainer)/client/[id]', params: { id: client.id } });
  };

  const resetInviteForm = () => {
    setInviteCode('');
  };

  const loadInvites = async () => {
    setInvitesLoading(true);
    try {
      const data = await trainerApi.getInvites();
      setInvites(data.filter((invite) => invite.isActive));
    } catch (error: any) {
      const message = error.response?.data?.message || 'Не удалось загрузить инвайты';
      Alert.alert('Ошибка', message);
    } finally {
      setInvitesLoading(false);
    }
  };

  const handleGenerateInvite = async () => {
    setGenerating(true);
    try {
      const response = await api.post('/invites');
      setInviteCode(response.data.code);
      await loadInvites();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Не удалось создать инвайт-код';
      Alert.alert('Ошибка', message);
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyInvite = async () => {
    if (!inviteCode) return;
    await Clipboard.setStringAsync(inviteCode);
    Alert.alert('Готово', 'Инвайт-код скопирован');
  };

  const handleLogout = async () => {
    Alert.alert('Выход', 'Выйти из аккаунта тренера?', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Выйти',
        style: 'destructive',
        onPress: async () => {
          await removeToken();
          await AsyncStorage.removeItem('userRole');
          router.replace('/auth/login');
        },
      },
    ]);
  };

  return (
    <View style={styles.screen}>
      <View pointerEvents="none" style={styles.bgAccentPrimary} />
      <View pointerEvents="none" style={styles.bgAccentSecondary} />
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.headerCard}>
            <View style={styles.headerRow}>
              <Text style={styles.headerKicker}>Тренер</Text>
              <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                <LogOut size={16} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <Text style={styles.headerTitle}>Клиенты</Text>
            <Text style={styles.headerSubtitle}>Контролируйте питание, анкеты и замеры</Text>
            <View style={styles.searchRow}>
              <View style={styles.searchBox}>
                <Search size={16} color="#9CA3AF" />
                <TextInput
                  placeholder="Поиск клиента"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  style={styles.searchInput}
                />
              </View>
              <TouchableOpacity onPress={() => setAddOpen(true)} style={styles.addButton}>
                <Plus size={16} color="white" />
                <Text style={styles.addButtonText}>Добавить</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.filterRow}>
            <View style={styles.filterLabel}>
              <Filter size={14} color="#6B7280" />
              <Text style={styles.filterLabelText}>Фильтры</Text>
            </View>
            <View style={styles.filterChips}>
              {FILTERS.map((filter) => (
                <TouchableOpacity
                  key={filter.key}
                  onPress={() => setActiveFilter(filter.key)}
                  style={[styles.filterChip, activeFilter === filter.key && styles.filterChipActive]}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      activeFilter === filter.key && styles.filterChipTextActive,
                    ]}
                  >
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.listWrap}>
            {isLoading ? (
              <View style={styles.loadingCard}>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={styles.loadingText}>Загружаем клиентов...</Text>
              </View>
            ) : (
              filteredClients.map((client) => (
                <ClientCard key={client.id} client={client} onPress={() => handleOpenClient(client)} />
              ))
            )}
            {!isLoading && filteredClients.length === 0 && (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>Клиенты не найдены</Text>
                <Text style={styles.emptySubtitle}>Измените фильтры или добавьте нового клиента</Text>
              </View>
            )}
          </View>
        </ScrollView>

        <Modal
          visible={isAddOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setAddOpen(false)}
          onShow={loadInvites}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Новый клиент</Text>
              <Text style={styles.modalSubtitle}>
                Сгенерируйте инвайт-код и передайте его клиенту для регистрации.
              </Text>

              <TouchableOpacity
                onPress={handleGenerateInvite}
                style={[styles.primaryButton, isGenerating && styles.primaryButtonDisabled]}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryButtonText}>Сгенерировать инвайт-код</Text>
                )}
              </TouchableOpacity>

              {inviteCode ? (
                <View style={styles.inviteCard}>
                  <Text style={styles.inviteLabel}>Инвайт-код</Text>
                  <View style={styles.inviteRow}>
                    <Text style={styles.inviteCode}>{inviteCode}</Text>
                    <TouchableOpacity onPress={handleCopyInvite} style={styles.inviteCopyButton}>
                      <ClipboardCopy size={16} color="#111827" />
                      <Text style={styles.inviteCopyText}>Копировать</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : null}

              <View style={styles.activeInvites}>
                <Text style={styles.activeInvitesTitle}>Активные инвайты</Text>
                {invitesLoading ? (
                  <View style={styles.invitesLoading}>
                    <ActivityIndicator size="small" color={COLORS.primary} />
                    <Text style={styles.invitesLoadingText}>Загружаем...</Text>
                  </View>
                ) : invites.length === 0 ? (
                  <Text style={styles.activeInvitesEmpty}>Активных инвайтов нет</Text>
                ) : (
                  invites.map((invite) => (
                    <View key={invite.id} style={styles.activeInviteRow}>
                      <Text style={styles.activeInviteCode}>{invite.code}</Text>
                      <TouchableOpacity onPress={() => Clipboard.setStringAsync(invite.code)} style={styles.inviteMiniCopy}>
                        <ClipboardCopy size={14} color="#111827" />
                        <Text style={styles.inviteMiniCopyText}>Копировать</Text>
                      </TouchableOpacity>
                    </View>
                  ))
                )}
              </View>

              <TouchableOpacity
                onPress={() => {
                  resetInviteForm();
                  setAddOpen(false);
                }}
                style={styles.secondaryButton}
              >
                <Text style={styles.secondaryButtonText}>Закрыть</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F7FAF8',
  },
  safe: {
    flex: 1,
  },
  bgAccentPrimary: {
    position: 'absolute',
    top: -120,
    right: -80,
    width: 220,
    height: 220,
    borderRadius: 999,
    backgroundColor: '#DCFCE7',
    opacity: 0.7,
  },
  bgAccentSecondary: {
    position: 'absolute',
    top: 140,
    left: -110,
    width: 240,
    height: 240,
    borderRadius: 999,
    backgroundColor: '#E0F2FE',
    opacity: 0.5,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 120,
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerKicker: {
    color: '#6B7280',
    fontSize: 12,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginTop: 6,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 6,
  },
  logoutButton: {
    width: 32,
    height: 32,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchRow: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 12,
  },
  searchInput: {
    marginLeft: 8,
    fontSize: 14,
    color: '#111827',
    flex: 1,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  filterRow: {
    marginTop: 16,
  },
  filterLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  filterLabelText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  filterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  filterChipActive: {
    borderColor: '#BBF7D0',
    backgroundColor: '#ECFDF3',
  },
  filterChipText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: COLORS.primary,
  },
  listWrap: {
    marginTop: 16,
  },
  clientCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    marginBottom: 12,
  },
  clientRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clientAvatar: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#ECFDF3',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  clientAvatarImage: {
    width: '100%',
    height: '100%',
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  clientMeta: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  clientBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#F3F4F6',
  },
  clientBadgeAttention: {
    backgroundColor: '#FEF2F2',
  },
  clientBadgeArchived: {
    backgroundColor: '#E5E7EB',
  },
  clientBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7280',
  },
  clientBadgeTextAttention: {
    color: '#EF4444',
  },
  clientBadgeTextArchived: {
    color: '#4B5563',
  },
  clientStats: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 12,
  },
  clientStat: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  clientStatLabel: {
    fontSize: 10,
    color: '#6B7280',
  },
  clientStatValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    marginTop: 4,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 20,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  emptySubtitle: {
    marginTop: 6,
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  loadingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 12,
    color: '#6B7280',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 4,
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  inviteCard: {
    marginTop: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
    backgroundColor: '#F9FAFB',
  },
  inviteLabel: {
    fontSize: 11,
    color: '#6B7280',
  },
  inviteRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inviteCode: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: 1.5,
  },
  inviteCopyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  inviteCopyText: {
    fontSize: 12,
    color: '#111827',
    fontWeight: '600',
  },
  activeInvites: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  activeInvitesTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  activeInvitesEmpty: {
    fontSize: 12,
    color: '#6B7280',
  },
  activeInviteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  activeInviteCode: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: 1.4,
  },
  inviteMiniCopy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  inviteMiniCopyText: {
    fontSize: 11,
    color: '#111827',
    fontWeight: '600',
  },
  invitesLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  invitesLoadingText: {
    fontSize: 12,
    color: '#6B7280',
  },
  secondaryButton: {
    marginTop: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
});
