import React, { useEffect, useMemo, useState } from 'react';
import { LayoutChangeEvent, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { MeasurementEntry } from '../repositories/MeasurementsRepository';
import { buildLinePath } from '../lib/buildLinePath';
import { SharedBottomSheet } from '../../profile/components/SharedBottomSheet';
import { colors, fonts, spacing } from '../../../shared/ui';
import { getDateObj } from '../../../shared/lib/date';
import { MeasurementChart } from './MeasurementChart';
import { dailySurveyRepository } from '../../diary/repositories/DailySurveyRepository';

type MetricKey = 'weight' | 'waist' | 'hips' | 'chest' | 'arms' | 'legs';

type RangeKey = 'all' | '1m' | '3m' | '6m' | '1y';

const RANGE_OPTIONS: { key: RangeKey; label: string }[] = [
  { key: '1m', label: '1 м' },
  { key: '3m', label: '3 м' },
  { key: '6m', label: '6 м' },
  { key: '1y', label: '1 г' },
  { key: 'all', label: 'Все' },
];
const PAGE_SIZE = 10;

const METRIC_META: Record<MetricKey, { label: string; unit: string; color: string; secondaryColor?: string }> = {
  weight: { label: 'Вес', unit: 'кг', color: colors.accentFiber },
  waist: { label: 'Талия', unit: 'см', color: colors.accentCarbs },
  hips: { label: 'Бедра', unit: 'см', color: colors.accentFat },
  chest: { label: 'Грудь', unit: 'см', color: colors.accentProtein },
  arms: { label: 'Руки', unit: 'см', color: colors.accentCarbs, secondaryColor: colors.accentProtein },
  legs: { label: 'Ноги', unit: 'см', color: colors.accentFat, secondaryColor: colors.accentFiber },
};

type MeasurementProgressSheetProps = {
  visible: boolean;
  onClose: () => void;
  metricKey: MetricKey | null;
  measurements: MeasurementEntry[];
};

const formatValue = (value: number | null) => {
  if (value == null) return '—';
  return Number.isInteger(value) ? value.toString() : value.toFixed(1);
};

const formatDateLabel = (date: string) =>
  getDateObj(date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });

const getRangeCutoff = (range: RangeKey) => {
  if (range === 'all') return null;
  const days = range === '1m' ? 30 : range === '3m' ? 90 : range === '6m' ? 180 : 365;
  const cutoff = new Date();
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setDate(cutoff.getDate() - days + 1);
  return cutoff;
};

