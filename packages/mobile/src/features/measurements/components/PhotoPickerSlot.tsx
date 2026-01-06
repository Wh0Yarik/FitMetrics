import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Camera, X } from 'lucide-react-native';

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
            <X size={12} color="#FFFFFF" />
          </TouchableOpacity>
        </>
      ) : (
        <Camera size={22} color="#9CA3AF" />
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
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  photoCard: {
    width: 88,
    height: 120,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  photoCardIdle: {
    backgroundColor: '#F9FAFB',
  },
  photoCardActive: {
    borderColor: '#D1FAE5',
    backgroundColor: '#FFFFFF',
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
    borderRadius: 999,
  },
});
