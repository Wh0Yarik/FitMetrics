import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Circle } from 'react-native-svg';

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
        stroke="#E5E7EB"
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
    <View style={[styles.macroCard, { borderColor: `${accent}33` }]}>
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
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderWidth: 2,
    shadowColor: '#111827',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
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
    fontWeight: '900',
  },
  macroInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  macroLabel: {
    fontSize: 16,
    fontWeight: '300',
    color: '#6B7280',
    textTransform: 'none',
    letterSpacing: 0.4,
    lineHeight: 18,
    minHeight: 18,
  },
  macroPlanFact: {
    marginTop: 0,
    fontSize: 18,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  macroPlanFactMuted: {
    marginTop: 0,
    fontSize: 15,
    color: '#9CA3AF',
    fontWeight: '800',
  },
});
