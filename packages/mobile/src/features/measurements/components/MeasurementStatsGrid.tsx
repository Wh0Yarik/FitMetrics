import React from 'react';
import { View, StyleSheet } from 'react-native';
import { StatsCard } from '../model/useMeasurementsData';
import { MeasurementStatCard } from './MeasurementStatCard';

type MeasurementStatsGridProps = {
  statsCards: StatsCard[];
};

export const MeasurementStatsGrid = ({ statsCards }: MeasurementStatsGridProps) => (
  <View style={styles.statsGrid}>
    {statsCards.map((card) => (
      <MeasurementStatCard key={card.key} card={card} />
    ))}
  </View>
);

const styles = StyleSheet.create({
  statsGrid: {
    marginTop: 12,
    paddingHorizontal: 24,
  },
});
