import { useEffect, useState } from 'react';
import { RefreshControl, ScrollView } from 'react-native';
import { H1, Paragraph, Spinner, Text, YStack } from 'tamagui';
import { BentoCard } from '../../src/components/BentoCard';
import { listPublicChats } from '../../src/lib/backend';

export default function ChatsScreen() {
  const [publicChats, setPublicChats] = useState(0);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const data = await listPublicChats(50, 0);
      setPublicChats(Array.isArray(data) ? data.length : 0);
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
          <Text fontSize="$3" color="$colorPress" fontWeight="800" letterSpacing={1}>CHATS</Text>
          <H1 fontSize="$10" fontWeight="900">Conversations.</H1>
          <Paragraph color="$colorPress">Rooms and private conversations, in one place.</Paragraph>
        </YStack>
        {loading ? <Spinner /> : <BentoCard title="Public chat discovery" value={String(publicChats)} description="Public chats available to discover." />}
        <BentoCard title="Your rooms" description="Joined rooms will appear here with unread state and presence." />
        <BentoCard title="Direct messages" description="Private and group conversations with realtime messaging." />
      </YStack>
    </ScrollView>
  );
}
