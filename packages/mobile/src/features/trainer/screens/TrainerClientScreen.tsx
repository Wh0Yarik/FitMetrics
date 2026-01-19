import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Camera, CheckCircle2, Archive } from 'lucide-react-native';

import { COLORS } from '../../../constants/Colors';
import { trainerApi, TrainerClientDetail } from '../services/trainerApi';
import { emitClientsUpdated } from '../services/trainerEvents';

type TabKey = 'nutrition' | 'surveys' | 'measurements';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'nutrition', label: 'Питание' },
  { key: 'surveys', label: 'Анкеты' },
  { key: 'measurements', label: 'Замеры' },
];

export default function TrainerClientScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [client, setClient] = useState<TrainerClientDetail | null>(null);
  const [isLoading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<TabKey>('nutrition');
  const [expandedSurveyId, setExpandedSurveyId] = useState<string | null>(null);
  const [showPhotos, setShowPhotos] = useState(false);
  const [activePhotos, setActivePhotos] = useState<string[]>([]);
  const [goals, setGoals] = useState({ protein: '', fat: '', carbs: '', fiber: '' });

  const handleSaveGoals = async () => {
    const protein = Number(goals.protein);
    const fat = Number(goals.fat);
    const carbs = Number(goals.carbs);
    const fiber = goals.fiber === '' ? null : Number(goals.fiber);

    if ([protein, fat, carbs].some((value) => Number.isNaN(value))) {
      Alert.alert('Ошибка', 'Введите корректные значения целей');
      return;
    }
    if (fiber !== null && Number.isNaN(fiber)) {
      Alert.alert('Ошибка', 'Введите корректное значение клетчатки');
      return;
    }

    try {
      await trainerApi.updateGoals(client.id, { protein, fat, carbs, fiber });
      Alert.alert('Готово', 'Цели обновлены');
      setClient((prev) =>
        prev
          ? {
              ...prev,
              goals: {
                protein,
                fat,
                carbs,
                fiber: fiber ?? 0,
              },
            }
          : prev
      );
    } catch (error: any) {
      const message = error.response?.data?.message || 'Не удалось обновить цели';
      Alert.alert('Ошибка', message);
    }
  };

  const handleArchiveClient = () => {
    Alert.alert('Архивировать клиента', 'Клиент будет скрыт из активного списка. Продолжить?', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Архивировать',
        style: 'destructive',
        onPress: async () => {
          try {
            await trainerApi.archiveClient(client.id);
            setClient((prev) => (prev ? { ...prev, archived: true } : prev));
            emitClientsUpdated();
            Alert.alert('Готово', 'Клиент отправлен в архив');
            router.back();
          } catch (error: any) {
            const message = error.response?.data?.message || 'Не удалось архивировать клиента';
            Alert.alert('Ошибка', message);
          }
        },
      },
    ]);
  };

  const handleUnarchiveClient = () => {
    Alert.alert('Вернуть клиента', 'Клиент появится в активном списке. Продолжить?', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Вернуть',
        style: 'default',
        onPress: async () => {
          try {
            await trainerApi.unarchiveClient(client.id);
            setClient((prev) => (prev ? { ...prev, archived: false } : prev));
            emitClientsUpdated();
            Alert.alert('Готово', 'Клиент возвращен из архива');
          } catch (error: any) {
            const message = error.response?.data?.message || 'Не удалось вернуть клиента';
            Alert.alert('Ошибка', message);
          }
        },
      },
    ]);
  };

  useEffect(() => {
    const loadClient = async () => {
      if (!id) return;
      try {
        const data = await trainerApi.getClientDetail(id);
        setClient(data);
        setGoals({
          protein: data.goals?.protein?.toString() ?? '',
          fat: data.goals?.fat?.toString() ?? '',
          carbs: data.goals?.carbs?.toString() ?? '',
          fiber: data.goals?.fiber?.toString() ?? '',
        });
      } catch (error: any) {
        const message = error.response?.data?.message || 'Не удалось загрузить клиента';
        Alert.alert('Ошибка', message);
      } finally {
        setLoading(false);
      }
    };

    loadClient();
  }, [id]);

  const lastMeasurementDays = useMemo(() => {
    const latest = client?.measurements?.[0]?.date;
    if (!latest) return '—';
    const parsed = new Date(latest);
    const date = Number.isNaN(parsed.getTime())
      ? (() => {
          const parts = latest.split('.');
          if (parts.length !== 3) return null;
          const [day, month, year] = parts.map((part) => Number(part));
          const fallback = new Date(year, month - 1, day);
          return Number.isNaN(fallback.getTime()) ? null : fallback;
        })()
      : parsed;
    if (!date) return '—';
    const diffMs = Date.now() - date.getTime();
    const days = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    return `${days} дн`;
  }, [client]);

  if (isLoading) {
    return (
      <View style={styles.screen}>
        <SafeAreaView style={styles.safe}>
          <View style={styles.emptyState}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.emptySubtitle}>Загружаем данные...</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (!client) {
    return (
      <View style={styles.screen}>
        <SafeAreaView style={styles.safe}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={18} color="#111827" />
          </TouchableOpacity>
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Клиент не найден</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View pointerEvents="none" style={styles.bgAccentPrimary} />
      <View pointerEvents="none" style={styles.bgAccentSecondary} />
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.headerCard}>
            <View style={styles.headerTopRow}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <ArrowLeft size={18} color="#111827" />
              </TouchableOpacity>
              <View style={styles.headerIdentity}>
                <View style={styles.avatar}>
                  {client.avatarUrl ? (
                    <Image source={{ uri: client.avatarUrl }} style={styles.avatarImage} />
                  ) : (
                    <Text style={styles.avatarInitials}>
                      {client.name
                        .split(' ')
                        .map((part) => part.trim()[0])
                        .filter(Boolean)
                        .slice(0, 2)
                        .join('')
                        .toUpperCase()}
                    </Text>
                  )}
                </View>
                <Text style={styles.headerTitle}>{client.name}</Text>
              </View>
              {client.archived ? (
                <View style={styles.statusPill}>
                  <Text style={styles.statusPillText}>В архиве</Text>
                </View>
              ) : (
                <View style={styles.headerGhost} />
              )}
            </View>
            <View style={styles.headerStatsRow}>
              <View style={styles.headerStat}>
                <Text style={styles.headerStatLabel}>Питание</Text>
                <Text style={styles.headerStatValue}>{client.complianceScore.toFixed(1)}/7</Text>
              </View>
              <View style={styles.headerStat}>
                <Text style={styles.headerStatLabel}>Анкеты</Text>
                <Text style={styles.headerStatValue}>
                  {client.surveyAdherenceCount}/{client.surveyAdherenceDays}
                </Text>
              </View>
              <View style={styles.headerStat}>
                <Text style={styles.headerStatLabel}>Последний замер</Text>
                <Text style={styles.headerStatValue}>{lastMeasurementDays}</Text>
              </View>
            </View>
          </View>

          <View style={styles.tabRow}>
            {TABS.map((tab) => (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={[styles.tabButton, activeTab === tab.key && styles.tabButtonActive]}
              >
                <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>{tab.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {activeTab === 'nutrition' && (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Цели по питанию</Text>
              <View style={styles.goalGrid}>
                {[
                  { key: 'protein', label: 'Белки', value: goals.protein },
                  { key: 'fat', label: 'Жиры', value: goals.fat },
                  { key: 'carbs', label: 'Углеводы', value: goals.carbs },
                  { key: 'fiber', label: 'Клетчатка', value: goals.fiber },
                ].map((item) => (
                  <View key={item.key} style={styles.goalItem}>
                    <Text style={styles.goalLabel}>{item.label}</Text>
                    <TextInput
                      value={item.value}
                      onChangeText={(value) => setGoals((prev) => ({ ...prev, [item.key]: value }))}
                      keyboardType="number-pad"
                      style={styles.goalInput}
                    />
                    <Text style={styles.goalUnit}>порций</Text>
                  </View>
                ))}
              </View>
              <TouchableOpacity onPress={handleSaveGoals} style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>Установить цели</Text>
              </TouchableOpacity>
            </View>
          )}

          {activeTab === 'nutrition' && (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Приверженность за неделю</Text>
              {client.complianceHistory.length === 0 ? (
                <Text style={styles.emptySectionText}>Нет данных за неделю</Text>
              ) : (
                <View style={styles.complianceRow}>
                  {client.complianceHistory.map((point) => (
                    <View key={point.day} style={styles.complianceItem}>
                      <View style={styles.complianceBar}>
                        <View
                          style={[
                            styles.complianceBarFill,
                            { height: `${Math.min(100, (point.value / 7) * 100)}%` },
                          ]}
                        />
                      </View>
                      <Text style={styles.complianceDay}>{point.day}</Text>
                      <Text style={styles.complianceValue}>{point.value.toFixed(1)}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {activeTab === 'surveys' && (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Анкеты за 30 дней</Text>
              {client.surveys.length === 0 && (
                <Text style={styles.emptySectionText}>Анкеты пока не заполнены</Text>
              )}
              {client.surveys.map((survey) => {
                const isExpanded = expandedSurveyId === survey.id;
                return (
                  <TouchableOpacity
                    key={survey.id}
                    onPress={() => setExpandedSurveyId(isExpanded ? null : survey.id)}
                    style={styles.surveyRow}
                  >
                    <View style={styles.surveyHeader}>
                      <View>
                        <Text style={styles.surveyDate}>{survey.date}</Text>
                        <Text style={styles.surveyMeta}>
                          Сон: {survey.sleep} · Стресс: {survey.stress} · Мотивация: {survey.motivation}
                        </Text>
                      </View>
                      <View style={[styles.surveyStatus, survey.status === 'pending' && styles.surveyStatusPending]}>
                        <Text
                          style={[
                            styles.surveyStatusText,
                            survey.status === 'pending' && styles.surveyStatusTextPending,
                          ]}
                        >
                          {survey.status === 'pending' ? 'Не просмотрено' : 'Просмотрено'}
                        </Text>
                      </View>
                    </View>
                    {isExpanded && (
                      <View style={styles.surveyDetails}>
                        {Object.entries(survey.details).map(([label, value]) => (
                          <View key={label} style={styles.surveyDetailRow}>
                            <Text style={styles.surveyDetailLabel}>{label}</Text>
                            <Text style={styles.surveyDetailValue}>{value}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {activeTab === 'measurements' && (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Еженедельные замеры</Text>
              {client.measurements.length === 0 && (
                <Text style={styles.emptySectionText}>Замеры пока отсутствуют</Text>
              )}
              {client.measurements.map((measure) => (
                <View key={measure.id} style={styles.measureRow}>
                  <View>
                    <Text style={styles.measureDate}>{measure.date}</Text>
                    <Text style={styles.measureMeta}>
                      Окружности: Р:{measure.metrics.arms} Н:{measure.metrics.legs} Т:{measure.metrics.waist} Г:
                      {measure.metrics.chest} Б:{measure.metrics.hips}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      setActivePhotos(measure.photos);
                      setShowPhotos(true);
                    }}
                    style={[styles.photoButton, !measure.hasPhotos && styles.photoButtonDisabled]}
                    disabled={!measure.hasPhotos}
                  >
                    <Camera size={14} color={measure.hasPhotos ? '#111827' : '#9CA3AF'} />
                    <Text style={[styles.photoButtonText, !measure.hasPhotos && styles.photoButtonTextDisabled]}>
                      Фото
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity style={styles.secondaryButton}>
                <CheckCircle2 size={16} color="#111827" />
                <Text style={styles.secondaryButtonText}>Экспорт CSV (опционально)</Text>
              </TouchableOpacity>
            </View>
          )}

          {client.archived ? (
            <TouchableOpacity onPress={handleUnarchiveClient} style={styles.restoreButton}>
              <Archive size={16} color="#047857" />
              <Text style={styles.restoreButtonText}>Вернуть из архива</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={handleArchiveClient} style={styles.archiveButton}>
              <Archive size={16} color="#DC2626" />
              <Text style={styles.archiveButtonText}>Отправить в архив</Text>
            </TouchableOpacity>
          )}
        </ScrollView>

        <Modal
          visible={showPhotos}
          transparent
          animationType="fade"
          onRequestClose={() => {
            setShowPhotos(false);
            setActivePhotos([]);
          }}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Фото замеров</Text>
              <View style={styles.photoGrid}>
                {(activePhotos.length ? activePhotos : ['front', 'side', 'back']).map((photo, index) => (
                  <View key={`${photo}-${index}`} style={styles.photoPlaceholder}>
                    <Camera size={18} color="#9CA3AF" />
                    <Text style={styles.photoLabel}>
                      {activePhotos.length ? 'Фото' : ['Фронт', 'Бок', 'Спина'][index] ?? 'Фото'}
                    </Text>
                  </View>
                ))}
              </View>
              <TouchableOpacity onPress={() => setShowPhotos(false)} style={styles.secondaryButton}>
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
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#F3F4F6',
    alignSelf: 'flex-start',
  },
  headerGhost: {
    width: 64,
  },
  statusPillText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
  },
  headerIdentity: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  avatarInitials: {
    fontSize: 18,
    fontWeight: '700',
    color: '#6B7280',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  headerStatsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  headerStat: {
    flex: 1,
    borderRadius: 16,
    padding: 12,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
  },
  headerStatLabel: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
  },
  headerStatValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginTop: 6,
  },
  tabRow: {
    marginTop: 16,
    flexDirection: 'row',
    gap: 8,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  tabButtonActive: {
    borderColor: '#BBF7D0',
    backgroundColor: '#ECFDF3',
  },
  tabText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  tabTextActive: {
    color: COLORS.primary,
  },
  sectionCard: {
    marginTop: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  emptySectionText: {
    fontSize: 12,
    color: '#6B7280',
  },
  goalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  goalItem: {
    flex: 1,
    minWidth: 120,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
    backgroundColor: '#F9FAFB',
  },
  goalLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 6,
  },
  goalInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 13,
    backgroundColor: '#FFFFFF',
    color: '#111827',
  },
  goalUnit: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 6,
  },
  primaryButton: {
    marginTop: 12,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  complianceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  complianceItem: {
    alignItems: 'center',
    flex: 1,
  },
  complianceBar: {
    width: 20,
    height: 72,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  complianceBarFill: {
    width: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 10,
  },
  complianceDay: {
    marginTop: 6,
    fontSize: 10,
    color: '#6B7280',
  },
  complianceValue: {
    fontSize: 10,
    color: '#111827',
    marginTop: 2,
  },
  surveyRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
  },
  surveyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  surveyDate: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  surveyMeta: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  surveyStatus: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#ECFDF3',
  },
  surveyStatusPending: {
    backgroundColor: '#FEF2F2',
  },
  surveyStatusText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.primary,
  },
  surveyStatusTextPending: {
    color: '#EF4444',
  },
  surveyDetails: {
    marginTop: 8,
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  surveyDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  surveyDetailLabel: {
    fontSize: 11,
    color: '#6B7280',
  },
  surveyDetailValue: {
    fontSize: 11,
    color: '#111827',
    fontWeight: '600',
  },
  measureRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  measureDate: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  measureMeta: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 4,
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#F9FAFB',
  },
  photoButtonDisabled: {
    backgroundColor: '#F3F4F6',
  },
  photoButtonText: {
    fontSize: 11,
    color: '#111827',
    fontWeight: '600',
  },
  photoButtonTextDisabled: {
    color: '#9CA3AF',
  },
  secondaryButton: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  secondaryButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
  },
  archiveButton: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 16,
    paddingVertical: 12,
    backgroundColor: '#FEF2F2',
  },
  archiveButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#DC2626',
  },
  restoreButton: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#6EE7B7',
    borderRadius: 16,
    paddingVertical: 12,
    backgroundColor: '#ECFDF3',
  },
  restoreButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#047857',
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
  photoGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  photoPlaceholder: {
    flex: 1,
    height: 100,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoLabel: {
    marginTop: 6,
    fontSize: 11,
    color: '#6B7280',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  emptySubtitle: {
    marginTop: 8,
    fontSize: 12,
    color: '#6B7280',
  },
});
