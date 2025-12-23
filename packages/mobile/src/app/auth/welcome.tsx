import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import { router, Stack } from 'expo-router';

export default function WelcomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.emoji}>💪</Text>
          <Text style={styles.title}>FitMetrics</Text>
          <Text style={styles.subtitle}>Твой персональный трекер{'\n'}прогресса и питания</Text>
        </View>

        <View style={styles.buttonsContainer}>
          {/* Кнопка регистрации клиента */}
          <TouchableOpacity 
            style={[styles.button, styles.clientButton]} 
            onPress={() => router.push('/auth/register-client')}
          >
            <Text style={styles.clientButtonText}>Я Клиент</Text>
            <Text style={styles.buttonDescription}>У меня есть инвайт-код</Text>
          </TouchableOpacity>

          {/* Кнопка регистрации тренера */}
          <TouchableOpacity 
            style={[styles.button, styles.trainerButton]} 
            onPress={() => router.push('/auth/register-trainer')}
          >
            <Text style={styles.trainerButtonText}>Я Тренер</Text>
            <Text style={styles.buttonDescriptionDark}>Хочу вести клиентов</Text>
          </TouchableOpacity>

          {/* Ссылка на вход */}
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
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  header: {
    marginTop: 80,
    alignItems: 'center',
  },
  emoji: {
    fontSize: 64,
    marginBottom: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonsContainer: {
    gap: 16,
    marginBottom: 20,
  },
  button: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    width: '100%',
  },
  clientButton: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  trainerButton: {
    backgroundColor: '#fff',
    borderColor: '#E5E5E5',
  },
  clientButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  trainerButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  buttonDescription: {
    color: '#9CA3AF',
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
    color: '#666',
    fontSize: 16,
  },
  loginLink: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
});