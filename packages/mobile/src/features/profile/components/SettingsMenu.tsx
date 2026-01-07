import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

import { colors, fonts } from '../../../shared/ui';

type SettingsMenuProps = {
  onChangePassword: () => void;
  onLogout: () => void;
};

export const SettingsMenu = ({ onChangePassword, onLogout }: SettingsMenuProps) => (
  <>
    <TouchableOpacity onPress={onChangePassword} style={styles.secondaryButton}>
      <Text style={styles.secondaryButtonText}>Сменить пароль</Text>
    </TouchableOpacity>

    <TouchableOpacity onPress={onLogout} style={styles.logoutButton}>
      <Text style={styles.logoutButtonText}>Выход</Text>
    </TouchableOpacity>
  </>
);

const styles = StyleSheet.create({
  secondaryButton: {
    marginTop: 12,
    marginHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.divider,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.textPrimary,
  },
  logoutButton: {
    marginTop: 12,
    marginHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
  },
  logoutButtonText: {
    fontSize: 14,
    fontFamily: fonts.semibold,
    color: '#B91C1C',
  },
});
