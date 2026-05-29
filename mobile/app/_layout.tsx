import 'react-native-gesture-handler';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { FinanceProvider } from '../context/FinanceContext';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <FinanceProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="subscriptions_modal" options={{ presentation: 'modal', headerShown: false }} />
            <Stack.Screen name="expenses_modal" options={{ presentation: 'modal', headerShown: false }} />
            <Stack.Screen name="analytics_modal" options={{ presentation: 'modal', headerShown: false }} />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </FinanceProvider>
    </GestureHandlerRootView>
  );
}