export const MeasurementProgressSheet = ({
  visible,
  onClose,
  metricKey,
  measurements,
}: MeasurementProgressSheetProps) => {
  const [range, setRange] = useState<RangeKey>('all');
  const [hovered, setHovered] = useState<{ index: number; x: number; y: number } | null>(null);
  const [chartSize, setChartSize] = useState({ width: 0, height: 0 });
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const metric = metricKey ? METRIC_META[metricKey] : null;

  useEffect(() => {
    if (!metricKey) return;
    setRange(metricKey === 'weight' ? '1m' : '3m');
  }, [metricKey, visible]);
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [metricKey, range]);

  const mergedMeasurements = useMemo(() => {
    if (metricKey !== 'weight') return measurements;
    const base = new Map<string, MeasurementEntry>();
    measurements.forEach((entry) => {
      base.set(entry.date, entry);
    });
    const surveys = dailySurveyRepository.getSurveysWithWeight();
    surveys.forEach((survey) => {
      const existing = base.get(survey.date);
      if (existing) {
        if (existing.weight == null) {
          base.set(survey.date, { ...existing, weight: survey.weight ?? null });
        }
        return;
      }
      base.set(survey.date, {
        id: `survey-${survey.date}`,
        date: survey.date,
        weight: survey.weight ?? null,
        chest: null,
        waist: null,
        hips: null,
        leftArm: null,
        rightArm: null,
        leftLeg: null,
        rightLeg: null,
        photoFront: null,
        photoSide: null,
        photoBack: null,
        synced: true,
        createdAt: survey.date,
      });
    });
    return Array.from(base.values());
  }, [measurements, metricKey]);

  const entriesAsc = useMemo(() => {
    if (!metricKey) return [];
    const source = metricKey === 'weight' ? mergedMeasurements : measurements;
    const sorted = [...source].sort((a, b) => a.date.localeCompare(b.date));
    const filtered = sorted.filter((entry) => {
      if (metricKey === 'weight') return typeof entry.weight === 'number';
      if (metricKey === 'arms') return typeof entry.leftArm === 'number' && typeof entry.rightArm === 'number';
      if (metricKey === 'legs') return typeof entry.leftLeg === 'number' && typeof entry.rightLeg === 'number';
      return typeof entry[metricKey] === 'number';
    });
    const cutoff = getRangeCutoff(range);
    if (!cutoff) return filtered;
    return filtered.filter((entry) => getDateObj(entry.date) >= cutoff);
  }, [measurements, mergedMeasurements, metricKey, range]);

  const entriesDesc = useMemo(
    () => [...entriesAsc].sort((a, b) => b.date.localeCompare(a.date)),
    [entriesAsc]
  );

  const seriesValues = useMemo(() => {
    if (!metricKey) return [];
    if (metricKey === 'arms') {
      return entriesAsc.map((entry) => (typeof entry.leftArm === 'number' ? entry.leftArm : null));
    }
    if (metricKey === 'legs') {
      return entriesAsc.map((entry) => (typeof entry.leftLeg === 'number' ? entry.leftLeg : null));
    }
    return entriesAsc.map((entry) => entry[metricKey] as number);
  }, [entriesAsc, metricKey]);
  const secondarySeriesValues = useMemo(() => {
    if (!metricKey) return [];
    if (metricKey === 'arms') {
      return entriesAsc.map((entry) => (typeof entry.rightArm === 'number' ? entry.rightArm : null));
    }
    if (metricKey === 'legs') {
      return entriesAsc.map((entry) => (typeof entry.rightLeg === 'number' ? entry.rightLeg : null));
    }
    return [];
  }, [entriesAsc, metricKey]);
  const lineData = useMemo(() => buildLinePath(seriesValues), [seriesValues]);
  const secondaryLineData = useMemo(
    () => (secondarySeriesValues.length ? buildLinePath(secondarySeriesValues) : null),
    [secondarySeriesValues]
  );
  const latestValue = entriesAsc.length
    ? metricKey === 'arms'
      ? entriesAsc[entriesAsc.length - 1].leftArm ?? null
      : metricKey === 'legs'
        ? entriesAsc[entriesAsc.length - 1].leftLeg ?? null
        : (entriesAsc[entriesAsc.length - 1][metricKey] as number)
    : null;
  const latestSecondaryValue = entriesAsc.length
    ? metricKey === 'arms'
      ? entriesAsc[entriesAsc.length - 1].rightArm ?? null
      : metricKey === 'legs'
        ? entriesAsc[entriesAsc.length - 1].rightLeg ?? null
        : null
    : null;
  const firstValue = entriesAsc.length > 1
    ? metricKey === 'arms'
      ? entriesAsc[0].leftArm ?? null
      : metricKey === 'legs'
        ? entriesAsc[0].leftLeg ?? null
        : (entriesAsc[0][metricKey] as number)
    : null;
  const firstSecondaryValue = entriesAsc.length > 1
    ? metricKey === 'arms'
      ? entriesAsc[0].rightArm ?? null
      : metricKey === 'legs'
        ? entriesAsc[0].rightLeg ?? null
        : null
    : null;
  const averageLatest = latestValue != null && latestSecondaryValue != null
    ? (latestValue + latestSecondaryValue) / 2
    : latestValue ?? latestSecondaryValue;
  const averageFirst = firstValue != null && firstSecondaryValue != null
    ? (firstValue + firstSecondaryValue) / 2
    : firstValue ?? firstSecondaryValue;
  const delta = averageLatest != null && averageFirst != null ? averageLatest - averageFirst : null;
  const hoveredEntry = hovered ? entriesAsc[hovered.index] : null;
  const isDual = metricKey === 'arms' || metricKey === 'legs';
  const summaryValueText = metric
    ? isDual
      ? `Л ${formatValue(latestValue)} / П ${formatValue(latestSecondaryValue)} ${metric.unit}`
      : `${formatValue(latestValue)} ${metric.unit}`
    : '—';
  const tooltipValueText = metric && hoveredEntry
    ? isDual
      ? `Л ${formatValue(metricKey === 'arms' ? hoveredEntry.leftArm ?? null : hoveredEntry.leftLeg ?? null)} / П ${formatValue(metricKey === 'arms' ? hoveredEntry.rightArm ?? null : hoveredEntry.rightLeg ?? null)} ${metric.unit}`
      : `${formatValue(hoveredEntry[metricKey] as number)} ${metric.unit}`
    : '';

  const handleChartLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (width !== chartSize.width || height !== chartSize.height) {
      setChartSize({ width, height });
    }
  };

  const tooltipLeft = hovered
    ? Math.min(Math.max(8, hovered.x - 44), Math.max(8, chartSize.width - 88))
    : 0;
  const tooltipTop = hovered
    ? Math.min(Math.max(8, hovered.y - 52), Math.max(8, chartSize.height - 60))
    : 0;

  return (
    <SharedBottomSheet
      visible={visible}
      onClose={onClose}
      enableSwipeToDismiss
      headerSwipeHeight={56}
    >
      <View style={styles.header}>
        <Text style={styles.title}>{metric ? `Прогресс — ${metric.label}` : 'Прогресс'}</Text>
      </View>

      <View style={styles.rangeRow}>
        {RANGE_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.key}
            onPress={() => setRange(option.key)}
            style={[
              styles.rangeChip,
              range === option.key ? styles.rangeChipActive : null,
            ]}
          >
            <Text
              style={[
                styles.rangeText,
                range === option.key ? styles.rangeTextActive : null,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.summaryRow}>
        <Text style={styles.summaryValue}>
          {summaryValueText}
        </Text>
        {delta != null ? (
          <Text style={[styles.summaryDelta, delta >= 0 ? styles.deltaUp : styles.deltaDown]}>
            {delta >= 0 ? '+' : ''}{delta.toFixed(1)} {metric?.unit}
          </Text>
        ) : null}
      </View>
      <View style={styles.chartWrap} onLayout={handleChartLayout}>
        {metric ? (
          <MeasurementChart
            type="line"
            color={metric.color}
            linePath={lineData.path}
            points={lineData.points}
            secondaryLinePath={secondaryLineData?.path}
            secondaryPoints={secondaryLineData?.points}
            secondaryColor={metric.secondaryColor}
            size="full"
            verticalScale={1.6}
            interactive
            highlightIndex={hovered?.index ?? null}
            onPointHover={setHovered}
          />
        ) : null}
        {entriesAsc.length > 0 ? (
          <View style={styles.chartDates}>
            <Text style={styles.chartDateText}>{formatDateLabel(entriesAsc[0].date)}</Text>
            <Text style={styles.chartDateText}>{formatDateLabel(entriesAsc[entriesAsc.length - 1].date)}</Text>
          </View>
        ) : null}
        {metric && isDual ? (
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendSwatch, { backgroundColor: metric.color }]} />
              <Text style={styles.legendText}>Левая</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendSwatch, { backgroundColor: metric.secondaryColor }]} />
              <Text style={styles.legendText}>Правая</Text>
            </View>
          </View>
        ) : null}
        {hoveredEntry && metric ? (
          <View
            pointerEvents="none"
            style={[styles.tooltip, { left: tooltipLeft, top: tooltipTop }]}
          >
            <Text style={styles.tooltipDate}>{formatDateLabel(hoveredEntry.date)}</Text>
            <Text style={styles.tooltipValue}>{tooltipValueText}</Text>
          </View>
        ) : null}
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {entriesDesc.slice(0, visibleCount).map((entry) => (
          <View key={entry.id} style={styles.entryRow}>
            <Text style={styles.entryDate}>{formatDateLabel(entry.date)}</Text>
            <Text style={styles.entryValue}>
              {isDual
                ? `Л ${formatValue(metricKey === 'arms' ? entry.leftArm ?? null : entry.leftLeg ?? null)} / П ${formatValue(metricKey === 'arms' ? entry.rightArm ?? null : entry.rightLeg ?? null)} ${metric?.unit}`
                : `${formatValue(entry[metricKey!] as number)} ${metric?.unit}`}
            </Text>
          </View>
        ))}
        {entriesAsc.length === 0 ? (
          <Text style={styles.emptyText}>Нет данных для выбранного периода</Text>
        ) : null}
        {entriesDesc.length > visibleCount ? (
          <TouchableOpacity
            style={styles.loadMoreButton}
            onPress={() => setVisibleCount((count) => Math.min(count + PAGE_SIZE, entriesDesc.length))}
          >
            <Text style={styles.loadMoreText}>Показать ещё</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>
    </SharedBottomSheet>
  );
};

