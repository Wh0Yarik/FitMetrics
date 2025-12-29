import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import { router, Stack } from 'expo-router';
import { COLORS } from '../../constants/Colors';

export default function WelcomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="dark-content" />
      <View pointerEvents="none" style={styles.bgAccentPrimary} />
      <View pointerEvents="none" style={styles.bgAccentSecondary} />

      <View style={styles.content}>
        <View style={styles.headerCard}>
          <Text style={styles.headerKicker}>FitMetrics</Text>
          <Text style={styles.title}>Выберите роль</Text>
          <Text style={styles.subtitle}>Начните работу с дневником и прогрессом</Text>
        </View>

        <View style={styles.buttonsContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.clientButton]} 
            onPress={() => router.push('/auth/register-client')}
          >
            <Text style={styles.clientButtonText}>Я Клиент</Text>
            <Text style={styles.buttonDescription}>У меня есть инвайт-код</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.trainerButton]} 
            onPress={() => router.push('/auth/register-trainer')}
          >
            <Text style={styles.trainerButtonText}>Я Тренер</Text>
            <Text style={styles.buttonDescriptionDark}>Хочу вести клиентов</Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Уже есть аккаунт?</Text>
            <TouchableOpacity onPress={() => router.push('/auth/login')}>
              <Text style={styles.loginLink}>Войти</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAF8',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  bgAccentPrimary: {
    position: 'absolute',
    top: -120,
    right: -80,
    width: 220,
    height: 220,
    borderRadius: 999,
    backgroundColor: '#DCFCE7',
    opacity: 0.7,
  },
  bgAccentSecondary: {
    position: 'absolute',
    top: 140,
    left: -110,
    width: 240,
    height: 240,
    borderRadius: 999,
    backgroundColor: '#E0F2FE',
    opacity: 0.5,
  },
  headerCard: {
    marginTop: 32,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
  },
  headerKicker: {
    color: '#6B7280',
    fontSize: 12,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    marginTop: 6,
    fontSize: 13,
    color: '#6B7280',
  },
  buttonsContainer: {
    gap: 16,
    marginBottom: 20,
  },
  button: {
    padding: 18,
    borderRadius: 18,
    alignItems: 'center',
    borderWidth: 1,
    width: '100%',
  },
  clientButton: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  trainerButton: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
  },
  clientButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  trainerButtonText: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  buttonDescription: {
    color: '#ECFDF3',
    fontSize: 14,
  },
  buttonDescriptionDark: {
    color: '#6B7280',
    fontSize: 14,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    gap: 8,
  },
  footerText: {
    color: '#6B7280',
    fontSize: 14,
  },
  loginLink: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '700',
  },
});
