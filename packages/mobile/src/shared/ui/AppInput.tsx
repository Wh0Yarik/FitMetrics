import React from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View, ViewStyle } from 'react-native';

import { colors, fonts, radii, spacing } from './theme';

type AppInputProps = TextInputProps & {
  label?: string;
  error?: string | null;
  containerStyle?: ViewStyle;
};

export const AppInput = ({
  label,
  error,
  containerStyle,
  style,
  ...props
}: AppInputProps) => (
  <View style={containerStyle}>
    {label ? <Text style={styles.label}>{label}</Text> : null}
    <TextInput
      placeholderTextColor={colors.textTertiary}
      style={[styles.input, style, !!error && styles.inputError]}
      {...props}
    />
    {error ? <Text style={styles.error}>{error}</Text> : null}
  </View>
);

const styles = StyleSheet.create({
  label: {
    color: colors.textSecondary,
    fontSize: 12,
    fontFamily: fonts.medium,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.inputBg,
    borderRadius: radii.input,
    height: 52,
    paddingHorizontal: spacing.md,
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.textPrimary,
  },
  inputError: {
    borderWidth: 1,
    borderColor: colors.danger,
  },
  error: {
    marginTop: spacing.xs,
    color: colors.danger,
    fontSize: 12,
    fontFamily: fonts.medium,
  },
});
