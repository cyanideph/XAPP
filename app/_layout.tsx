import { Stack, usePathname, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { Spinner, YStack } from 'tamagui';
import { TamaguiProvider } from 'tamagui';
import { tamaguiConfig } from '../tamagui.config';
import { useSession } from '../src/hooks/useSession';

export default function RootLayout() {
  const colorScheme = useColorScheme() ?? 'light';
  const { session, loading } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const inAuth = pathname.startsWith('/(auth)') || pathname === '/sign-in' || pathname === '/sign-up' || pathname === '/restore';

  useEffect(() => {
    if (loading) return;
    if (!session && !inAuth) router.replace('/(auth)/sign-in');
    if (session && inAuth) router.replace('/(tabs)');
  }, [inAuth, loading, router, session]);

  if (loading) return <TamaguiProvider config={tamaguiConfig} defaultTheme={colorScheme}><YStack f={1} ai="center" jc="center" bg="$background"><Spinner /></YStack></TamaguiProvider>;

  return (
    <TamaguiProvider config={tamaguiConfig} defaultTheme={colorScheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="room/[id]" options={{ headerShown: true, title: 'Room' }} />
        <Stack.Screen name="conversation/[id]" options={{ headerShown: true, title: 'Chat' }} />
      </Stack>
    </TamaguiProvider>
  );
}
