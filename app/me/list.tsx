import { useEffect, useState } from 'react';
import { ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { H1, Separator, Spinner, Text, YStack } from 'tamagui';
import { XButton } from '../../src/components/XButton';
import { XListItem } from '../../src/components/XListItem';
import { listBlockedUsers, listFavorites, listFollowing, listFollowers, listProfileVisitors, toggleBlock, toggleFavorite } from '../../src/lib/backend';
import { supabase } from '../../src/lib/supabase';

export default function MeList() {
  const { kind } = useLocalSearchParams<{ kind: string }>();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const load = async () => {
    setLoading(true);
    try {
      let next: any[] = [];
      if (kind === 'favorites') next = await listFavorites(100, 0);
      else if (kind === 'blocked') next = await listBlockedUsers(100);
      else if (kind === 'visitors') next = await listProfileVisitors(50);
      else {
        const userId = (await supabase?.auth.getUser())?.data.user?.id;
        if (userId) next = kind === 'followers' ? await listFollowers(userId, 100) : await listFollowing(userId, 100);
      }
      setRows(Array.isArray(next) ? next : []);
    } finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, [kind]);
  const title = kind === 'favorites' ? 'Favorites' : kind === 'blocked' ? 'Blocked users' : kind === 'visitors' ? 'Profile visitors' : kind === 'followers' ? 'Followers' : 'Following';
  return (
    <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 64, paddingBottom: 32 }}>
      <YStack gap="$4" maxW={960} self="center" width="100%">
        <YStack gap="$1"><H1 fontSize="$10">{title}.</H1><Text color="$colorPress">Community connections and activity.</Text></YStack>
        {loading ? <Spinner color="$brandBackground" /> : rows.length ? (
          <YStack borderTopWidth={1} borderBottomWidth={1} borderColor="$borderColor">
            {rows.map((row, index) => {
              const username = row.username ?? row.target_username ?? row.user?.username ?? 'user';
              const userId = row.user_id ?? row.target_user_id;
              return (
                <YStack key={row.target_user_id ?? row.user_id ?? row.profile_id ?? index}>
                  <XListItem
                    title={`@${username}`}
                    subTitle={kind === 'favorites' ? 'Saved person' : kind === 'blocked' ? 'Blocked account' : kind === 'visitors' ? 'Recent profile visit' : kind === 'followers' ? 'Follower' : 'Following'}
                    onPress={userId ? () => router.push({ pathname: '/me/view-profile', params: { id: userId } }) : undefined}
                  />
                  {kind === 'favorites' ? <XButton size="$2" chromeless onPress={() => void toggleFavorite(userId).then(load)}>Remove favorite</XButton> : null}
                  {kind === 'blocked' ? <XButton size="$2" chromeless onPress={() => void toggleBlock(row.target_user_id).then(load)}>Unblock</XButton> : null}
                  {index < rows.length - 1 ? <Separator borderColor="$borderColor" /> : null}
                </YStack>
              );
            })}
          </YStack>
        ) : <Text color="$colorPress">Nothing here yet.</Text>}
        <XButton chromeless onPress={() => router.back()}>Back</XButton>
      </YStack>
    </ScrollView>
  );
}