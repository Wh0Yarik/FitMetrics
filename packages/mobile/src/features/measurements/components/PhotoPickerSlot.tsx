import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Camera, X } from 'lucide-react-native';
import { colors, fonts, radii, shadows, spacing } from '../../../shared/ui';

type PhotoPickerSlotProps = {
  label: string;
  uri: string | null;
  onPick: () => void;
  onClear: () => void;
};

export const PhotoPickerSlot = ({ label, uri, onPick, onClear }: PhotoPickerSlotProps) => (
  <View style={styles.photoPicker}>
    <Text style={styles.photoLabel}>{label}</Text>
    <TouchableOpacity
      onPress={onPick}
      style={[styles.photoCard, uri ? styles.photoCardActive : styles.photoCardIdle]}
    >
      {uri ? (
        <>
          <Image source={{ uri }} style={styles.photoImage} resizeMode="cover" />
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              onClear();
            }}
            style={styles.photoClear}
          >
            <X size={12} color={colors.surface} />
          </TouchableOpacity>
        </>
      ) : (
        <Camera size={22} color={colors.textTertiary} />
      )}
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  photoPicker: {
    flex: 1,
    alignItems: 'center',
  },
  photoLabel: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  photoCard: {
    width: 88,
    height: 120,
    borderRadius: radii.card,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
    ...shadows.card,
  },
  photoCardIdle: {
    backgroundColor: colors.inputBg,
  },
  photoCardActive: {
    backgroundColor: colors.surface,
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoClear: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    padding: 4,
    borderRadius: radii.pill,
  },
});
