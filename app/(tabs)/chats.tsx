import { useEffect, useState } from 'react';
import { RefreshControl, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Button, H1, Paragraph, Spinner, Text, YStack } from 'tamagui';
import { BentoCard } from '../../src/components/BentoCard';
import { listMyConversations, listPublicChats, listPublicRooms } from '../../src/lib/backend';
import type { ConversationListItem } from '../../src/lib/backend';

type Room = { id: string; name: string; description?: string | null };

function conversationTitle(conversation: ConversationListItem) {
  if (conversation.title) return conversation.title;
  if (conversation.participant) {
    return conversation.participant.display_name || conversation.participant.username;
  }
  return conversation.kind === 'direct' ? 'Direct conversation' : 'Conversation';
}

export default function ChatsScreen() {
  const [publicChats, setPublicChats] = useState(0);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [chatRows, roomRows, conversationRows] = await Promise.all([
        listPublicChats(50, 0),
        listPublicRooms(10, 0),
        listMyConversations(20),
      ]);
      setPublicChats(Array.isArray(chatRows) ? chatRows.length : 0);
      setRooms(Array.isArray(roomRows) ? roomRows as Room[] : []);
      setConversations(conversationRows);
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
            <YStack gap="$3">
              <Text fontSize="$6" fontWeight="800">Your conversations</Text>
              {conversations.length ? conversations.map(conversation => (
                <BentoCard
                  key={conversation.id}
                  title={conversationTitle(conversation)}
                  description={conversation.participant ? '@' + conversation.participant.username : 'Open conversation'}
                  onPress={() => router.push({ pathname: '/conversation/[id]', params: { id: conversation.id } })}
                />
              )) : (
                <BentoCard title="No direct conversations yet" description="Start a conversation from a profile when messaging is available." />
              )}
            </YStack>

            <BentoCard title="Public chat discovery" value={String(publicChats)} description="Public conversations available from the backend." />

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

            <Button chromeless onPress={() => router.push('/(tabs)/discover')}>Discover more rooms</Button>
          </>
        )}
      </YStack>
    </ScrollView>
  );
}
