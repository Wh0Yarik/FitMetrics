import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Plus, UserRound, ClipboardCopy, Filter, Ban } from 'lucide-react-native';
import { router, useFocusEffect } from 'expo-router';
import * as Clipboard from 'expo-clipboard';

import { COLORS } from '../../../constants/Colors';
import { trainerApi, TrainerClientSummary, TrainerInvite } from '../services/trainerApi';
import { onClientsUpdated } from '../services/trainerEvents';
import { api } from '../../../shared/api/client';
import { SharedBottomSheet } from '../../profile/components/SharedBottomSheet';
import { useTabBarVisibility } from '../../../shared/ui';

type FilterKey = 'all' | 'attention' | 'unreviewed' | 'no-measurements' | 'archived';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'Активные' },
  { key: 'attention', label: 'Требуют внимания' },
  { key: 'unreviewed', label: 'Анкеты' },
  { key: 'no-measurements', label: 'Без замеров' },
  { key: 'archived', label: 'Архив' },
];

const ClientCard = ({ client, onPress }: { client: TrainerClientSummary; onPress: () => void }) => {
  const attention = client.unreviewedSurveys > 0 || client.lastMeasurementDays === null || client.lastMeasurementDays > 7;
  const measurementLabel = client.lastMeasurementDays === null ? 'нет' : `${client.lastMeasurementDays} дн.`;
  const measurementMeta = measurementLabel;
  const measurementOverdue = client.lastMeasurementDays !== null && client.lastMeasurementDays >= 14;
  const statusLabel = client.archived ? 'В архиве' : attention ? 'Нужно внимание' : 'Стабильно';
  return (
    <TouchableOpacity onPress={onPress} style={styles.clientCard}>
      <View style={styles.clientHeader}>
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
            Приверженность <Text style={styles.clientScoreInline}>{client.complianceScore.toFixed(1)}/7</Text>
          </Text>
        </View>
        <View style={[styles.clientBadge, attention && styles.clientBadgeAttention, client.archived && styles.clientBadgeArchived]}>
          <Text style={[styles.clientBadgeText, attention && styles.clientBadgeTextAttention, client.archived && styles.clientBadgeTextArchived]}>
            {statusLabel}
          </Text>
        </View>
      </View>
      <View style={styles.clientFooter}>
        <View style={[styles.clientChip, client.unreviewedSurveys > 0 && styles.clientChipAttention]}>
          <Text style={styles.clientChipLabel}>Анкеты</Text>
          <Text style={[styles.clientChipValue, client.unreviewedSurveys > 0 && styles.clientChipValueAttention]}>
            {client.unreviewedSurveys > 0 ? `⚠️ ${client.unreviewedSurveys}` : '✓'}
          </Text>
        </View>
        <View style={[styles.clientChip, measurementOverdue && styles.clientChipAttention]}>
          <Text style={styles.clientChipLabel}>Замеры</Text>
          <Text style={[styles.clientChipValue, measurementOverdue && styles.clientChipValueAttention]}>
            {measurementOverdue ? `⚠️ ${measurementMeta}` : measurementMeta}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const ClientSkeleton = ({ shimmer }: { shimmer: Animated.Value }) => {
  const shimmerColor = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: ['#F3F4F6', '#E5E7EB'],
  });
  return (
  <View style={styles.skeletonCard}>
    <View style={styles.skeletonHeader}>
      <Animated.View style={[styles.skeletonAvatar, { backgroundColor: shimmerColor }]} />
      <View style={styles.skeletonTitleWrap}>
        <Animated.View style={[styles.skeletonLineShort, { backgroundColor: shimmerColor }]} />
        <Animated.View style={[styles.skeletonLine, { backgroundColor: shimmerColor }]} />
      </View>
    </View>
    <View style={styles.skeletonChips}>
      <Animated.View style={[styles.skeletonChip, { backgroundColor: shimmerColor }]} />
      <Animated.View style={[styles.skeletonChip, { backgroundColor: shimmerColor }]} />
    </View>
  </View>
  );
};

