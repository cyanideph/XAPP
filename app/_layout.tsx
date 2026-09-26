import { Stack, usePathname, useRouter } from 'expo-router';
import { useTheme } from 'tamagui';
import { useEffect } from 'react';
import { ImageBackground } from 'react-native';
import { Spinner, YStack, TamaguiProvider } from 'tamagui';
import { tamaguiConfig } from '../tamagui.config';
import { useSession } from '../src/hooks/useSession';
import { XAppThemeProvider, useXAppTheme } from '../src/theme/theme';

function AppNavigation() {
  const theme = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerStyle: { backgroundColor: theme.background.val },
        headerTintColor: theme.color.val,
        headerTitleStyle: { color: theme.color.val, fontWeight: '700' },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: 'transparent' },
      }}
    >
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="room/[id]" options={{ headerShown: true, title: 'Room' }} />
      <Stack.Screen name="conversation/[id]" options={{ headerShown: true, title: 'Chat' }} />
    </Stack>
  );
}

function AppShell() {
  const { resolvedMode } = useXAppTheme();
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
      <ImageBackground
        source={require('../assets/backgrounds/1790421299991.jpg')}
        resizeMode="cover"
        style={{ flex: 1 }}
      >
        <YStack
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            backgroundColor: resolvedMode === 'dark' ? '#0D1410' : '#F7F8F6',
            opacity: resolvedMode === 'dark' ? 0.34 : 0.56,
          }}
        />
        {loading ? (
        <YStack flex={1} bg="$background" items="center" justify="center">
          <Spinner color="$brandBackground" />
        </YStack>
        ) : (
          <AppNavigation />
        )}
      </ImageBackground>
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
