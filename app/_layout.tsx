import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { TamaguiProvider } from 'tamagui';
import { tamaguiConfig } from '../tamagui.config';

export default function RootLayout() {
  const colorScheme = useColorScheme() ?? 'light';

  return (
    <TamaguiProvider config={tamaguiConfig} defaultTheme={colorScheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="room/[id]" options={{ headerShown: true, title: 'Room' }} />
        <Stack.Screen name="conversation/[id]" options={{ headerShown: true, title: 'Chat' }} />
      </Stack>
    </TamaguiProvider>
  );
}
