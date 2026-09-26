import { Tabs } from 'expo-router';
import { useXAppTheme } from '../../src/theme/theme';

export default function TabLayout() {
  const { resolvedMode } = useXAppTheme();
  const isDark = resolvedMode === 'dark';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: isDark ? '#F4F5F1' : '#171916',
        tabBarInactiveTintColor: isDark ? '#858981' : '#7C7E76',
        tabBarStyle: {
          backgroundColor: isDark ? '#171A15' : '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: isDark ? '#292C26' : '#E8E8E4',
          height: 72,
          paddingTop: 8,
          paddingBottom: 10,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
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
