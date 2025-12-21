import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../../shared/api/client';
import { router } from 'expo-router';

const registerClientSchema = z.object({
  name: z.string().min(2, 'Имя должно быть не короче 2 символов'),
  email: z.string().email('Некорректный email'),
  password: z.string().min(6, 'Пароль должен быть не короче 6 символов'),
  inviteCode: z.string().length(6, 'Код должен состоять из 6 символов'),
});

type RegisterClientFormData = z.infer<typeof registerClientSchema>;

export default function RegisterClientScreen() {
  const [isLoading, setIsLoading] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<RegisterClientFormData>({
    resolver: zodResolver(registerClientSchema),
  });

  const onSubmit = async (data: RegisterClientFormData) => {
    setIsLoading(true);
    try {
      await api.post('/auth/register-client', data);
      
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
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.headerText}>Регистрация клиента</Text>
        <Text style={styles.subText}>Введите код приглашения от тренера</Text>

        <View style={styles.form}>
          <Text style={styles.label}>Имя</Text>
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, errors.name && styles.inputError]}
                placeholder="Ваше Имя"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            )}
          />
          {errors.name && <Text style={styles.errorText}>{errors.name.message}</Text>}

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
              <TextInput
                style={[styles.input, errors.password && styles.inputError]}
                placeholder="******"
                secureTextEntry
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            )}
          />
          {errors.password && <Text style={styles.errorText}>{errors.password.message}</Text>}

          <Text style={styles.label}>Код приглашения (Invite Code)</Text>
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
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { padding: 20 },
  headerText: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  subText: { fontSize: 16, color: '#666', marginBottom: 30 },
  form: { gap: 16 },
  label: { fontSize: 16, fontWeight: '500', marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  inputError: { borderColor: 'red' },
  errorText: { color: 'red', fontSize: 12, marginTop: -12 },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: { backgroundColor: '#ccc' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});