import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Button, H1, Paragraph, Spinner, Text, XStack, YStack } from 'tamagui';
import { BentoCard } from '../../src/components/BentoCard';
import { BentoStat } from '../../src/components/BentoStat';
import { listOnlineUsers, listPublicChats } from '../../src/lib/backend';

type OnlineUser = { user_id: string; username: string; display_name?: string | null; status_text?: string | null };
type PublicChat = {
  id: string;
  name: string;
  description?: string | null;
  province_code?: string | null;
  member_count?: number | string | null;
  online_count?: number | string | null;
};

export default function HomeScreen() {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [rooms, setRooms] = useState<PublicChat[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const [onlineData, roomData] = await Promise.all([
        listOnlineUsers(6, 0),
        listPublicChats(6, 0),
      ]);

      setOnlineUsers(Array.isArray(onlineData) ? onlineData as OnlineUser[] : []);
      setRooms(Array.isArray(roomData) ? roomData as PublicChat[] : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load Home data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  return (
    <ScrollView
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { void load(true); }} />}
      contentContainerStyle={{ padding: 20, paddingTop: 64, paddingBottom: 32 }}
    >
      <YStack gap="$5">
        <YStack gap="$2">
          <Text fontSize="$3" color="$colorPress" fontWeight="800" letterSpacing={1}>X-APP</Text>
          <H1 fontSize="$10" fontWeight="900">Your space.</H1>
          <Paragraph color="$colorPress">People, rooms and conversations at a glance.</Paragraph>
        </YStack>

        {error ? (
          <BentoCard
            title="Unable to load Home"
            description={error}
            onPress={() => { void load(); }}
          />
        ) : null}

        <XStack gap="$3">
          <BentoCard title="People" flex={1}>
            {loading ? <Spinner /> : <BentoStat label="recently active" value={onlineUsers.length} />}
          </BentoCard>
          <BentoCard title="Rooms" flex={1}>
            {loading ? <Spinner /> : <BentoStat label="public rooms shown" value={rooms.length} />}
          </BentoCard>
        </XStack>

        <XStack gap="$3">
          <BentoCard title="Discover" description="Find people and public rooms." onPress={() => router.push('/(tabs)/discover')} />
          <BentoCard title="Chats" description="Open conversations and realtime rooms." onPress={() => router.push('/(tabs)/chats')} />
        </XStack>

        <YStack gap="$3">
          <XStack style={{ alignItems: 'center', justifyContent: 'space-between' }}>
            <Text fontSize="$6" fontWeight="800">Recently active</Text>
            <Button size="$2" chromeless onPress={() => router.push('/(tabs)/discover')}>See all</Button>
          </XStack>

          {loading ? <Spinner /> : onlineUsers.length ? onlineUsers.map(user => (
            <BentoCard
              key={user.user_id}
              title={user.display_name || user.username}
              description={user.status_text ? `@${user.username} · ${user.status_text}` : `@${user.username}`}
            />
          )) : (
            <BentoCard title="No one else is recently active" description="Refresh to check the community again." />
          )}
        </YStack>

        <YStack gap="$3">
          <XStack style={{ alignItems: 'center', justifyContent: 'space-between' }}>
            <Text fontSize="$6" fontWeight="800">Public rooms</Text>
            <Button size="$2" chromeless onPress={() => router.push('/(tabs)/discover')}>See all</Button>
          </XStack>

          {loading ? <Spinner /> : rooms.length ? rooms.map(room => (
            <BentoCard
              key={room.id}
              title={room.name}
              description={
                room.province_code
                  ? `${room.province_code} · ${room.description ?? 'Open realtime room'}`
                  : (room.description ?? 'Open realtime room')
              }
              value={
                room.member_count != null || room.online_count != null
                  ? `${room.member_count ?? 0} members · ${room.online_count ?? 0} online`
                  : undefined
              }
              onPress={() => router.push({ pathname: '/room/[id]', params: { id: room.id } })}
            />
          )) : (
            <BentoCard title="No public rooms yet" description="Refresh to check the community again." />
          )}
        </YStack>
      </YStack>
    </ScrollView>
  );
}
