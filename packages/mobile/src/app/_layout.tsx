import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { FlatList, ScrollView, SectionList, Text, TextInput } from 'react-native';

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

let defaultsApplied = false;

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'Comfortaa-Light': require('../../assets/fonts/Comfortaa-Light.ttf'),
    'Comfortaa-Regular': require('../../assets/fonts/Comfortaa-Regular.ttf'),
    'Comfortaa-Medium': require('../../assets/fonts/Comfortaa-Medium.ttf'),
    'Comfortaa-SemiBold': require('../../assets/fonts/Comfortaa-SemiBold.ttf'),
    'Comfortaa-Bold': require('../../assets/fonts/Comfortaa-Bold.ttf'),
  });

  if (fontsLoaded && !defaultsApplied) {
    defaultsApplied = true;
    Text.defaultProps = Text.defaultProps || {};
    TextInput.defaultProps = TextInput.defaultProps || {};
    Text.defaultProps.allowFontScaling = false;
    TextInput.defaultProps.allowFontScaling = false;
    Text.defaultProps.style = [Text.defaultProps.style, { fontFamily: 'Comfortaa-Regular' }];
    TextInput.defaultProps.style = [TextInput.defaultProps.style, { fontFamily: 'Comfortaa-Regular' }];
  }

  if (!fontsLoaded) {
    return null;
  }

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
