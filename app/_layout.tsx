import { Stack, usePathname, useRouter } from 'expo-router';
import { useTheme } from 'tamagui';
import { useEffect } from 'react';
import { Spinner, YStack, TamaguiProvider } from 'tamagui';
import { tamaguiConfig } from '../tamagui.config';
import { useSession } from '../src/hooks/useSession';
import { XAppThemeProvider, useXAppTheme } from '../src/theme/theme';

function AppShell() {
  const { resolvedMode } = useXAppTheme();
  const theme = useTheme();
  const { session, loading } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const inAuth = pathname.startsWith('/(auth)') || pathname === '/sign-in' || pathname === '/sign-up' || pathname === '/restore';

  useEffect(() => {
    if (loading) return;
    if (!session && !inAuth) router.replace('/(auth)/sign-in');
    if (session && inAuth) router.replace('/(tabs)');
  }, [inAuth, loading, router, session]);

  return (
    <TamaguiProvider config={tamaguiConfig} defaultTheme={resolvedMode}>
      {loading ? (
        <YStack flex={1} bg="$background" items="center" justify="center">
          <Spinner color="$brandBackground" />
        </YStack>
      ) : (
        <Stack
          screenOptions={{
            headerShown: false,
            headerStyle: { backgroundColor: theme.background.val },
            headerTintColor: theme.color.val,
            headerTitleStyle: { color: theme.color.val, fontWeight: '700' },
            headerShadowVisible: false,
          }}
        >
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="room/[id]" options={{ headerShown: true, title: 'Room' }} />
          <Stack.Screen name="conversation/[id]" options={{ headerShown: true, title: 'Chat' }} />
        </Stack>
      )}
    </TamaguiProvider>
  );
}

export default function RootLayout() {
  return (
    <XAppThemeProvider>
      <AppShell />
    </XAppThemeProvider>
  );
}
