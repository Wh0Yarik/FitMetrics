import { StyleSheet } from 'react-native';

export const colors = {
  background: '#F9FAFB',
  surface: '#FFFFFF',
  primary: '#06B6D4',
  secondary: '#F59E0B',
  danger: '#EF4444',
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  inputBg: '#F3F4F6',
  divider: '#E5E7EB',
};

export const spacing = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
};

export const radii = {
  card: 20,
  button: 16,
  input: 16,
  pill: 999,
};

export const shadows = StyleSheet.create({
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    borderColor: 'rgba(0,0,0,0.05)',
    borderWidth: StyleSheet.hairlineWidth,
  },
  button: {
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
});
