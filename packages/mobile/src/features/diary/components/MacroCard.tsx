import React, { useMemo } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { Beef, Droplet, Leaf, Wheat } from 'lucide-react-native';

import { colors, fonts, radii, shadows, spacing } from '../../../shared/ui';

type MacroCardProps = {
  label: string;
  current: number;
  target: number;
  accent: string;
  showTarget: boolean;
};

export const MacroCard = React.memo(({
  label,
  current,
  target,
  accent,
  showTarget,
}: MacroCardProps) => {
  const { width } = useWindowDimensions();
  const isCompact = width <= 360;
  const progress = useMemo(() => {
    if (!showTarget || target <= 0) return 0;
    return Math.max(0, Math.min(1, current / target));
  }, [current, showTarget, target]);
  const overflowAmount = useMemo(() => {
    if (!showTarget || target <= 0) return 0;
    return Math.max(0, current - target);
  }, [current, showTarget, target]);
  const isOverTarget = overflowAmount > 0;
  const formatNumber = (value: number) => (
    Number.isInteger(value) ? value.toString() : value.toFixed(1)
  );
  const overflowLabel = isOverTarget ? `+${formatNumber(overflowAmount)}` : '';

  const Icon = useMemo(() => {
    if (label === 'Белки') return Beef;
    if (label === 'Жиры') return Droplet;
    if (label === 'Углеводы') return Wheat;
    return Leaf;
  }, [label]);
  const iconSize = isCompact ? 30 : 38;

  return (
    <View style={[styles.macroCard, isCompact && styles.macroCardCompact, isOverTarget && styles.macroCardOver]}>
      <View style={styles.topRow}>
        <View style={styles.valuesRow}>
          <Text style={[styles.macroValue, isCompact && styles.macroValueCompact, { color: accent }]} allowFontScaling={false}>
            {current}
          </Text>
          {showTarget ? (
            <Text style={[styles.macroTarget, isCompact && styles.macroTargetCompact]} allowFontScaling={false}>
              /{target}
            </Text>
          ) : null}
          {isOverTarget ? (
            <View style={styles.overBadge}>
              <Text style={styles.overBadgeText}>{overflowLabel}</Text>
            </View>
          ) : null}
        </View>
        <View style={[styles.iconWrap, isCompact && styles.iconWrapCompact, { backgroundColor: `${accent}22` }]}>
          <Icon size={iconSize} color={accent} strokeWidth={1.5} />
        </View>
      </View>
      <View style={[styles.progressTrack, isOverTarget && styles.progressTrackOver]}>
        <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: accent }]} />
      </View>
      <Text style={[styles.macroLabel, isCompact && styles.macroLabelCompact]} numberOfLines={1} allowFontScaling={false}>
        {label}
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  macroCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.06)',
    marginBottom: spacing.sm,
    ...shadows.card,
    alignItems: 'stretch',
    gap: spacing.xs,
  },
  macroCardCompact: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapCompact: {
    width: 34,
    height: 34,
    borderRadius: 10,
  },
  macroLabel: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  macroLabelCompact: {
    fontSize: 12,
  },
  valuesRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  macroValue: {
    fontSize: 24,
    fontFamily: fonts.bold,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  macroValueCompact: {
    fontSize: 20,
  },
  macroTarget: {
    fontSize: 14,
    color: colors.textTertiary,
    fontFamily: fonts.medium,
    fontVariant: ['tabular-nums'],
  },
  macroTargetCompact: {
    fontSize: 12,
  },
  overBadge: {
    marginLeft: spacing.xs,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: '#FFF7ED',
  },
  overBadgeText: {
    fontSize: 11,
    fontFamily: fonts.semibold,
    color: '#F97316',
  },
  progressTrack: {
    height: 8,
    borderRadius: radii.pill,
    backgroundColor: colors.divider,
    overflow: 'hidden',
    marginTop: spacing.xs,
  },
  progressTrackOver: {
    borderColor: '#F97316',
    borderWidth: 1,
  },
  progressFill: {
    height: '100%',
    borderRadius: radii.pill,
  },
  macroCardOver: {
    borderColor: '#F97316',
  },
});
