import { useEffect, useState } from 'react';
import { RefreshControl, ScrollView } from 'react-native';
import { H1, Paragraph, Spinner, Text, XStack, YStack } from 'tamagui';
import { BentoCard } from '../../src/components/BentoCard';
import { listOnlineUsers, listPublicChats, listPublicRooms } from '../../src/lib/backend';

export default function DiscoverScreen() {
  const [counts, setCounts] = useState({ users: 0, rooms: 0, chats: 0 });
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [users, rooms, chats] = await Promise.all([
        listOnlineUsers(50, 0),
        listPublicRooms(),
        listPublicChats(50, 0),
      ]);
      setCounts({
        users: Array.isArray(users) ? users.length : 0,
        rooms: Array.isArray(rooms) ? rooms.length : 0,
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
          <Paragraph color="$colorPress">Explore the public side of X-App.</Paragraph>
        </YStack>

        {loading ? <Spinner /> : (
          <>
            <XStack gap="$3">
              <BentoCard title="People" flex={1} value={String(counts.users)} description="recently active" />
              <BentoCard title="Rooms" flex={1} value={String(counts.rooms)} description="public" />
            </XStack>
            <BentoCard title="Public chats" value={String(counts.chats)} description="Discover active public conversations." />
          </>
        )}

        <BentoCard title="Featured people" description="Featured profiles will use the backend featured-profiles system." />
        <BentoCard title="Community content" description="Search posts, wikis and polls from the content system." />
      </YStack>
    </ScrollView>
  );
}
