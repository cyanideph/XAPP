import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { H1, ListItem, Paragraph, Separator, Spinner, Switch, Text, YGroup, YStack } from 'tamagui';
import { getCurrentProfile, listFavorites, listNotifications } from '../../src/lib/backend';
import { supabase } from '../../src/lib/supabase';
import { useXAppTheme, type ThemeMode } from '../../src/theme/theme';

export default function MeScreen() {
  const { mode, resolvedMode, setMode } = useXAppTheme();
  const [profile, setProfile] = useState<any>(null);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, f, n] = await Promise.all([getCurrentProfile(), listFavorites(50, 0), listNotifications(50)]);
      setProfile(p); setFavorites(Array.isArray(f) ? f : []); setUnread(n.items.filter((x) => !x.read_at).length);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const modes: ThemeMode[] = ['system', 'light', 'dark'];
  const setTheme = (next: ThemeMode) => setMode(next);

  return (
    <ScrollView
      refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void load()} />}
      contentContainerStyle={{ padding: 20, paddingTop: 64, paddingBottom: 40 }}
    >
      <YStack width="100%" maxW={960} self="center" gap="$6">
        <YStack gap="$2">
          <Text fontSize="$3" color="$brandBackground" fontWeight="900" letterSpacing={1}>ME</Text>
          <H1 fontSize="$10" fontWeight="900">Your profile.</H1>
          <Paragraph color="$colorPress" size="$4">
            {profile ? `@${profile.username}${profile.display_name ? ` · ${profile.display_name}` : ''}` : 'Manage your identity and community activity.'}
          </Paragraph>
        </YStack>

        <YStack gap="$2">
          <Text fontSize="$6" fontWeight="800">Appearance</Text>
          <Text fontSize="$3" color="$colorPress">Theme: {mode} · currently {resolvedMode}</Text>
          <YGroup borderWidth={1} borderColor="$borderColor" rounded="$4" overflow="hidden">
            {modes.map((option, index) => (
              <YGroup.Item key={option}>
                <ListItem
                  title={option === 'system' ? 'System default' : option === 'light' ? 'Light mode' : 'Dark mode'}
                  subTitle={option === 'system' ? 'Follow your device' : `Use XAPP in ${option} mode`}
                  iconAfter={<Switch size="$3" checked={mode === option} onCheckedChange={(checked) => { if (checked) setTheme(option); }} />}
                  onPress={() => setTheme(option)}
                />
                {index < modes.length - 1 ? <Separator /> : null}
              </YGroup.Item>
            ))}
          </YGroup>
        </YStack>

        {loading ? <Spinner color="$brandBackground" /> : (
          <>
            <YStack gap="$2">
              <Text fontSize="$6" fontWeight="800">Account</Text>
              <YGroup borderWidth={1} borderColor="$borderColor" rounded="$4" overflow="hidden">
                <YGroup.Item><ListItem title="Profile" subTitle={profile ? `@${profile.username}` : 'Unavailable'} iconAfter={<Text color="$colorPress">›</Text>} onPress={() => router.push('/me/profile')} /></YGroup.Item>
                <Separator />
                <YGroup.Item><ListItem title="Notifications" subTitle={unread ? `${unread} unread` : 'All caught up'} iconAfter={<Text color="$colorPress">›</Text>} onPress={() => router.push('/me/notifications')} /></YGroup.Item>
                <Separator />
                <YGroup.Item><ListItem title="Favorites" subTitle={`${favorites.length} saved people`} iconAfter={<Text color="$colorPress">›</Text>} onPress={() => router.push('/me/list?kind=favorites')} /></YGroup.Item>
                <Separator />
                <YGroup.Item><ListItem title="Followers" subTitle="People following you" iconAfter={<Text color="$colorPress">›</Text>} onPress={() => router.push('/me/list?kind=followers')} /></YGroup.Item>
                <Separator />
                <YGroup.Item><ListItem title="Following" subTitle="People you follow" iconAfter={<Text color="$colorPress">›</Text>} onPress={() => router.push('/me/list?kind=following')} /></YGroup.Item>
              </YGroup>
            </YStack>

            <YStack gap="$2">
              <Text fontSize="$6" fontWeight="800">Community</Text>
              <YGroup borderWidth={1} borderColor="$borderColor" rounded="$4" overflow="hidden">
                <YGroup.Item><ListItem title="Blocked users" subTitle="Manage blocked accounts" iconAfter={<Text color="$colorPress">›</Text>} onPress={() => router.push('/me/list?kind=blocked')} /></YGroup.Item>
                <Separator />
                <YGroup.Item><ListItem title="Profile visitors" subTitle="See recent visitors" iconAfter={<Text color="$colorPress">›</Text>} onPress={() => router.push('/me/list?kind=visitors')} /></YGroup.Item>
              </YGroup>
            </YStack>
          </>
        )}

        <YStack gap="$2">
          <Text fontSize="$6" fontWeight="800">Settings</Text>
          <YGroup borderWidth={1} borderColor="$borderColor" rounded="$4" overflow="hidden">
            <YGroup.Item><ListItem title="App settings" subTitle="Preferences and account settings" iconAfter={<Text color="$colorPress">›</Text>} onPress={() => router.push('/me/settings')} /></YGroup.Item>
            {supabase ? <><Separator /><YGroup.Item><ListItem title="Sign out" subTitle="End this session" color="$red10" onPress={() => { const client = supabase; if (client) void client.auth.signOut(); }} /></YGroup.Item></> : null}
          </YGroup>
        </YStack>
      </YStack>
    </ScrollView>
  );
}