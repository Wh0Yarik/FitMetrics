import React from 'react';
import { View, StyleSheet } from 'react-native';
import { StatsCard } from '../model/useMeasurementsData';
import { MeasurementStatCard } from './MeasurementStatCard';
import { spacing } from '../../../shared/ui';

type MeasurementStatsGridProps = {
  statsCards: StatsCard[];
  onCardPress?: (card: StatsCard) => void;
};

export const MeasurementStatsGrid = ({ statsCards, onCardPress }: MeasurementStatsGridProps) => (
  <View style={styles.statsGrid}>
    {statsCards.map((card) => (
      <MeasurementStatCard
        key={card.key}
        card={card}
        onPress={onCardPress ? () => onCardPress(card) : undefined}
      />
    ))}
  </View>
);

const styles = StyleSheet.create({
  statsGrid: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
});
