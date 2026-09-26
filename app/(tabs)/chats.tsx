import { useEffect, useState } from 'react';
import { RefreshControl, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Button, H1, Paragraph, Spinner, Text, YStack } from 'tamagui';
import { BentoCard } from '../../src/components/BentoCard';
import { listPublicChats, listPublicRooms } from '../../src/lib/backend';

type Room = { id: string; name: string; description?: string | null };

export default function ChatsScreen() {
  const [publicChats, setPublicChats] = useState(0);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [chatRows, roomRows] = await Promise.all([
        listPublicChats(50, 0),
        listPublicRooms(10, 0),
      ]);
      setPublicChats(Array.isArray(chatRows) ? chatRows.length : 0);
      setRooms(Array.isArray(roomRows) ? roomRows as Room[] : []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load().catch(() => setLoading(false)); }, []);

  return (
    <ScrollView
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
      contentContainerStyle={{ padding: 20, paddingTop: 64, paddingBottom: 32 }}
    >
      <YStack gap="$5">
        <YStack gap="$2">
          <Text fontSize="$3" color="$colorPress" fontWeight="800" letterSpacing={1}>CHATS</Text>
          <H1 fontSize="$10" fontWeight="900">Conversations.</H1>
          <Paragraph color="$colorPress">Rooms and private conversations, in one place.</Paragraph>
        </YStack>

        {loading ? <Spinner /> : (
          <>
            <BentoCard
              title="Public chat discovery"
              value={String(publicChats)}
              description="Public conversations available from the backend."
            />

            <YStack gap="$3">
              <Text fontSize="$6" fontWeight="800">Public rooms</Text>
              {rooms.length ? rooms.map(room => (
                <BentoCard
                  key={room.id}
                  title={room.name}
                  description={room.description ?? 'Open realtime room'}
                  onPress={() => router.push({ pathname: '/room/[id]', params: { id: room.id } })}
                />
              )) : (
                <BentoCard title="No rooms available" description="Refresh to check again." />
              )}
            </YStack>

            <BentoCard
              title="Direct messages"
              description="Conversation routing is ready; the next frontend pass can surface the user's conversation list without creating another backend."
            />

            <Button chromeless onPress={() => router.push('/(tabs)/discover')}>Discover more rooms</Button>
          </>
        )}
      </YStack>
    </ScrollView>
  );
}
