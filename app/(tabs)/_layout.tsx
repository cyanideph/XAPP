import { Tabs } from 'expo-router';
import { useTheme } from 'tamagui';
import { useXAppTheme } from '../../src/theme/theme';

export default function TabLayout() {
  const { resolvedMode } = useXAppTheme();
  const theme = useTheme();
  const isDark = resolvedMode === 'dark';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: theme.background.val },
        tabBarActiveTintColor: theme.brandBackground?.val ?? theme.color.val,
        tabBarInactiveTintColor: theme.colorPress?.val ?? theme.color.val,
        tabBarStyle: {
          backgroundColor: theme.background.val,
          borderTopWidth: 1,
          borderTopColor: theme.borderColor.val,
          height: 72,
          paddingTop: 8,
          paddingBottom: 10,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        tabBarIconStyle: {
          opacity: isDark ? 0.96 : 1,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="discover" options={{ title: 'Discover' }} />
      <Tabs.Screen name="chats" options={{ title: 'Chats' }} />
      <Tabs.Screen name="me" options={{ title: 'Me' }} />
    </Tabs>
  );
}
