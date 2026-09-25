import { useEffect, useState } from 'react';
import { RefreshControl, ScrollView } from 'react-native';
import { H1, Paragraph, Spinner, Text, XStack, YStack } from 'tamagui';
import { BentoCard } from '../../src/components/BentoCard';
import { BentoStat } from '../../src/components/BentoStat';
import { listOnlineUsers, listPublicRooms } from '../../src/lib/backend';

export default function HomeScreen() {
  const [online, setOnline] = useState(0);
  const [rooms, setRooms] = useState(0);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [onlineData, roomData] = await Promise.all([
        listOnlineUsers(200, 0),
        listPublicRooms(),
      ]);
      setOnline(Array.isArray(onlineData) ? onlineData.length : 0);
      setRooms(Array.isArray(roomData) ? roomData.length : 0);
    } catch {
      // The Bento shell remains usable when the backend is unavailable.
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

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
          <BentoCard title="Public rooms" flex={1}>
            {loading ? <Spinner /> : <BentoStat label="available" value={rooms} />}
          </BentoCard>
        </XStack>

        <BentoCard title="Active community" value="Explore rooms" description="Open a room to start a realtime conversation." />

        <XStack gap="$3">
          <BentoCard title="Discover" description="Find people and public rooms." />
          <BentoCard title="Favorites" description="Your saved people and communities." />
        </XStack>

        <BentoCard title="Community" description="Posts, wikis, polls and activity will appear here." />
      </YStack>
    </ScrollView>
  );
}
