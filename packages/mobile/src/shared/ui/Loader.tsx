import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { colors, fonts, spacing } from './theme';

type LoaderProps = {
  label?: string;
  style?: ViewStyle;
};

export const Loader = ({ label, style }: LoaderProps) => (
  <View style={[styles.container, style]}>
    <ActivityIndicator color={colors.primary} />
    {label ? <Text style={styles.label}>{label}</Text> : null}
  </View>
);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 12,
    fontFamily: fonts.medium,
  },
});
