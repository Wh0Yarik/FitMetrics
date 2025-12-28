import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, StatusBar, StyleSheet, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TrendingDown, TrendingUp } from 'lucide-react-native';
import { useFocusEffect } from 'expo-router';
import Svg, { Path, Circle } from 'react-native-svg';

import { measurementsRepository, MeasurementEntry } from '../repositories/MeasurementsRepository';
import { COLORS } from '../../../constants/Colors';

const METRICS = [
  { key: 'weight', label: 'Вес', unit: 'кг' },
  { key: 'waist', label: 'Талия', unit: 'см' },
  { key: 'hips', label: 'Бедра', unit: 'см' },
] as const;

type MetricKey = typeof METRICS[number]['key'];

const formatDelta = (current?: number | null, previous?: number | null) => {
  if (current == null || previous == null) return null;
  const diff = current - previous;
  if (diff === 0) return { value: '0', direction: 'flat' as const };
  return {
    value: `${diff > 0 ? '+' : ''}${diff.toFixed(1)}`,
    direction: diff > 0 ? 'up' : 'down',
  };
};

const parseDate = (date: string) => {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const getClosestEntryBefore = (items: MeasurementEntry[], targetDate: Date) => {
  const target = targetDate.getTime();
  const sorted = [...items].sort((a, b) => parseDate(b.date).getTime() - parseDate(a.date).getTime());
  return sorted.find(item => parseDate(item.date).getTime() <= target) || null;
};

const getMetricValue = (item: MeasurementEntry, key: MetricKey) => {
  const value = (item as Record<MetricKey, number | null | undefined>)[key];
  return typeof value === 'number' ? value : null;
};

const buildChartPath = (points: number[], width: number, height: number) => {
  if (points.length === 0) return '';
  const paddingX = 12;
  const paddingY = 12;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  return points
    .map((value, index) => {
      const x = paddingX + (index / Math.max(1, points.length - 1)) * (width - paddingX * 2);
      const y = paddingY + (1 - (value - min) / span) * (height - paddingY * 2);
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');
};

export default function MeasurementsAnalyticsScreen() {
  const [measurements, setMeasurements] = useState<MeasurementEntry[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>('weight');
  const [selectedPeriod, setSelectedPeriod] = useState<7 | 30 | 90>(30);
  const { width } = useWindowDimensions();

  const loadData = useCallback(() => {
    const data = measurementsRepository.getAllMeasurements();
    setMeasurements(data);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const latestMeasurement = measurements[0];
  const previousMeasurement = measurements[1];

  const summaryCards = useMemo(() => {
    if (!latestMeasurement) return [];
    return [
      {
        label: 'Вес',
        value: latestMeasurement.weight != null ? `${latestMeasurement.weight} кг` : '—',
        delta: formatDelta(latestMeasurement.weight, previousMeasurement?.weight),
      },
      {
        label: 'Талия',
        value: latestMeasurement.waist != null ? `${latestMeasurement.waist} см` : '—',
        delta: formatDelta(latestMeasurement.waist, previousMeasurement?.waist),
      },
      {
        label: 'Бедра',
        value: latestMeasurement.hips != null ? `${latestMeasurement.hips} см` : '—',
        delta: formatDelta(latestMeasurement.hips, previousMeasurement?.hips),
      },
    ];
  }, [latestMeasurement, previousMeasurement]);

  const metricMeta = METRICS.find(metric => metric.key === selectedMetric) ?? METRICS[0];
  const chartWidth = Math.max(0, width - 48);
  const chartHeight = 160;

  const chartPoints = useMemo(() => {
    return measurements
      .slice()
      .sort((a, b) => parseDate(a.date).getTime() - parseDate(b.date).getTime())
      .map(item => getMetricValue(item, selectedMetric))
      .filter((value): value is number => value != null)
      .slice(-8);
  }, [measurements, selectedMetric]);

  const latestValue = latestMeasurement ? getMetricValue(latestMeasurement, selectedMetric) : null;
  const periodDelta = useMemo(() => {
    if (!latestMeasurement || latestValue == null) return null;
    const targetDate = new Date(parseDate(latestMeasurement.date));
    targetDate.setDate(targetDate.getDate() - selectedPeriod);
    const compareEntry = getClosestEntryBefore(measurements, targetDate);
    const compareValue = compareEntry ? getMetricValue(compareEntry, selectedMetric) : null;
    if (compareValue == null) return null;
    return latestValue - compareValue;
  }, [latestMeasurement, latestValue, measurements, selectedMetric, selectedPeriod]);

  return (
    <View style={styles.screen}>
      <View pointerEvents="none" style={styles.bgAccentPrimary} />
      <View pointerEvents="none" style={styles.bgAccentSecondary} />
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <StatusBar barStyle="dark-content" />

        <View style={styles.headerWrap}>
          <View style={styles.headerCard}>
            <Text style={styles.headerKicker}>Аналитика</Text>
            <Text style={styles.headerTitle}>Прогресс замеров</Text>
            <Text style={styles.headerSubtitle}>Тренды и изменения за период</Text>
          </View>
        </View>

        <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 120 }}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Динамика</Text>
            <View style={styles.sectionChip}>
              <Text style={styles.sectionChipText}>{metricMeta.label}</Text>
            </View>
          </View>

          <View style={styles.metricTabs}>
            {METRICS.map(metric => (
              <View key={metric.key} style={styles.metricTabWrap}>
                <Text
                  onPress={() => setSelectedMetric(metric.key)}
                  style={[
                    styles.metricTab,
                    selectedMetric === metric.key ? styles.metricTabActive : null,
                  ]}
                >
                  {metric.label}
                </Text>
              </View>
            ))}
          </View>

          <View style={[styles.chartCard, { width: chartWidth }]}>
            {chartPoints.length < 2 ? (
              <View style={styles.chartEmpty}>
                <Text style={styles.chartEmptyText}>Добавьте ещё замеры для графика</Text>
              </View>
            ) : (
              <Svg width={chartWidth} height={chartHeight}>
                <Path d={buildChartPath(chartPoints, chartWidth, chartHeight)} stroke={COLORS.primary} strokeWidth={3} fill="none" />
                {chartPoints.map((value, index) => {
                  const paddingX = 12;
                  const paddingY = 12;
                  const min = Math.min(...chartPoints);
                  const max = Math.max(...chartPoints);
                  const span = max - min || 1;
                  const x = paddingX + (index / Math.max(1, chartPoints.length - 1)) * (chartWidth - paddingX * 2);
                  const y = paddingY + (1 - (value - min) / span) * (chartHeight - paddingY * 2);
                  return <Circle key={`${index}-${value}`} cx={x} cy={y} r={4} fill="#FFFFFF" stroke={COLORS.primary} strokeWidth={2} />;
                })}
              </Svg>
            )}
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Изменение за период</Text>
            <View style={styles.sectionChip}>
              <Text style={styles.sectionChipText}>{selectedPeriod} дней</Text>
            </View>
          </View>

          <View style={styles.periodRow}>
            {[7, 30, 90].map(period => (
              <Text
                key={period}
                onPress={() => setSelectedPeriod(period as 7 | 30 | 90)}
                style={[
                  styles.periodChip,
                  selectedPeriod === period ? styles.periodChipActive : null,
                ]}
              >
                {period} дн
              </Text>
            ))}
          </View>

          <View style={styles.periodCard}>
            <Text style={styles.periodLabel}>{metricMeta.label}</Text>
            <Text style={styles.periodValue}>
              {periodDelta == null ? '—' : `${periodDelta > 0 ? '+' : ''}${periodDelta.toFixed(1)} ${metricMeta.unit}`}
            </Text>
          </View>

          {summaryCards.length > 0 && (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Снимок прогресса</Text>
                <View style={styles.sectionChip}>
                  <Text style={styles.sectionChipText}>Последний замер</Text>
                </View>
              </View>
              <View style={styles.summaryGrid}>
                {summaryCards.map((card) => (
                  <View key={card.label} style={styles.summaryCard}>
                    <Text style={styles.summaryLabel}>{card.label}</Text>
                    <Text style={styles.summaryValue}>{card.value}</Text>
                    {card.delta && (
                      <View style={[
                        styles.deltaPill,
                        card.delta.direction === 'up' ? styles.deltaUp : card.delta.direction === 'down' ? styles.deltaDown : styles.deltaFlat,
                      ]}>
                        {card.delta.direction === 'up' && <TrendingUp size={12} color="#16A34A" />}
                        {card.delta.direction === 'down' && <TrendingDown size={12} color="#DC2626" />}
                        <Text style={[
                          styles.deltaText,
                          card.delta.direction === 'up' ? styles.deltaTextUp : card.delta.direction === 'down' ? styles.deltaTextDown : null,
                        ]}>
                          {card.delta.value}
                        </Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            </>
          )}
        </ScrollView>
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
  sectionHeader: {
    paddingHorizontal: 24,
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  sectionChip: {
    backgroundColor: '#ECFDF3',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  sectionChipText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  metricTabs: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginTop: 12,
  },
  metricTabWrap: {
    marginRight: 8,
  },
  metricTab: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  metricTabActive: {
    backgroundColor: '#ECFDF3',
    borderColor: '#D1FAE5',
    color: '#166534',
  },
  chartCard: {
    alignSelf: 'center',
    marginTop: 12,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 12,
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  chartEmpty: {
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartEmptyText: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  periodRow: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginTop: 10,
  },
  periodChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 8,
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  periodChipActive: {
    backgroundColor: '#111827',
    borderColor: '#111827',
    color: '#FFFFFF',
  },
  periodCard: {
    marginTop: 10,
    marginHorizontal: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 14,
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  periodLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  periodValue: {
    marginTop: 4,
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  summaryGrid: {
    paddingHorizontal: 24,
    marginTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  summaryCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#111827',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 11,
    color: '#6B7280',
  },
  summaryValue: {
    marginTop: 4,
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  deltaPill: {
    marginTop: 8,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#F3F4F6',
  },
  deltaUp: {
    backgroundColor: '#ECFDF3',
  },
  deltaDown: {
    backgroundColor: '#FEF2F2',
  },
  deltaFlat: {
    backgroundColor: '#F3F4F6',
  },
  deltaText: {
    marginLeft: 4,
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
  },
  deltaTextUp: {
    color: '#16A34A',
  },
  deltaTextDown: {
    color: '#DC2626',
  },
});
