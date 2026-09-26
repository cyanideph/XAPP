import { useEffect, useState } from 'react';
import { ScrollView } from 'react-native';
import { Button, H1, Paragraph, Spinner, Text, YStack } from 'tamagui';
import { BentoCard } from '../../src/components/BentoCard';
import { getCurrentProfile, listFavorites, listNotifications } from '../../src/lib/backend';
import { supabase } from '../../src/lib/supabase';

type Profile = { username: string; display_name?: string | null };

export default function MeScreen() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [favorites, setFavorites] = useState(0);
  const [notifications, setNotifications] = useState(0);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [currentProfile, favoriteRows, notificationRows] = await Promise.all([
        getCurrentProfile(),
        listFavorites(50, 0),
        listNotifications(50, 0),
      ]);
      setProfile(currentProfile as Profile | null);
      setFavorites(Array.isArray(favoriteRows) ? favoriteRows.length : 0);
      setNotifications(Array.isArray(notificationRows) ? notificationRows.length : 0);
    } catch {
      setProfile(null);
      setFavorites(0);
      setNotifications(0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  return (
    <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 64, paddingBottom: 32 }}>
      <YStack gap="$5">
        <YStack gap="$2">
          <Text fontSize="$3" color="$colorPress" fontWeight="800" letterSpacing={1}>ME</Text>
          <H1 fontSize="$10" fontWeight="900">Your profile.</H1>
          <Paragraph color="$colorPress">
            {profile ? `@${profile.username}${profile.display_name ? ` · ${profile.display_name}` : ''}` : 'Your public identity, activity and settings.'}
          </Paragraph>
        </YStack>

        {loading ? <Spinner /> : (
          <>
            <BentoCard title="Profile" value={profile?.username ? `@${profile.username}` : 'Not available'} description="Your public identity and activity." />
            <BentoCard title="Favorites" value={String(favorites)} description="People you have saved." />
            <BentoCard title="Notifications" value={String(notifications)} description="Your latest notification records." />
          </>
        )}

        <BentoCard title="Settings" description="Notification and chat preferences." />
        {supabase ? <Button onPress={() => { void supabase.auth.signOut(); }}>Sign out</Button> : null}
      </YStack>
    </ScrollView>
  );
}
