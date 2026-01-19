import React from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';

import { colors, radii, shadows, spacing } from './theme';

type CardProps = {
  children: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  delayLongPress?: number;
  style?: ViewStyle;
  variant?: 'surface' | 'muted';
};

export const Card = ({
  children,
  onPress,
  onLongPress,
  delayLongPress,
  style,
  variant = 'surface',
}: CardProps) => {
  const containerStyle = [
    styles.base,
    variant === 'muted' ? styles.muted : styles.surface,
    style,
  ];

  if (onPress || onLongPress) {
    return (
      <Pressable
        style={({ pressed }) => [containerStyle, pressed && styles.pressed]}
        onPress={onPress}
        onLongPress={onLongPress}
        delayLongPress={delayLongPress}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={containerStyle}>{children}</View>;
};

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.card,
    padding: spacing.md,
    backgroundColor: colors.surface,
    ...shadows.card,
  },
  surface: {
    backgroundColor: colors.surface,
  },
  muted: {
    backgroundColor: colors.inputBg,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
});
