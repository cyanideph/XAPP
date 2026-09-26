import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Button, H1, Paragraph, Spinner, Text, YStack } from 'tamagui';
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

  return <ScrollView refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void load()} />} contentContainerStyle={{ padding: 20, paddingTop: 64, paddingBottom: 32 }}>
    <YStack gap="$5">
      <YStack gap="$2">
        <Text fontSize="$3" color="$colorPress" fontWeight="800">ME</Text>
        <H1>Your profile.</H1>
        <Paragraph color="$colorPress">{profile ? `@${profile.username}${profile.display_name ? ` · ${profile.display_name}` : ''}` : 'Manage your identity and community activity.'}</Paragraph>
      </YStack>

      <BentoCard
        title="Appearance"
        description={`Theme: ${mode} · currently ${resolvedMode}`}
      >
        <YStack gap="$2">
          <Text fontSize="$3" color="$colorPress">The interface follows the same soft visual system in every screen.</Text>
          <YStack gap="$2">
            {modes.map(option => (
              <Button
                key={option}
                size="$3"
                theme={mode === option ? 'accent' : undefined}
                onPress={() => setMode(option)}
              >
                {option === mode ? `✓ ${option}` : option}
              </Button>
            ))}
          </YStack>
        </YStack>
      </BentoCard>

      {loading ? <Spinner /> : <>
        <BentoCard title="Profile" value={profile ? `@${profile.username}` : 'Unavailable'} description={profile?.status_text || profile?.bio || 'Edit your public profile.'} onPress={() => router.push('/me/profile')} />
        <BentoCard title="Notifications" value={String(unread)} description="Unread notifications" onPress={() => router.push('/me/notifications')} />
        <BentoCard title="Favorites" value={String(favorites.length)} description="People you have saved" onPress={() => router.push('/me/list?kind=favorites')} />
        <BentoCard title="Followers" description="People following you" onPress={() => router.push('/me/list?kind=followers')} />
        <BentoCard title="Following" description="People you follow" onPress={() => router.push('/me/list?kind=following')} />
        <BentoCard title="Blocked users" description="Manage blocked accounts" onPress={() => router.push('/me/list?kind=blocked')} />
        <BentoCard title="Profile visitors" description="See recent visitors" onPress={() => router.push('/me/list?kind=visitors')} />
      </>}

      <Button onPress={() => router.push('/me/settings')}>Settings</Button>
      {supabase ? <Button chromeless onPress={() => { const client = supabase; if (!client) return; void client.auth.signOut(); }}>Sign out</Button> : null}
    </YStack>
  </ScrollView>;
}
