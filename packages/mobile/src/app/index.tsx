import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';

export default function WelcomeScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>FitMetrics 🚀</Text>
        <Text style={styles.subtitle}>Твой фитнес-трекер</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.label}>Кто вы?</Text>

        <Link href="/auth/register-trainer" asChild>
          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>Я Тренер</Text>
          </TouchableOpacity>
        </Link>

        <Link href="/auth/register-client" asChild>
          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>Я Клиент</Text>
          </TouchableOpacity>
        </Link>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Уже есть аккаунт? </Text>
          <Link href="/auth/login">
            <Text style={styles.linkText}>Войти</Text>
          </Link>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    justifyContent: 'space-between',
  },
  header: {
    marginTop: 100,
    alignItems: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#000',
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginTop: 10,
  },
  content: {
    marginBottom: 50,
    width: '100%',
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: {
    color: '#666',
  },
  linkText: {
    color: '#007AFF',
    fontWeight: '600',
  },
});