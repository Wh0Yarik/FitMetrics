import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';

type MeasurementChartProps = {
  type: 'line' | 'bars';
  color: string;
  linePath?: string;
  series?: number[];
  emptyLabel?: string;
};

export const MeasurementChart = ({ type, color, linePath, series, emptyLabel }: MeasurementChartProps) => {
  if (type === 'line') {
    return (
      <View style={styles.chart}>
        {linePath ? (
          <Svg width="100%" height="100%" viewBox="0 0 100 100">
            <Path
              d={linePath}
              fill="none"
              stroke={color}
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        ) : emptyLabel ? (
          <View style={styles.emptyWrap}>
            <View style={styles.emptyLine} />
            <View style={styles.emptyLineShort} />
          </View>
        ) : null}
      </View>
    );
  }

  const hasBars = (series ?? []).some((value) => value > 0);
  return (
    <View style={[styles.chart, styles.barRow]}>
      {hasBars
        ? (series ?? []).map((ratio, index) => (
            <View
              key={`bar-${index}`}
              style={[
                styles.bar,
                {
                  height: `${Math.max(0, ratio) * 100}%`,
                  backgroundColor: ratio > 0 ? color : '#E5E7EB',
                },
              ]}
            />
          ))
        : (
            <View style={styles.emptyWrap}>
              <View style={styles.emptyLine} />
              <View style={styles.emptyLineShort} />
            </View>
          )}
    </View>
  );
};

const styles = StyleSheet.create({
  chart: {
    width: 90,
    height: 48,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  bar: {
    width: 8,
    borderRadius: 999,
  },
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    gap: 8,
  },
  emptyLine: {
    height: 6,
    borderRadius: 999,
    backgroundColor: '#E5E7EB',
  },
  emptyLineShort: {
    height: 6,
    width: '60%',
    borderRadius: 999,
    backgroundColor: '#E5E7EB',
  },
});
