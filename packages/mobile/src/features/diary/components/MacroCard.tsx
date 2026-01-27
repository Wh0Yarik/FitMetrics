import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Beef, Droplet, Leaf, Wheat } from 'lucide-react-native';
import Svg, { Circle, G } from 'react-native-svg';
import * as Haptics from 'expo-haptics';

import { colors, fonts, radii, shadows, spacing } from '../../../shared/ui';

type MacroCardProps = {
  label: string;
  current: number;
  target: number;
  accent: string;
  showTarget: boolean;
  onPress?: () => void;
};

export const MacroCard = React.memo(({
  label,
  current,
  target,
  accent,
  showTarget,
  onPress,
}: MacroCardProps) => {
  const { width } = useWindowDimensions();
  const isCompact = width <= 360;
  const progressValue = useRef(new Animated.Value(0)).current;
  const pressAnim = useRef(new Animated.Value(1)).current;
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
  const ringSize = isCompact ? 88 : 105;
  const strokeWidth = isCompact ? 10 : 12;
  const radius = (ringSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = progressValue.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  useEffect(() => {
    Animated.spring(progressValue, {
      toValue: progress,
      speed: 6,
      bounciness: 8,
      useNativeDriver: false,
    }).start();
  }, [progress, progressValue]);

  return (
    <Pressable
      style={styles.macroCardPress}
      onPressIn={() => {
        Animated.spring(pressAnim, {
          toValue: 0.98,
          speed: 16,
          bounciness: 4,
          useNativeDriver: true,
        }).start();
      }}
      onPressOut={() => {
        Animated.spring(pressAnim, {
          toValue: 1,
          speed: 16,
          bounciness: 4,
          useNativeDriver: true,
        }).start();
      }}
      onPress={() => {
        Haptics.selectionAsync();
        onPress?.();
      }}
    >
      <Animated.View
        style={[
          styles.macroCard,
          isCompact && styles.macroCardCompact,
          isOverTarget && styles.macroCardOver,
          { transform: [{ scale: pressAnim }] },
        ]}
      >
        <View style={styles.ringWrap}>
          <Svg width={ringSize} height={ringSize}>
            <G rotation="-90" origin={`${ringSize / 2}, ${ringSize / 2}`}>
              <Circle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={radius}
                stroke="#EEF2F7"
                strokeWidth={strokeWidth}
                fill="none"
              />
              <AnimatedCircle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={radius}
                stroke={accent}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={`${circumference} ${circumference}`}
                strokeDashoffset={dashOffset}
                fill="none"
              />
            </G>
          </Svg>
          <View style={[styles.iconWrap, isCompact && styles.iconWrapCompact, { backgroundColor: `${accent}22` }]}>
            <Icon size={iconSize} color={accent} strokeWidth={1.5} />
          </View>
        </View>
        <View style={styles.valuesRow}>
          <Text style={[styles.macroValue, isCompact && styles.macroValueCompact, { color: accent }]} allowFontScaling={false}>
            {current}
          </Text>
          {showTarget ? (
            <Text style={[styles.macroTarget, isCompact && styles.macroTargetCompact, { color: accent }]} allowFontScaling={false}>
              /{target}
            </Text>
          ) : null}
          {isOverTarget ? (
            <View style={styles.overBadge}>
              <Text style={styles.overBadgeText}>{overflowLabel}</Text>
            </View>
          ) : null}
        </View>
        <Text style={[styles.macroLabel, isCompact && styles.macroLabelCompact]} numberOfLines={1} allowFontScaling={false}>
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
});

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const styles = StyleSheet.create({
  macroCardPress: {
    width: '48%',
  },
  macroCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.06)',
    marginBottom: spacing.sm,
    ...shadows.card,
    alignItems: 'stretch',
  },
  macroCardCompact: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  ringWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrap: {
    position: 'absolute',
    width: 52,
    height: 52,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapCompact: {
    width: 42,
    height: 42,
    borderRadius: 999,
  },
  macroLabel: {
    fontSize: 10,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  macroLabelCompact: {
    fontSize: 11,
    fontFamily: fonts.medium,
  },
  valuesRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
    justifyContent: 'center',
  },
  macroValue: {
    fontSize: 26,
    fontFamily: fonts.bold,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  macroValueCompact: {
    fontSize: 24,
    fontFamily: fonts.bold,
    fontWeight: '800',
  },
  macroTarget: {
    fontSize: 14,
    color: colors.textPrimary,
    fontFamily: fonts.light,
    fontVariant: ['tabular-nums'],
  },
  macroTargetCompact: {
    fontSize: 12,
    fontFamily: fonts.light,
  },
  overBadge: {
    marginLeft: spacing.xs,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: '#ffefe6',
  },
  overBadgeText: {
    fontSize: 11,
    fontFamily: fonts.semibold,
    color: '#F97316',
  },
  macroCardOver: {
    borderColor: '#F97316',
  },
});
