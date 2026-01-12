import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Circle } from 'react-native-svg';

import { colors, fonts, radii, shadows, spacing } from '../../../shared/ui';

type MacroCardProps = {
  label: string;
  current: number;
  target: number;
  accent: string;
  showTarget: boolean;
};

const MacroRing = ({ progress, accent }: { progress: number; accent: string }) => {
  const size = 48;
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const normalized = Math.max(0, progress);
  const baseProgress = Math.min(1, normalized);
  const overflowProgress = Math.min(1, Math.max(0, normalized - 1));
  const baseOffset = circumference * (1 - baseProgress);
  const overflowOffset = circumference * (1 - overflowProgress);
  const gradientId = `macro-${accent.replace('#', '')}`;
  const overflowColor = '#F97316';

  return (
    <Svg width={size} height={size}>
      <Defs>
        <LinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={accent} stopOpacity="0.9" />
          <Stop offset="1" stopColor={`${accent}66`} />
        </LinearGradient>
      </Defs>
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={colors.divider}
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={`${circumference}`}
      />
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={`url(#${gradientId})`}
        strokeWidth={strokeWidth}
        strokeDasharray={`${circumference}`}
        strokeDashoffset={baseOffset}
        strokeLinecap="round"
        fill="none"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      {overflowProgress > 0 ? (
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={overflowColor}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference}`}
          strokeDashoffset={overflowOffset}
          strokeLinecap="round"
          fill="none"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      ) : null}
    </Svg>
  );
};

export const MacroCard = React.memo(({
  label,
  current,
  target,
  accent,
  showTarget,
}: MacroCardProps) => {
  const progress = target > 0 ? current / target : 0;

  return (
    <View style={styles.macroCard}>
      <View style={styles.macroRingWrap}>
        <MacroRing progress={showTarget ? progress : 1} accent={accent} />
        <View style={styles.macroRingCenter}>
          <Text style={[styles.macroValue, { color: accent }]}>{current}</Text>
        </View>
      </View>
      <View style={styles.macroInfo}>
        <Text style={styles.macroLabel}>{label}</Text>
        {showTarget ? (
          <Text style={styles.macroPlanFact}>/{target}</Text>
        ) : (
          <Text style={styles.macroPlanFactMuted}>Цель не задана</Text>
        )}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  macroCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.06)',
    marginBottom: spacing.sm,
    ...shadows.card,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  macroRingWrap: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  macroRingCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  macroValue: {
    fontSize: 22,
    fontFamily: fonts.bold,
    fontVariant: ['tabular-nums'],
  },
  macroInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  macroLabel: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  macroPlanFact: {
    marginTop: 2,
    fontSize: 16,
    color: colors.textTertiary,
    fontFamily: fonts.semibold,
    fontVariant: ['tabular-nums'],
  },
  macroPlanFactMuted: {
    marginTop: 2,
    fontSize: 12,
    color: colors.textTertiary,
    fontFamily: fonts.medium,
  },
});
