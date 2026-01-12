import React, { useCallback, useState } from 'react';
import { LayoutChangeEvent, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react-native';

import { StatsCard } from '../model/useMeasurementsData';
import { MeasurementChart } from './MeasurementChart';
import { colors, fonts, radii, shadows, spacing } from '../../../shared/ui';

type MeasurementStatCardProps = {
  card: StatsCard;
  onPress?: () => void;
};

const formatValue = (value: number | null) => {
  if (value == null) return '—';
  return Number.isInteger(value) ? value.toString() : value.toFixed(1);
};

const formatPair = (pair?: { left: number | null; right: number | null }) => {
  if (!pair) return null;
  const left = formatValue(pair.left);
  const right = formatValue(pair.right);
  return `Л ${left} / П ${right}`;
};

export const MeasurementStatCard = ({ card, onPress }: MeasurementStatCardProps) => {
  const hasDelta = card.delta != null;
  const isPositive = hasDelta && card.delta! > 0;
  const isNegative = hasDelta && card.delta! < 0;
  const [chartLayout, setChartLayout] = useState({ width: 0, height: 0 });

  const handleChartLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setChartLayout({ width, height });
  }, []);

  let deltaColor = colors.textTertiary;
  let deltaBg = colors.inputBg;
  let Icon = Minus;

  if (isPositive) {
    deltaColor = colors.accentFiber;
    deltaBg = `${colors.accentFiber}18`;
    Icon = TrendingUp;
  } else if (isNegative) {
    deltaColor = colors.danger;
    deltaBg = colors.dangerLight;
    Icon = TrendingDown;
  }

  const valueLabel = formatPair(card.latestPair) ?? formatValue(card.latestValue);

  return (
    <TouchableOpacity style={styles.container} activeOpacity={0.9} onPress={onPress}>
      <View style={styles.chartBackground} pointerEvents="none" onLayout={handleChartLayout}>
        <MeasurementChart
          type="line"
          color={card.color}
          linePath={card.linePath}
          points={card.linePoints}
          secondaryLinePath={card.secondaryLinePath}
          secondaryPoints={card.secondaryLinePoints}
          secondaryColor={card.secondaryColor}
          series={card.series}
          emptyLabel="Нет данных"
          size="full"
          layoutOverride={chartLayout.width > 0 && chartLayout.height > 0 ? chartLayout : undefined}
        />
      </View>
      <View style={styles.leftOverlay} pointerEvents="none">
        <View style={styles.leftOverlaySolid} />
        <View style={styles.leftOverlayFadeStrong} />
        <View style={styles.leftOverlayFadeLight} />
      </View>
      <View style={styles.contentPadding}>
        <View style={styles.header}>
          <Text style={styles.title}>{card.label}</Text>
          <Text style={styles.subtitle}>
            {card.key === 'weight' ? 'Последние 14 дней' : 'Последние 5 измерений'}
          </Text>
        </View>

        {card.latestPair ? (
          <View style={styles.valueRow}>
            <View style={styles.valueWithUnit}>
              <Text style={styles.valueLabel}>Л</Text>
              <Text style={styles.valueSide}>{formatValue(card.latestPair.left)}</Text>
              <Text style={styles.unit}>{card.unit}</Text>
            </View>
            <View style={styles.valueWithUnit}>
              <Text style={styles.valueLabel}>П</Text>
              <Text style={styles.valueSide}>{formatValue(card.latestPair.right)}</Text>
              <Text style={styles.unit}>{card.unit}</Text>
            </View>
          </View>
        ) : (
          <View style={styles.valueContainer}>
            <Text style={styles.value}>{valueLabel}</Text>
            <Text style={styles.unit}>{card.unit}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    marginBottom: spacing.md,
    ...shadows.card,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
    overflow: 'hidden',
  },
  chartBackground: {
    ...StyleSheet.absoluteFillObject,
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: -50,
    top: 20,
    zIndex: 0,
  },
  leftOverlay: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '33%',
    zIndex: 1,
  },
  leftOverlaySolid: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
  },
  leftOverlayFadeStrong: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: -16,
    width: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  leftOverlayFadeLight: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: -32,
    width: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  contentPadding: {
    padding: spacing.md,
    paddingBottom: spacing.sm,
    zIndex: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 16,
    fontFamily: fonts.semibold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 11,
    fontFamily: fonts.medium,
    color: colors.textTertiary,
    marginTop: 2,
  },
  deltaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  deltaIcon: {
    marginRight: 4,
  },
  deltaText: {
    fontSize: 12,
    fontFamily: fonts.bold,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  valueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  valueWithUnit: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  valueLabel: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
  },
  valueSide: {
    fontSize: 32,
    fontFamily: fonts.bold,
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  value: {
    fontSize: 32,
    fontFamily: fonts.bold,
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  unit: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
    marginLeft: 6,
    marginBottom: 4,
  },
});
