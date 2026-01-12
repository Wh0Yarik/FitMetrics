import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
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
  const progress = useMemo(() => {
    if (!showTarget || target <= 0) return 0;
    return Math.max(0, Math.min(1, current / target));
  }, [current, showTarget, target]);

  const Icon = useMemo(() => {
    if (label === 'Белки') return Beef;
    if (label === 'Жиры') return Droplet;
    if (label === 'Углеводы') return Wheat;
    return Leaf;
  }, [label]);
  const progressLabel = showTarget && target > 0
    ? `${Math.round(progress * 100)}%`
    : 'Цель не задана';

  return (
    <View style={styles.macroCard}>
      <View style={styles.headerRow}>
        <View style={[styles.iconWrap, { backgroundColor: `${accent}22` }]}>
          <Icon size={18} color={accent} strokeWidth={1.5} />
        </View>
        <Text style={styles.macroLabel}>{label}</Text>
      </View>
      <View style={styles.valuesRow}>
        <Text style={styles.macroValue}>{current}</Text>
        {showTarget ? <Text style={styles.macroTarget}>/{target}</Text> : null}
      </View>
      <View style={styles.progressRow}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: accent }]} />
        </View>
        <Text style={styles.progressText}>{progressLabel}</Text>
      </View>
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
    gap: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  macroLabel: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
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
  macroTarget: {
    fontSize: 14,
    color: colors.textTertiary,
    fontFamily: fonts.medium,
    fontVariant: ['tabular-nums'],
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: radii.pill,
    backgroundColor: colors.divider,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: radii.pill,
  },
  progressText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.textTertiary,
    minWidth: 40,
    textAlign: 'right',
  },
});
