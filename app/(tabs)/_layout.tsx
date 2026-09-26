import { Tabs } from 'expo-router';
import { useTheme, XStack } from 'tamagui';
import { useXAppTheme } from '../../src/theme/theme';
import { XIcon, type XAPPIconName } from '../../src/components/XIcon';

const tabIcons: Record<string, XAPPIconName> = {
  index: 'home',
  discover: 'search',
  chats: 'message',
  me: 'user',
};

function TabIcon({ name, focused }: { name: XAPPIconName; focused: boolean }) {
  return (
    <XStack
      width={36}
      height={30}
      rounded="$3"
      items="center"
      justify="center"
      backgroundColor={focused ? '$brandBackground' : 'transparent'}
    >
      <XIcon
        name={name}
        size={20}
        color={focused ? '#FFFFFF' : '#8B85FF'}
        strokeWidth={focused ? 2.4 : 2.1}
        accessibilityLabel={name}
      />
    </XStack>
  );
}

export default function TabLayout() {
  const { resolvedMode } = useXAppTheme();
  const theme = useTheme();
  const isDark = resolvedMode === 'dark';

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        sceneStyle: { backgroundColor: 'transparent' },
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
        tabBarIcon: ({ focused }) => (
          <TabIcon name={tabIcons[route.name] ?? 'home'} focused={focused} />
        ),
      })}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="discover" options={{ title: 'Discover' }} />
      <Tabs.Screen name="chats" options={{ title: 'Chats' }} />
      <Tabs.Screen name="me" options={{ title: 'Me' }} />
    </Tabs>
  );
}
