import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Button, H1, Input, Paragraph, Spinner, Text, XStack, YStack } from 'tamagui';
import { BentoCard } from '../../src/components/BentoCard';
import {
  listMyConversations,
  listPublicRooms,
  searchPublicRooms,
  listPendingConversationInvites,
  listPublicChats,
  markNotificationRead,
  respondConversationInvite,
  type ConversationInvite,
  type ConversationListItem,
} from '../../src/lib/backend';

type PublicChat = {
  id: string;
  name: string;
  description?: string | null;
  province_code?: string | null;
  member_count?: number | string | null;
  online_count?: number | string | null;
};

function conversationTitle(conversation: ConversationListItem) {
  if (conversation.title) return conversation.title;
  if (conversation.participant) {
    return conversation.participant.display_name || conversation.participant.username;
  }
  return conversation.kind === 'direct' ? 'Direct conversation' : 'Conversation';
}

function formatUpdatedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const diffMinutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString();
}

function inviteTitle(invite: ConversationInvite) {
  if (invite.conversation_title) return invite.conversation_title;
  if (invite.inviter) return invite.inviter.display_name || invite.inviter.username;
  return 'Conversation invitation';
}

export default function ChatsScreen() {
  const [publicChats, setPublicChats] = useState<PublicChat[]>([]);
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [invites, setInvites] = useState<ConversationInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteBusy, setInviteBusy] = useState<string | null>(null);
  const [roomQuery, setRoomQuery] = useState('');
  const [roomSearching, setRoomSearching] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const [chatRows, conversationRows, inviteRows] = await Promise.all([
        listPublicRooms(20, 0),
        listMyConversations(20),
        listPendingConversationInvites(50),
      ]);
      setPublicChats(Array.isArray(chatRows) ? chatRows as PublicChat[] : []);
      setConversations(conversationRows);
      setInvites(inviteRows);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load Chats.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const searchRooms = useCallback(async () => {
    const query = roomQuery.trim();
    if (!query) { await load(true); return; }
    setRoomSearching(true);
    setError(null);
    try {
      const rows = await searchPublicRooms(query, 20);
      setPublicChats(Array.isArray(rows) ? rows as PublicChat[] : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to search rooms.');
    } finally { setRoomSearching(false); }
  }, [load, roomQuery]);

  const respondToInvite = useCallback(async (invite: ConversationInvite, accept: boolean) => {
    if (inviteBusy) return;
    setInviteBusy(invite.invite_id);
    setError(null);

    try {
      await respondConversationInvite(invite.invite_id, accept);
      await markNotificationRead(invite.notification_id);
      setInvites(current => current.filter(item => item.invite_id !== invite.invite_id));
      if (accept) await load(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to respond to invitation.');
    } finally {
      setInviteBusy(null);
    }
  }, [inviteBusy, load]);

  return (
    <ScrollView
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { void load(true); }} />}
      contentContainerStyle={{ padding: 20, paddingTop: 64, paddingBottom: 32 }}
    >
      <YStack gap="$5">
        <YStack gap="$2">
          <Text fontSize="$3" color="$colorPress" fontWeight="800" letterSpacing={1}>CHATS</Text>
          <H1 fontSize="$10" fontWeight="900">Conversations.</H1>
          <Paragraph color="$colorPress">Rooms and private conversations, in one place.</Paragraph>
        </YStack>

        {error ? (
          <BentoCard title="Unable to load Chats" description={error} onPress={() => { void load(); }} />
        ) : null}

        {loading ? <Spinner /> : (
          <>
            {invites.length ? (
              <YStack gap="$3">
                <Text fontSize="$6" fontWeight="800">Conversation invites</Text>
                {invites.map(invite => (
                  <BentoCard
                    key={invite.invite_id}
                    title={inviteTitle(invite)}
                    description={invite.inviter ? `@${invite.inviter.username} invited you` : 'You have a pending conversation invitation.'}
                  >
                    <XStack gap="$2">
                      <Button
                        size="$3"
                        disabled={inviteBusy === invite.invite_id}
                        onPress={() => { void respondToInvite(invite, true); }}
                      >
                        Accept
                      </Button>
                      <Button
                        size="$3"
                        chromeless
                        disabled={inviteBusy === invite.invite_id}
                        onPress={() => { void respondToInvite(invite, false); }}
                      >
                        Decline
                      </Button>
                    </XStack>
                  </BentoCard>
                ))}
              </YStack>
            ) : null}

            <YStack gap="$3">
              <XStack style={{ alignItems: 'center', justifyContent: 'space-between' }}>
                <Text fontSize="$6" fontWeight="800">Your conversations</Text>
                <Text fontSize="$3" color="$colorPress">{conversations.length} shown</Text>
              </XStack>

              {conversations.length ? conversations.map(conversation => {
                const unread = Boolean(
                  conversation.last_read_at &&
                  new Date(conversation.updated_at).getTime() > new Date(conversation.last_read_at).getTime(),
                );

                return (
                  <BentoCard
                    key={conversation.id}
                    title={unread ? `● ${conversationTitle(conversation)}` : conversationTitle(conversation)}
                    description={
                      conversation.participant
                        ? `@${conversation.participant.username} · ${formatUpdatedAt(conversation.updated_at)}`
                        : `Open conversation · ${formatUpdatedAt(conversation.updated_at)}`
                    }
                    onPress={() => router.push({ pathname: '/conversation/[id]', params: { id: conversation.id } })}
                  />
                );
              }) : (
                <BentoCard
                  title="No conversations yet"
                  description="Open a profile or accept an invitation to start chatting."
                />
              )}
            </YStack>

            <YStack gap="$3">
              <XStack style={{ alignItems: 'center', justifyContent: 'space-between' }}>
                <Text fontSize="$6" fontWeight="800">Public rooms</Text>
                <Text fontSize="$3" color="$colorPress">{publicChats.length} shown</Text>
              </XStack>

              {publicChats.length ? publicChats.map(room => (
                <BentoCard
                  key={room.id}
                  title={room.name}
                  description={
                    room.province_code
                      ? `${room.province_code} · ${room.description ?? 'Open realtime room'}`
                      : (room.description ?? 'Open realtime room')
                  }
                  value={`${room.member_count ?? 0} members · ${room.online_count ?? 0} online`}
                  onPress={() => router.push({ pathname: '/room/[id]', params: { id: room.id } })}
                />
              )) : (
                <BentoCard title="No public rooms available" description="Refresh to check the community again." />
              )}
            </YStack>

            <Button chromeless onPress={() => router.push('/(tabs)/discover')}>Discover more rooms</Button>
          </>
        )}
      </YStack>
    </ScrollView>
  );
}<YStack gap="$2">
                <Input value={roomQuery} onChangeText={setRoomQuery} placeholder="Search public rooms" returnKeyType="search" onSubmitEditing={() => { void searchRooms(); }} />
                <Button size="$3" disabled={roomSearching} onPress={() => { void searchRooms(); }}>{roomSearching ? 'Searching…' : 'Search rooms'}</Button>
              </YStack>

              
