import { useEffect, useState } from 'react';
import { RefreshControl, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Button, Card, H1, Paragraph, Spinner, Text, XStack, YStack } from 'tamagui';
import { BentoCard } from '../../src/components/BentoCard';
import { listOnlineUsers, listPublicChats, listPublicRooms } from '../../src/lib/backend';

type Room = { id: string; name: string; description?: string | null; province_code?: string | null; kind?: string };

export default function DiscoverScreen() {
  const [counts, setCounts] = useState({ users: 0, rooms: 0, chats: 0 });
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [users, roomRows, chats] = await Promise.all([
        listOnlineUsers(50, 0),
        listPublicRooms(20, 0),
        listPublicChats(50, 0),
      ]);
      const nextRooms = Array.isArray(roomRows) ? roomRows as Room[] : [];
      setRooms(nextRooms);
      setCounts({
        users: Array.isArray(users) ? users.length : 0,
        rooms: nextRooms.length,
        chats: Array.isArray(chats) ? chats.length : 0,
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load().catch(() => setLoading(false)); }, []);

  return (
    <ScrollView
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
      contentContainerStyle={{ padding: 20, paddingTop: 64, paddingBottom: 32 }}
    >
      <YStack gap="$5">
        <YStack gap="$2">
          <Text fontSize="$3" color="$colorPress" fontWeight="800" letterSpacing={1}>DISCOVER</Text>
          <H1 fontSize="$10" fontWeight="900">Find your people.</H1>
          <Paragraph color="$colorPress">Explore public rooms and active community spaces.</Paragraph>
        </YStack>

        {loading ? <Spinner /> : (
          <>
            <XStack gap="$3">
              <BentoCard title="People" flex={1} value={String(counts.users)} description="recently active" />
              <BentoCard title="Rooms" flex={1} value={String(counts.rooms)} description="public" />
            </XStack>
            <BentoCard title="Public chats" value={String(counts.chats)} description="Active public conversations." />

            <YStack gap="$3">
              <XStack ai="center" jc="space-between">
                <Text fontSize="$6" fontWeight="800">Public rooms</Text>
                <Text fontSize="$3" color="$colorPress">{rooms.length} loaded</Text>
              </XStack>
              {rooms.map(room => (
                <Card key={room.id} p="$4" borderWidth={1} borderColor="$borderColor" borderRadius="$6" bg="$background">
                  <YStack gap="$2">
                    <Text fontSize="$5" fontWeight="800">{room.name}</Text>
                    {room.province_code ? <Text fontSize="$3" color="$colorPress">{room.province_code}</Text> : null}
                    {room.description ? <Paragraph color="$colorPress">{room.description}</Paragraph> : null}
                    <Button als="flex-start" size="$3" onPress={() => router.push({ pathname: '/room/[id]', params: { id: room.id } })}>Open room</Button>
                  </YStack>
                </Card>
              ))}
            </YStack>
          </>
        )}
      </YStack>
    </ScrollView>
  );
}
