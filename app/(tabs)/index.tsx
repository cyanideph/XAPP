import { useEffect, useState } from 'react';
import { RefreshControl, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Button, H1, Paragraph, Spinner, Text, XStack, YStack } from 'tamagui';
import { BentoCard } from '../../src/components/BentoCard';
import { BentoStat } from '../../src/components/BentoStat';
import { listOnlineUsers, listPublicRooms } from '../../src/lib/backend';

type Room = { id: string; name: string; description?: string | null; province_code?: string | null };

export default function HomeScreen() {
  const [online, setOnline] = useState(0);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [onlineData, roomData] = await Promise.all([
        listOnlineUsers(200, 0),
        listPublicRooms(6, 0),
      ]);
      setOnline(Array.isArray(onlineData) ? onlineData.length : 0);
      setRooms(Array.isArray(roomData) ? roomData as Room[] : []);
    } catch {
      setOnline(0);
      setRooms([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  return (
    <ScrollView
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
      contentContainerStyle={{ padding: 20, paddingTop: 64, paddingBottom: 32 }}
    >
      <YStack gap="$5">
        <YStack gap="$2">
          <Text fontSize="$3" color="$colorPress" fontWeight="800" letterSpacing={1}>X-APP</Text>
          <H1 fontSize="$10" fontWeight="900">Your space.</H1>
          <Paragraph color="$colorPress">People, rooms and conversations at a glance.</Paragraph>
        </YStack>

        <XStack gap="$3">
          <BentoCard title="Online" flex={1}>
            {loading ? <Spinner /> : <BentoStat label="recently active" value={online} />}
          </BentoCard>
          <BentoCard title="Rooms" flex={1}>
            {loading ? <Spinner /> : <BentoStat label="public rooms" value={rooms.length} />}
          </BentoCard>
        </XStack>

        <XStack gap="$3">
          <BentoCard title="Discover" description="Find people and public rooms." onPress={() => router.push('/(tabs)/discover')} />
          <BentoCard title="Chats" description="Open conversations and realtime rooms." onPress={() => router.push('/(tabs)/chats')} />
        </XStack>

        <YStack gap="$3">
          <XStack style={{ alignItems: "center", justifyContent: "space-between" }}>
            <Text fontSize="$6" fontWeight="800">Public rooms</Text>
            <Button size="$2" chromeless onPress={() => router.push('/(tabs)/discover')}>See all</Button>
          </XStack>

          {loading ? <Spinner /> : rooms.length ? rooms.map(room => (
            <BentoCard
              key={room.id}
              title={room.name}
              description={room.province_code ? `${room.province_code} · ${room.description ?? 'Open realtime room'}` : (room.description ?? 'Open realtime room')}
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