export default function TrainerDashboardScreen() {
  const { setHidden: setTabBarHidden } = useTabBarVisibility();
  const shimmer = useRef(new Animated.Value(0)).current;
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [isAddOpen, setAddOpen] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [inviteClientName, setInviteClientName] = useState('');
  const [isGenerating, setGenerating] = useState(false);
  const [isLoading, setLoading] = useState(true);
  const [clients, setClients] = useState<TrainerClientSummary[]>([]);
  const [invites, setInvites] = useState<TrainerInvite[]>([]);
  const [invitesLoading, setInvitesLoading] = useState(false);

  const activeClientsCount = clients.filter((client) => !client.archived).length;
  const attentionClientsCount = clients.filter((client) => !client.archived && client.unreviewedSurveys > 0).length;
  const archivedClientsCount = clients.filter((client) => client.archived).length;

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

  useEffect(() => {
    if (isAddOpen) {
      loadInvites();
    }
    setTabBarHidden(isAddOpen);
  }, [isAddOpen, loadInvites, setTabBarHidden]);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: false }),
        Animated.timing(shimmer, { toValue: 0, duration: 900, useNativeDriver: false }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [shimmer]);

  const filteredClients = useMemo(() => {
    const searchLower = searchQuery.trim().toLowerCase();
    const filtered = clients.filter((client) => {
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
      if (activeFilter === 'unreviewed') {
        return client.unreviewedSurveys > 0;
      }
      if (activeFilter === 'no-measurements') {
        return client.lastMeasurementDays === null || client.lastMeasurementDays > 7;
      }
      return true;
    });
    if (activeFilter === 'archived') {
      return filtered;
    }
    return [...filtered].sort((a, b) => {
      const aNeedsAttention = a.unreviewedSurveys > 0 ? 1 : 0;
      const bNeedsAttention = b.unreviewedSurveys > 0 ? 1 : 0;
      if (aNeedsAttention !== bNeedsAttention) {
        return bNeedsAttention - aNeedsAttention;
      }
      if (a.unreviewedSurveys !== b.unreviewedSurveys) {
        return b.unreviewedSurveys - a.unreviewedSurveys;
      }
      return a.name.localeCompare(b.name, 'ru');
    });
  }, [searchQuery, activeFilter, clients]);

  const handleOpenClient = (client: TrainerClientSummary) => {
    router.push({ pathname: '/(trainer)/client/[id]', params: { id: client.id } });
  };

  const resetInviteForm = () => {
    setInviteCode('');
    setInviteClientName('');
  };

  const loadInvites = useCallback(async () => {
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
  }, []);

  const handleGenerateInvite = async () => {
    setGenerating(true);
    try {
      const payload = inviteClientName.trim() ? { clientName: inviteClientName.trim() } : undefined;
      const response = await api.post('/invites', payload);
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

  const handleDeactivateInvite = async (inviteId: string) => {
    try {
      await trainerApi.deactivateInvite(inviteId);
      await loadInvites();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Не удалось деактивировать инвайт';
      Alert.alert('Ошибка', message);
    }
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
            </View>
            <View style={styles.headerTitleRow}>
              <View style={styles.headerTitleBlock}>
                <Text style={styles.headerTitle}>Клиенты</Text>
                <Text style={styles.headerSubtitle}>Контролируйте питание, анкеты и замеры</Text>
              </View>
              <TouchableOpacity onPress={() => setAddOpen(true)} style={styles.addButton}>
                <Plus size={16} color="white" />
                <Text style={styles.addButtonText}>Добавить</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.headerStats}>
              <TouchableOpacity
                onPress={() => setActiveFilter('all')}
                style={[styles.headerStatCard, activeFilter === 'all' && styles.headerStatCardActive]}
              >
                <Text style={[styles.headerStatLabel, activeFilter === 'all' && styles.headerStatLabelActive]}>
                  Активные
                </Text>
                <Text style={[styles.headerStatValue, activeFilter === 'all' && styles.headerStatValueActive]}>
                  {activeClientsCount}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setActiveFilter('attention')}
                style={[styles.headerStatCard, styles.headerStatCardAttention, activeFilter === 'attention' && styles.headerStatCardActive]}
              >
                <Text style={[styles.headerStatLabel, activeFilter === 'attention' && styles.headerStatLabelActive]}>
                  Внимание
                </Text>
                <Text style={[styles.headerStatValue, activeFilter === 'attention' && styles.headerStatValueActive]}>
                  {attentionClientsCount}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setActiveFilter('archived')}
                style={[styles.headerStatCard, activeFilter === 'archived' && styles.headerStatCardActive]}
              >
                <Text style={[styles.headerStatLabel, activeFilter === 'archived' && styles.headerStatLabelActive]}>
                  Архив
                </Text>
                <Text style={[styles.headerStatValue, activeFilter === 'archived' && styles.headerStatValueActive]}>
                  {archivedClientsCount}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

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
          </View>

          <View style={styles.filterRow}>
            <View style={styles.filterLabel}>
              <Filter size={14} color="#6B7280" />
              <Text style={styles.filterLabelText}>Фильтры</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterChips}
            >
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
            </ScrollView>
          </View>

          <View style={styles.listWrap}>
            {isLoading ? (
              <View>
                {Array.from({ length: 4 }).map((_, index) => (
                  <ClientSkeleton key={`skeleton-${index}`} shimmer={shimmer} />
                ))}
              </View>
            ) : (
              filteredClients.map((client) => (
                <ClientCard key={client.id} client={client} onPress={() => handleOpenClient(client)} />
              ))
            )}
            {!isLoading && filteredClients.length === 0 && (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>Клиентов пока нет</Text>
                <Text style={styles.emptySubtitle}>Создайте инвайт и отправьте его клиенту</Text>
                <TouchableOpacity onPress={() => setAddOpen(true)} style={styles.emptyButton}>
                  <Plus size={16} color="#FFFFFF" />
                  <Text style={styles.emptyButtonText}>Создать инвайт</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>

        <SharedBottomSheet
          visible={isAddOpen}
          onClose={() => {
            resetInviteForm();
            setAddOpen(false);
          }}
          headerSwipeHeight={56}
        >
          <View style={styles.sheetContent}>
            <Text style={styles.modalTitle}>Новый клиент</Text>
            <Text style={styles.modalSubtitle}>
              Сгенерируйте инвайт-код и передайте его клиенту для регистрации.
            </Text>

            <View style={styles.inviteInputWrap}>
              <Text style={styles.inviteInputLabel}>Имя клиента</Text>
              <TextInput
                value={inviteClientName}
                onChangeText={setInviteClientName}
                placeholder="Например: Мария К."
                placeholderTextColor="#9CA3AF"
                style={styles.inviteInput}
              />
            </View>

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
                <ScrollView style={styles.activeInvitesList} showsVerticalScrollIndicator={false}>
                  {invites.map((invite) => (
                    <View key={invite.id} style={styles.activeInviteRow}>
                      <View style={styles.activeInviteInfo}>
                        <Text style={styles.activeInviteName}>{invite.clientName || 'Без имени'}</Text>
                        <Text style={styles.activeInviteCode}>{invite.code}</Text>
                      </View>
                      <View style={styles.activeInviteActions}>
                        <TouchableOpacity
                          onPress={() => Clipboard.setStringAsync(invite.code)}
                          style={styles.inviteActionButton}
                        >
                          <ClipboardCopy size={16} color="#111827" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleDeactivateInvite(invite.id)}
                          style={[styles.inviteActionButton, styles.inviteActionDanger]}
                        >
                          <Ban size={16} color="#DC2626" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </ScrollView>
              )}
            </View>

          </View>
        </SharedBottomSheet>
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
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  headerTitleBlock: {
    flex: 1,
  },
  headerTitleRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 6,
  },
  headerStats: {
    marginTop: 14,
    flexDirection: 'row',
    gap: 10,
  },
  headerStatCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 12,
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  headerStatCardAttention: {
    backgroundColor: '#FFF7ED',
  },
  headerStatCardActive: {
    backgroundColor: '#E0F2FE',
  },
  headerStatLabel: {
    fontSize: 11,
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  headerStatValue: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    fontVariant: ['tabular-nums'],
  },
  headerStatLabelActive: {
    color: '#0F172A',
  },
  headerStatValueActive: {
    color: '#0F172A',
  },
  searchRow: {
    marginTop: 16,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
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
    gap: 8,
    paddingVertical: 8,
    paddingRight: 12,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  filterChipActive: {
    backgroundColor: '#E0F2FE',
  },
  filterChipText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#0F172A',
  },
  listWrap: {
    marginTop: 16,
  },
  sheetContent: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  clientCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    marginBottom: 16,
  },
  clientHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  clientAvatar: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: '#E0F2FE',
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
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
  },
  clientMeta: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 6,
    letterSpacing: 0.2,
  },
  clientScoreInline: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    fontVariant: ['tabular-nums'],
  },
  clientBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#ECFDF3',
  },
  clientBadgeAttention: {
    backgroundColor: '#FEF3C7',
  },
  clientBadgeArchived: {
    backgroundColor: '#E5E7EB',
  },
  clientBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#0F766E',
  },
  clientBadgeTextAttention: {
    color: '#92400E',
  },
  clientBadgeTextArchived: {
    color: '#4B5563',
  },
  clientFooter: {
    marginTop: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  clientChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#F3F4F6',
  },
  clientChipAttention: {
    backgroundColor: '#FEF3C7',
  },
  clientChipLabel: {
    fontSize: 11,
    color: '#6B7280',
  },
  clientChipValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
    fontVariant: ['tabular-nums'],
  },
  clientChipValueAttention: {
    color: '#92400E',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  emptySubtitle: {
    marginTop: 6,
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  emptyButton: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  skeletonCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  skeletonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  skeletonAvatar: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    marginRight: 12,
  },
  skeletonTitleWrap: {
    flex: 1,
  },
  skeletonLine: {
    height: 10,
    borderRadius: 999,
    backgroundColor: '#F3F4F6',
    marginTop: 8,
    width: '70%',
  },
  skeletonLineShort: {
    height: 12,
    borderRadius: 999,
    backgroundColor: '#E5E7EB',
    width: '45%',
  },
  skeletonChips: {
    marginTop: 16,
    flexDirection: 'row',
    gap: 10,
  },
  skeletonChip: {
    height: 26,
    borderRadius: 999,
    backgroundColor: '#F3F4F6',
    width: '32%',
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
  inviteInputWrap: {
    marginTop: 4,
  },
  inviteInputLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 6,
    fontWeight: '600',
  },
  inviteInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#111827',
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
  },
  activeInvitesTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  activeInvitesList: {
    maxHeight: 220,
  },
  activeInvitesEmpty: {
    fontSize: 12,
    color: '#6B7280',
  },
  activeInviteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    marginBottom: 10,
  },
  activeInviteInfo: {
    flex: 1,
    marginRight: 12,
  },
  activeInviteName: {
    fontSize: 13,
    color: '#9CA3AF',
    marginBottom: 4,
    fontWeight: '600',
  },
  activeInviteCode: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: 1.4,
  },
  activeInviteActions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  inviteActionButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviteActionDanger: {
    backgroundColor: '#FEF2F2',
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
});
