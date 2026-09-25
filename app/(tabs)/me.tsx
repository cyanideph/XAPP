import { useEffect, useState } from 'react';
import { ScrollView } from 'react-native';
import { Button, H1, Paragraph, Spinner, Text, YStack } from 'tamagui';
import { BentoCard } from '../../src/components/BentoCard';
import { listFavorites } from '../../src/lib/backend';
import { supabase } from '../../src/lib/supabase';

export default function MeScreen() {
  const [favorites, setFavorites] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listFavorites(50, 0)
      .then((data) => setFavorites(Array.isArray(data) ? data.length : 0))
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  return (
    <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 64, paddingBottom: 32 }}>
      <YStack gap="$5">
        <YStack gap="$2">
          <Text fontSize="$3" color="$colorPress" fontWeight="800" letterSpacing={1}>ME</Text>
          <H1 fontSize="$10" fontWeight="900">Your profile.</H1>
          <Paragraph color="$colorPress">Identity, favorites, notifications and settings.</Paragraph>
        </YStack>

        <BentoCard title="Profile" description="Your public identity and activity." />
        {loading ? <Spinner /> : <BentoCard title="Favorites" value={String(favorites)} description="People you have saved." />}
        <BentoCard title="Notifications" description="Mentions, follows, comments, reactions and invites." />
        <BentoCard title="Settings" description="Notification and chat preferences." />
        {supabase ? <Button onPress={() => { if (supabase) void supabase.auth.signOut(); }}>Sign out</Button> : null}
      </YStack>
    </ScrollView>
  );
}
