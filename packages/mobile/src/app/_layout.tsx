import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { FlatList, ScrollView, SectionList } from 'react-native';

const setDefaultScrollIndicators = () => {
  ScrollView.defaultProps = {
    ...ScrollView.defaultProps,
    showsVerticalScrollIndicator: false,
    showsHorizontalScrollIndicator: false,
  };
  FlatList.defaultProps = {
    ...FlatList.defaultProps,
    showsVerticalScrollIndicator: false,
    showsHorizontalScrollIndicator: false,
  };
  SectionList.defaultProps = {
    ...SectionList.defaultProps,
    showsVerticalScrollIndicator: false,
    showsHorizontalScrollIndicator: false,
  };
};

setDefaultScrollIndicators();

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </SafeAreaProvider>
  );
}
