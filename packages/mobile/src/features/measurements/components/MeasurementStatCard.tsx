import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

import { StatsCard } from '../model/useMeasurementsData';
import { MeasurementChart } from './MeasurementChart';

type MeasurementStatCardProps = {
  card: StatsCard;
};

const formatValue = (value: number | null, unit: string) => {
  if (value == null) return '—';
  const formatted = Number.isInteger(value) ? value : value.toFixed(1);
  return `${formatted} ${unit}`;
};

const formatDelta = (value: number | null, unit: string) => {
  if (value == null) return 'нет данных';
  const formatted = Number.isInteger(value) ? value : value.toFixed(1);
  const sign = value > 0 ? '+' : '';
  return `${sign}${formatted} ${unit}`;
};

export const MeasurementStatCard = ({ card }: MeasurementStatCardProps) => {
  const deltaLabel = formatDelta(card.delta, card.unit);
  return (
    <TouchableOpacity style={styles.statsCard} activeOpacity={0.85}>
      <View style={styles.statsCardHeader}>
        <Text style={styles.statsCardTitle}>{card.label}</Text>
        <Text style={styles.statsCardChevron}>›</Text>
      </View>
      <Text style={styles.statsCardSub}>
        {card.key === 'weight' ? 'Последние 14 дней' : 'Последние 7 дней'}
      </Text>
      <View style={styles.statsCardBody}>
        <View style={styles.statsCardValues}>
          <Text style={styles.statsCardValue}>{formatValue(card.latestValue, card.unit)}</Text>
          <Text
            style={[
              styles.statsCardDelta,
              card.delta == null
                ? styles.statsCardDeltaMuted
                : card.delta >= 0
                  ? styles.statsCardDeltaUp
                  : styles.statsCardDeltaDown,
            ]}
          >
            {deltaLabel}
          </Text>
        </View>
        <MeasurementChart
          type={card.key === 'weight' ? 'line' : 'bars'}
          color={card.color}
          linePath={card.linePath}
          series={card.series}
          emptyLabel="Нет данных"
        />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 14,
    marginBottom: 12,
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 6 },
  },
  statsCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statsCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  statsCardChevron: {
    fontSize: 18,
    color: '#CBD5E1',
  },
  statsCardSub: {
    marginTop: 4,
    fontSize: 11,
    color: '#9CA3AF',
  },
  statsCardBody: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  statsCardValues: {
    flex: 1,
    paddingRight: 12,
  },
  statsCardValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  statsCardDelta: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '600',
  },
  statsCardDeltaMuted: {
    color: '#9CA3AF',
  },
  statsCardDeltaUp: {
    color: '#16A34A',
  },
  statsCardDeltaDown: {
    color: '#DC2626',
  },
});
