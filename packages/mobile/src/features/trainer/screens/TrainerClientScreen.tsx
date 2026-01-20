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
import { ArrowLeft, Camera, CheckCircle2, Archive, BookOpen, ClipboardCopy, Ruler } from 'lucide-react-native';

import { COLORS } from '../../../constants/Colors';
import { trainerApi, TrainerClientDetail } from '../services/trainerApi';
import { emitClientsUpdated } from '../services/trainerEvents';
import { SharedBottomSheet } from '../../profile/components/SharedBottomSheet';
import { useTabBarVisibility } from '../../../shared/ui';

type TabKey = 'nutrition' | 'surveys' | 'measurements';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'nutrition', label: 'Питание' },
  { key: 'surveys', label: 'Анкеты' },
  { key: 'measurements', label: 'Замеры' },
];
const GOALS_PAGE_SIZE = 4;

export default function TrainerClientScreen() {
  const { setHidden: setTabBarHidden } = useTabBarVisibility();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [client, setClient] = useState<TrainerClientDetail | null>(null);
  const [isLoading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<TabKey>('nutrition');
  const [expandedSurveyId, setExpandedSurveyId] = useState<string | null>(null);
  const [showPhotos, setShowPhotos] = useState(false);
  const [activePhotos, setActivePhotos] = useState<string[]>([]);
  const [goals, setGoals] = useState({ protein: '', fat: '', carbs: '', fiber: '' });
  const [draftGoals, setDraftGoals] = useState({ protein: '', fat: '', carbs: '', fiber: '' });
  const [isGoalsOpen, setGoalsOpen] = useState(false);
  const [visibleGoalsCount, setVisibleGoalsCount] = useState(GOALS_PAGE_SIZE);

  const handleSaveGoals = async () => {
    const protein = Number(draftGoals.protein);
    const fat = Number(draftGoals.fat);
    const carbs = Number(draftGoals.carbs);
    const fiber = draftGoals.fiber === '' ? null : Number(draftGoals.fiber);

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
      const updatedGoals = {
        protein: protein.toString(),
        fat: fat.toString(),
        carbs: carbs.toString(),
        fiber: fiber === null ? '' : fiber.toString(),
      };
      setGoals(updatedGoals);
      setDraftGoals(updatedGoals);
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
      setGoalsOpen(false);
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
        setDraftGoals({
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

  const goalsHistory = client?.goalsHistory ?? [];

  useEffect(() => {
    if (goalsHistory.length) {
      setVisibleGoalsCount(GOALS_PAGE_SIZE);
    }
  }, [goalsHistory.length]);

  useEffect(() => {
    setTabBarHidden(isGoalsOpen);
  }, [isGoalsOpen, setTabBarHidden]);

  const lastMeasurementInfo = useMemo(() => {
    const parseDate = (value: string) => {
      if (!value) return null;
      const iso = new Date(value);
      if (!Number.isNaN(iso.getTime())) return iso;
      const dotMatch = /(\d{2})\.(\d{2})\.(\d{4})/.exec(value);
      if (dotMatch) {
        const [, dayStr, monthStr, yearStr] = dotMatch;
        const parsed = new Date(Number(yearStr), Number(monthStr) - 1, Number(dayStr));
        return Number.isNaN(parsed.getTime()) ? null : parsed;
      }
      const dashMatch = /(\d{4})-(\d{2})-(\d{2})/.exec(value);
      if (dashMatch) {
        const [, yearStr, monthStr, dayStr] = dashMatch;
        const parsed = new Date(Number(yearStr), Number(monthStr) - 1, Number(dayStr));
        return Number.isNaN(parsed.getTime()) ? null : parsed;
      }
      return null;
    };

    const dates = (client?.measurements ?? [])
      .map((measure) => ({ raw: measure.date, parsed: parseDate(measure.date) }))
      .filter((item): item is { raw: string; parsed: Date } => Boolean(item.parsed));
    if (dates.length === 0) {
      const fallbackDate = client?.lastMeasurementDate ? parseDate(client.lastMeasurementDate) : null;
      if (fallbackDate) {
        const diffMs = Date.now() - fallbackDate.getTime();
        const days = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
        const dateLabel = fallbackDate.toLocaleDateString('ru-RU', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        });
        const daysLabel = days === 0 ? 'сегодня' : `${days} дн.`;
        return { dateLabel, daysLabel };
      }
      const rawLabel = client?.measurements?.[0]?.date;
      if (rawLabel) {
        return { dateLabel: rawLabel, daysLabel: '' };
      }
      return { dateLabel: '—', daysLabel: '' };
    }

    dates.sort((a, b) => b.parsed.getTime() - a.parsed.getTime());
    const latest = dates[0].parsed;
    const diffMs = Date.now() - latest.getTime();
    const days = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    const dateLabel = latest.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    const daysLabel = days === 0 ? 'сегодня' : `${days} дн назад`;
    return { dateLabel, daysLabel };
  }, [client]);

  const nutritionStatus = useMemo(() => {
    const score = client?.complianceScore ?? 0;
    if (score >= 5.5) return 'Good';
    if (score >= 3.5) return 'Warn';
    return 'Bad';
  }, [client]);

  const surveysStatus = useMemo(() => {
    const total = client?.surveyAdherenceDays ?? 0;
    if (total === 0) return 'Bad';
    const ratio = (client?.surveyAdherenceCount ?? 0) / total;
    if (ratio >= 0.8) return 'Good';
    if (ratio >= 0.5) return 'Warn';
    return 'Bad';
  }, [client]);

  const measurementsStatus = useMemo(() => {
    const daysLabel = lastMeasurementInfo.daysLabel;
    if (!daysLabel) return 'Bad';
    if (daysLabel === 'сегодня') return 'Good';
    const daysMatch = /(\d+)/.exec(daysLabel);
    const days = daysMatch ? Number(daysMatch[1]) : null;
    if (days === null) return 'Bad';
    if (days <= 7) return 'Good';
    if (days <= 14) return 'Warn';
    return 'Bad';
  }, [lastMeasurementInfo.daysLabel]);

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
              <View style={[styles.headerStat, styles[`headerStat${nutritionStatus}` as keyof typeof styles]]}>
                <Text style={[styles.headerStatLabel, styles[`headerStatLabel${nutritionStatus}` as keyof typeof styles]]}>
                  Питание
                </Text>
                <Text style={[styles.headerStatValue, styles[`headerStatValue${nutritionStatus}` as keyof typeof styles]]}>
                  {client.complianceScore.toFixed(1)}/7
                </Text>
              </View>
              <View style={[styles.headerStat, styles[`headerStat${surveysStatus}` as keyof typeof styles]]}>
                <Text style={[styles.headerStatLabel, styles[`headerStatLabel${surveysStatus}` as keyof typeof styles]]}>
                  Анкеты
                </Text>
                <Text style={[styles.headerStatValue, styles[`headerStatValue${surveysStatus}` as keyof typeof styles]]}>
                  {client.surveyAdherenceCount}/{client.surveyAdherenceDays}
                </Text>
              </View>
              <View style={[styles.headerStat, styles[`headerStat${measurementsStatus}` as keyof typeof styles]]}>
                <Text style={[styles.headerStatLabel, styles[`headerStatLabel${measurementsStatus}` as keyof typeof styles]]}>
                  Замер
                </Text>
                <Text style={[styles.headerStatValue, styles[`headerStatValue${measurementsStatus}` as keyof typeof styles]]}>
                  {lastMeasurementInfo.daysLabel || '—'}
                </Text>
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
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionHeaderIcon}>
                  <BookOpen size={16} color="#111827" />
                </View>
                <Text style={styles.sectionTitle}>Цели по питанию</Text>
              </View>
              <View style={styles.goalGridCompact}>
                {[
                  { key: 'protein', label: 'Б', value: goals.protein, color: '#F97373' },
                  { key: 'fat', label: 'Ж', value: goals.fat, color: '#FBBF24' },
                  { key: 'carbs', label: 'У', value: goals.carbs, color: '#60A5FA' },
                  { key: 'fiber', label: 'К', value: goals.fiber, color: '#34D399' },
                ].map((item) => (
                  <View key={item.key} style={styles.goalCompactItem}>
                    <View style={[styles.goalBadge, { backgroundColor: `${item.color}22` }]}>
                      <Text style={[styles.goalBadgeText, { color: item.color }]}>{item.label}</Text>
                    </View>
                    <Text style={styles.goalValueText}>
                      {item.value ? item.value : '—'}
                    </Text>
                  </View>
                ))}
              </View>
              <TouchableOpacity
                onPress={() => {
                  setDraftGoals(goals);
                  setGoalsOpen(true);
                }}
                style={styles.secondaryButton}
              >
                <Text style={styles.secondaryButtonText}>Изменить цели</Text>
              </TouchableOpacity>
            </View>
          )}

          {activeTab === 'nutrition' && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionHeaderIcon}>
                  <CheckCircle2 size={16} color="#111827" />
                </View>
                <Text style={styles.sectionTitle}>Приверженность за неделю</Text>
              </View>
              {client.complianceHistory.length === 0 ? (
                <View style={styles.emptyStateCard}>
                  <View style={styles.emptyIconWrap}>
                    <BookOpen size={18} color="#6B7280" />
                  </View>
                  <Text style={styles.emptyStateTitle}>Нет данных за неделю</Text>
                  <Text style={styles.emptyStateSubtitle}>Дневник питания еще не заполнен</Text>
                </View>
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
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionHeaderIcon}>
                  <ClipboardCopy size={16} color="#111827" />
                </View>
                <Text style={styles.sectionTitle}>Анкеты за 30 дней</Text>
              </View>
              {client.surveys.length === 0 && (
                <View style={styles.emptyStateCard}>
                  <View style={styles.emptyIconWrap}>
                    <ClipboardCopy size={18} color="#6B7280" />
                  </View>
                  <Text style={styles.emptyStateTitle}>Анкет пока нет</Text>
                  <Text style={styles.emptyStateSubtitle}>Клиент еще не заполнял анкеты</Text>
                </View>
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
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionHeaderIcon}>
                  <Ruler size={16} color="#111827" />
                </View>
                <Text style={styles.sectionTitle}>Еженедельные замеры</Text>
              </View>
              {client.measurements.length === 0 && (
                <View style={styles.emptyStateCard}>
                  <View style={styles.emptyIconWrap}>
                    <Ruler size={18} color="#6B7280" />
                  </View>
                  <Text style={styles.emptyStateTitle}>Замеры еще не добавлены</Text>
                  <Text style={styles.emptyStateSubtitle}>После первого замера появится история</Text>
                </View>
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

        <SharedBottomSheet
          visible={isGoalsOpen}
          onClose={() => {
            setDraftGoals(goals);
            setGoalsOpen(false);
          }}
          enableSwipeToDismiss
          headerSwipeHeight={56}
        >
          <View style={styles.sheetContent}>
            <Text style={styles.modalTitle}>Цели по питанию</Text>
            <Text style={styles.modalSubtitle}>Обновите цели для клиента.</Text>
            <View style={styles.goalGrid}>
              {[
                { key: 'protein', label: 'Белки', value: draftGoals.protein, color: '#F97373' },
                { key: 'fat', label: 'Жиры', value: draftGoals.fat, color: '#FBBF24' },
                { key: 'carbs', label: 'Углеводы', value: draftGoals.carbs, color: '#60A5FA' },
                { key: 'fiber', label: 'Клетчатка', value: draftGoals.fiber, color: '#34D399' },
              ].map((item) => (
                <View key={item.key} style={styles.goalItem}>
                  <View style={styles.goalLabelRow}>
                    <View style={[styles.goalDot, { backgroundColor: item.color }]} />
                    <Text style={styles.goalLabel}>{item.label}</Text>
                  </View>
                  <TextInput
                    value={item.value}
                    onChangeText={(value) => setDraftGoals((prev) => ({ ...prev, [item.key]: value }))}
                    keyboardType="number-pad"
                    placeholder="Количество"
                    placeholderTextColor="#9CA3AF"
                    style={[styles.goalInput, { borderColor: `${item.color}66` }]}
                  />
                </View>
              ))}
            </View>
            <TouchableOpacity onPress={handleSaveGoals} style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>Сохранить</Text>
            </TouchableOpacity>

            <View style={styles.sheetDivider} />
            <Text style={styles.sheetSectionTitle}>История целей</Text>
            {goalsHistory.length === 0 ? (
              <View style={styles.emptyStateCard}>
                <View style={styles.emptyIconWrap}>
                  <BookOpen size={18} color="#6B7280" />
                </View>
                <Text style={styles.emptyStateTitle}>История пока пуста</Text>
                <Text style={styles.emptyStateSubtitle}>Появится после первых изменений</Text>
              </View>
            ) : (
              <View>
                {goalsHistory.slice(0, visibleGoalsCount).map((item) => (
                  <View key={item.id} style={styles.goalHistoryRow}>
                    <View style={styles.goalHistoryHeader}>
                      <Text style={styles.goalHistoryDate}>
                        {new Date(item.startDate).toLocaleDateString('ru-RU', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </Text>
                      <Text style={styles.goalHistoryRange}>
                        {item.endDate ? 'завершено' : 'активно'}
                      </Text>
                    </View>
                    <View style={styles.goalHistoryChips}>
                      {[
                        { label: 'Б', value: item.protein, color: '#F97373' },
                        { label: 'Ж', value: item.fat, color: '#FBBF24' },
                        { label: 'У', value: item.carbs, color: '#60A5FA' },
                        { label: 'К', value: item.fiber, color: '#34D399' },
                      ].map((chip) => (
                        <View key={chip.label} style={[styles.goalHistoryChip, { borderColor: `${chip.color}55` }]}>
                          <Text style={[styles.goalHistoryChipLabel, { color: chip.color }]}>{chip.label}</Text>
                          <Text style={styles.goalHistoryChipValue}>{chip.value}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ))}
                {goalsHistory.length > visibleGoalsCount ? (
                  <TouchableOpacity
                    style={styles.loadMoreButton}
                    onPress={() =>
                      setVisibleGoalsCount((count) =>
                        Math.min(count + GOALS_PAGE_SIZE, goalsHistory.length)
                      )
                    }
                  >
                    <Text style={styles.loadMoreText}>Показать ещё</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            )}
          </View>
        </SharedBottomSheet>

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
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  headerStatGood: {
    backgroundColor: '#ECFDF3',
    borderColor: '#6EE7B7',
  },
  headerStatWarn: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FCD34D',
  },
  headerStatBad: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
  },
  headerStatLabel: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
  },
  headerStatLabelGood: {
    color: '#047857',
  },
  headerStatLabelWarn: {
    color: '#92400E',
  },
  headerStatLabelBad: {
    color: '#B91C1C',
  },
  headerStatValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginTop: 6,
  },
  headerStatValueGood: {
    color: '#047857',
  },
  headerStatValueWarn: {
    color: '#92400E',
  },
  headerStatValueBad: {
    color: '#B91C1C',
  },
  headerStatMeta: {
    marginTop: 4,
    fontSize: 10,
    color: '#9CA3AF',
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
    padding: 16,
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(15, 23, 42, 0.08)',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  sectionHeaderIcon: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
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
  goalGridCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
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
  goalCompactItem: {
    flex: 1,
    minWidth: 64,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  goalBadge: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  goalLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  goalDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  goalLabel: {
    fontSize: 11,
    color: '#6B7280',
  },
  goalValueText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    fontVariant: ['tabular-nums'],
  },
  goalHistoryRow: {
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    marginBottom: 10,
  },
  goalHistoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  goalHistoryDate: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
  },
  goalHistoryRange: {
    fontSize: 11,
    color: '#6B7280',
  },
  goalHistoryChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  goalHistoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: '#F9FAFB',
  },
  goalHistoryChipLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  goalHistoryChipValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
    fontVariant: ['tabular-nums'],
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
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    marginBottom: 10,
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
  emptyStateCard: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  emptyIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyStateTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  emptyStateSubtitle: {
    marginTop: 4,
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  loadMoreButton: {
    alignSelf: 'center',
    marginTop: 12,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  loadMoreText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
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
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    marginBottom: 10,
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
  modalSubtitle: {
    fontSize: 12,
    color: '#6B7280',
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
  sheetContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  sheetDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 16,
  },
  sheetSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
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
