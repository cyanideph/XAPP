import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { H1, Paragraph, Separator, Spinner, Text, XStack, YStack } from 'tamagui';
import { XButton } from '../../src/components/XButton';
import { BentoCard } from '../../src/components/BentoCard';
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

        <BentoCard title="Appearance" description={`Theme: ${mode} · currently ${resolvedMode}`}>
          <YStack gap="$3">
            <Text fontSize="$3" color="$colorPress">Choose how XAPP follows your device and personal preference.</Text>
            <XStack gap="$2" flexWrap="wrap">
              {modes.map(option => (
                <XButton
                  key={option}
                  size="$3"
                  chromeless={mode !== option}
                  theme={mode === option ? 'accent' : undefined}
                  onPress={() => setMode(option)}
                >
                  {mode === option ? `✓ ${option}` : option}
                </XButton>
              ))}
            </XStack>
          </YStack>
        </BentoCard>

        {loading ? <Spinner color="$brandBackground" /> : (
          <>
            <YStack gap="$3">
              <YStack gap="$1">
                <Text fontSize="$6" fontWeight="800">Account</Text>
                <Text fontSize="$3" color="$colorPress">Your identity and community activity.</Text>
              </YStack>
              <BentoCard title="Profile" value={profile ? `@${profile.username}` : 'Unavailable'} description={profile?.status_text || profile?.bio || 'Edit your public profile.'} onPress={() => router.push('/me/profile')} />
              <BentoCard title="Notifications" value={String(unread)} description="Unread notifications" onPress={() => router.push('/me/notifications')} />
              <XStack gap="$3" flexWrap="wrap">
                <BentoCard flex={1} minW={220} title="Favorites" value={String(favorites.length)} description="People you saved" onPress={() => router.push('/me/list?kind=favorites')} />
                <BentoCard flex={1} minW={220} title="Followers" description="People following you" onPress={() => router.push('/me/list?kind=followers')} />
                <BentoCard flex={1} minW={220} title="Following" description="People you follow" onPress={() => router.push('/me/list?kind=following')} />
              </XStack>
            </YStack>

            <Separator borderColor="$borderColor" />

            <YStack gap="$3">
              <YStack gap="$1">
                <Text fontSize="$6" fontWeight="800">Community controls</Text>
                <Text fontSize="$3" color="$colorPress">Manage account visibility and activity.</Text>
              </YStack>
              <XStack gap="$3" flexWrap="wrap">
                <BentoCard flex={1} minW={220} title="Blocked users" description="Manage blocked accounts" onPress={() => router.push('/me/list?kind=blocked')} />
                <BentoCard flex={1} minW={220} title="Profile visitors" description="See recent visitors" onPress={() => router.push('/me/list?kind=visitors')} />
              </XStack>
            </YStack>
          </>
        )}

        <Separator borderColor="$borderColor" />

        <YStack gap="$3">
          <Text fontSize="$6" fontWeight="800">Settings</Text>
          <XButton onPress={() => router.push('/me/settings')}>Open settings</XButton>
          {supabase ? <XButton chromeless onPress={() => { const client = supabase; if (!client) return; void client.auth.signOut(); }}>Sign out</XButton> : null}
        </YStack>
      </YStack>
    </ScrollView>
  );
}