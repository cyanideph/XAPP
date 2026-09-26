import { useEffect, useState } from 'react';
import { ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, H1, Spinner, Text, YStack } from 'tamagui';
import { supabase } from '../../src/lib/supabase';
import { listBlockedUsers, listFavorites, listFollowing, listFollowers, listProfileVisitors, toggleBlock, toggleFavorite } from '../../src/lib/backend';

export default function MeList() {
  const { kind } = useLocalSearchParams<{ kind: string }>();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      let data: any[] = [];
      if (kind === 'favorites') data = await listFavorites(100, 0);
      else if (kind === 'blocked') data = await listBlockedUsers(100);
      else if (kind === 'visitors') data = await listProfileVisitors(50);
      else {
        const user = await supabase?.auth.getUser();
        const id = user?.data.user?.id;
        if (id) data = kind === 'followers' ? await listFollowers(id, 100) : await listFollowing(id, 100);
      }
      setRows(Array.isArray(data) ? data : []);
    } finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, [kind]);

  const profileId = (row: any) => {
    if (kind === 'favorites') return row.user_id;
    if (kind === 'visitors') return row.visitor_id;
    if (kind === 'following') return row.target_user_id;
    if (kind === 'followers') return row.user_id;
    return row.target_user_id;
  };

  const title = kind === 'favorites' ? 'Favorites' : kind === 'blocked' ? 'Blocked users' : kind === 'visitors' ? 'Profile visitors' : kind === 'followers' ? 'Followers' : 'Following';

  return <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 64, paddingBottom: 32 }}>
    <YStack gap="$3">
      <H1>{title}.</H1>
      {loading ? <Spinner /> : rows.length ? rows.map((row, i) => {
        const id = profileId(row);
        return <YStack key={id || i} p="$3" borderWidth={1} borderColor="$borderColor" gap="$2">
          <Button chromeless onPress={() => id ? router.push({ pathname: '/me/view-profile', params: { id } }) : undefined}>
            @{row.username ?? row.target_username ?? row.user?.username ?? row.profile?.username ?? 'user'}
          </Button>
          {kind === 'favorites' ? <Button size="$2" onPress={() => void toggleFavorite(row.user_id).then(load)}>Remove favorite</Button> : null}
          {kind === 'blocked' ? <Button size="$2" onPress={() => void toggleBlock(row.target_user_id).then(load)}>Unblock</Button> : null}
        </YStack>;
      }) : <Text>Nothing here yet.</Text>}
      <Button chromeless onPress={() => router.back()}>Back</Button>
    </YStack>
  </ScrollView>;
}