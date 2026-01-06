import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../../shared/api/client';
import { router } from 'expo-router';
import { COLORS } from '../../constants/Colors';
import { normalizeBirthDateInput, parseBirthDateDisplay } from '../../shared/lib/date';
import { Eye, EyeOff } from 'lucide-react-native';

const registerClientSchema = z.object({
  name: z.string().min(2, 'Имя должно быть не короче 2 символов'),
  birthDate: z.string().regex(/^\d{2}\.\d{2}\.\d{4}$/, 'Введите дату в формате ДД.ММ.ГГГГ'),
  email: z.string().email('Некорректный email'),
  password: z.string().min(6, 'Пароль должен быть не короче 6 символов'),
  inviteCode: z
    .string()
    .optional()
    .refine((value) => !value || value.length === 6, 'Код должен состоять из 6 символов'),
});

type RegisterClientFormData = z.infer<typeof registerClientSchema>;

export default function RegisterClientScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<RegisterClientFormData>({
    resolver: zodResolver(registerClientSchema),
  });

  const onSubmit = async (data: RegisterClientFormData) => {
    setIsLoading(true);
    try {
      const birthDate = parseBirthDateDisplay(data.birthDate);
      if (!birthDate) {
        Alert.alert('Ошибка', 'Дата рождения должна быть в формате ДД.ММ.ГГГГ');
        return;
      }
      const payload = {
        ...data,
        birthDate,
        inviteCode: data.inviteCode?.trim() || undefined,
      };
      await api.post('/auth/register-client', payload);
      
      Alert.alert('Успех', 'Аккаунт клиента создан! Теперь войдите в систему.', [
        { text: 'OK', onPress: () => router.replace('/auth/login') }
      ]);
    } catch (error: any) {
      console.error(error);
      const message = error.response?.data?.message || 'Ошибка при регистрации';
      Alert.alert('Ошибка', message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <View pointerEvents="none" style={styles.bgAccentPrimary} />
      <View pointerEvents="none" style={styles.bgAccentSecondary} />
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.headerCard}>
              <Text style={styles.headerKicker}>Регистрация</Text>
              <Text style={styles.headerText}>Аккаунт клиента</Text>
              <Text style={styles.subText}>Инвайт-код можно добавить позже</Text>
            </View>

            <View style={styles.formCard}>
              <Text style={styles.label}>Имя</Text>
              <Controller
                control={control}
                name="name"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[styles.input, errors.name && styles.inputError]}
                    placeholder="Ваше имя"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                )}
              />
              {errors.name && <Text style={styles.errorText}>{errors.name.message}</Text>}

              <Text style={styles.label}>Дата рождения</Text>
              <Controller
                control={control}
                name="birthDate"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[styles.input, errors.birthDate && styles.inputError]}
                    placeholder="ДД.ММ.ГГГГ"
                    autoCapitalize="none"
                    keyboardType="numeric"
                    onBlur={onBlur}
                    onChangeText={(text) => onChange(normalizeBirthDateInput(text))}
                    value={value}
                  />
                )}
              />
              {errors.birthDate && <Text style={styles.errorText}>{errors.birthDate.message}</Text>}

              <Text style={styles.label}>Email</Text>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[styles.input, errors.email && styles.inputError]}
                    placeholder="client@example.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                )}
              />
              {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}

              <Text style={styles.label}>Пароль</Text>
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={styles.passwordRow}>
                    <TextInput
                      style={[styles.input, styles.passwordInput, errors.password && styles.inputError]}
                      placeholder="******"
                      secureTextEntry={!showPassword}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                    />
                    <TouchableOpacity
                      style={styles.passwordToggle}
                      onPressIn={() => setShowPassword(true)}
                      onPressOut={() => setShowPassword(false)}
                      accessibilityRole="button"
                      accessibilityLabel={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                    >
                      {showPassword ? <EyeOff size={18} color="#9CA3AF" /> : <Eye size={18} color="#9CA3AF" />}
                    </TouchableOpacity>
                  </View>
                )}
              />
              {errors.password && <Text style={styles.errorText}>{errors.password.message}</Text>}

              <Text style={styles.label}>Код приглашения (опционально)</Text>
              <Controller
                control={control}
                name="inviteCode"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[styles.input, errors.inviteCode && styles.inputError]}
                    placeholder="123456"
                    maxLength={6}
                    autoCapitalize="characters"
                    onBlur={onBlur}
                    onChangeText={(text) => onChange(text.toUpperCase())}
                    value={value}
                  />
                )}
              />
              {errors.inviteCode && <Text style={styles.errorText}>{errors.inviteCode.message}</Text>}

              <TouchableOpacity 
                style={[styles.button, isLoading && styles.buttonDisabled]} 
                onPress={handleSubmit(onSubmit)}
                disabled={isLoading}
              >
                {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Зарегистрироваться</Text>}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F7FAF8' },
  safe: { flex: 1 },
  container: { flex: 1 },
  scrollContent: { padding: 24 },
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
  headerText: { fontSize: 24, fontWeight: '700', color: '#111827' },
  subText: { fontSize: 13, color: '#6B7280', marginTop: 6 },
  formCard: {
    marginTop: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  label: { fontSize: 13, fontWeight: '600', color: '#6B7280', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#F9FAFB',
    color: '#111827',
    marginBottom: 12,
  },
  inputError: { borderColor: 'red' },
  errorText: { color: '#DC2626', fontSize: 12, marginTop: -8, marginBottom: 8 },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  passwordRow: {
    position: 'relative',
    justifyContent: 'center',
    marginBottom: 12,
  },
  passwordInput: {
    paddingRight: 44,
    marginBottom: 0,
  },
  passwordToggle: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
