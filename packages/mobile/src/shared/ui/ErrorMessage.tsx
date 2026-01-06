import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';

import { colors, spacing } from './theme';

type ErrorMessageProps = {
  message: string;
  style?: ViewStyle;
};

export const ErrorMessage = ({ message, style }: ErrorMessageProps) => (
  <View style={[styles.container, style]}>
    <Text style={styles.text}>{message}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: `${colors.danger}12`,
    borderRadius: 12,
  },
  text: {
    color: colors.danger,
    fontSize: 12,
  },
});