const styles = StyleSheet.create({
  header: {
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 16,
    fontFamily: fonts.semibold,
    color: colors.textPrimary,
  },
  rangeRow: {
    flexDirection: 'row',
    justifyContent: "flex-start",
    marginBottom: spacing.xs,
  },
  rangeChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs/2,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.divider,
    marginRight: spacing.md,
    backgroundColor: colors.surface,
  },
  rangeChipActive: {
    backgroundColor: `${colors.primary}18`,
    borderColor: `${colors.primary}55`,
  },
  rangeText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
  },
  rangeTextActive: {
    color: colors.textPrimary,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing.sm,
  },
  summaryValue: {
    fontSize: 24,
    fontFamily: fonts.bold,
    color: colors.textPrimary,
    marginRight: spacing.sm,
  },
  summaryDelta: {
    fontSize: 14,
    fontFamily: fonts.semibold,
  },
  legendRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendSwatch: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
  },
  deltaUp: {
    color: colors.accentFiber,
  },
  deltaDown: {
    color: colors.danger,
  },
  chartWrap: {
    height: 140,
    position: 'relative',
    marginBottom: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderColor: colors.divider,
    borderWidth: StyleSheet.hairlineWidth,
    
  },
  chartDates: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: -spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  chartDateText: {
    fontSize: 11,
    fontFamily: fonts.medium,
    color: colors.textTertiary,
  },
  tooltip: {
    position: 'absolute',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    backgroundColor:`${colors.surface}aa`,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.divider,
  },
  tooltipDate: {
    fontSize: 11,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
  },
  tooltipValue: {
    fontSize: 13,
    fontFamily: fonts.semibold,
    color: colors.textPrimary,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  entryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  entryDate: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
  },
  entryValue: {
    fontSize: 14,
    fontFamily: fonts.semibold,
    color: colors.textPrimary,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: spacing.md,
    color: colors.textTertiary,
    fontFamily: fonts.medium,
  },
  loadMoreButton: {
    alignSelf: 'center',
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.divider,
    backgroundColor: colors.surface,
  },
  loadMoreText: {
    fontSize: 13,
    fontFamily: fonts.semibold,
    color: colors.textSecondary,
  },
});
