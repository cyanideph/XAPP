import { useState, useEffect } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { H1, Paragraph, Spinner, Text, YStack } from 'tamagui';
import { MessageComposer } from '../../src/components/MessageComposer';
import { listOnlineRoomMembers } from '../../src/features/chat/backend';
import { MessageList } from '../../src/components/MessageList';
import { useSession } from '../../src/hooks/useSession';
import { useChatMessages } from '../../src/features/chat/useChatMessages';
import type { ChatMessage } from '../../src/features/chat/types';

export default function RoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useSession();
  const [replyTarget, setReplyTarget] = useState<ChatMessage | null>(null);
  const [editTarget, setEditTarget] = useState<ChatMessage | null>(null);
  const [onlineMembers, setOnlineMembers] = useState<Array<{ user_id: string; nickname: string | null; is_online: boolean }>>([]);
  const { messages, loading, sending, error, hasMore, loadOlder, send, reply, edit, remove, react, profiles, onTyping } = useChatMessages({ scope: 'room', id });
  useEffect(() => { let active = true; const refresh = async () => { try { const rows = await listOnlineRoomMembers(id, 20, 0); if (active) setOnlineMembers(Array.isArray(rows) ? rows : []); } catch {} }; refresh(); const timer = setInterval(refresh, 30000); return () => { active = false; clearInterval(timer); }; }, [id]);
  const submit = async (body: string) => {
    if (replyTarget) { await reply(replyTarget.id, body); setReplyTarget(null); }
    else if (editTarget) { await edit(editTarget.id, body); setEditTarget(null); }
    else await send(body);
  };
  return <YStack flex={1} backgroundColor="$background">
    <YStack p="$4" borderBottomWidth={1} borderColor="$borderColor">
      <H1 fontSize="$7">Room</H1><Text fontSize="$2" color="$colorPress">{onlineMembers.length} recently active</Text>{error ? <Paragraph color="$red10">{error}</Paragraph> : null}
    </YStack>
    {loading ? <YStack flex={1} alignItems="center" justifyContent="center"><Spinner /></YStack> :
      <YStack flex={1}><MessageList messages={messages} currentUserId={session?.user.id} hasMore={hasMore} onLoadOlder={loadOlder} profiles={profiles} onReply={m => { setEditTarget(null); setReplyTarget(m); }} onEdit={m => { setReplyTarget(null); setEditTarget(m); }} onDelete={m => remove(m.id)} onReact={(m,r) => react(m.id,r)} /></YStack>}
    {replyTarget ? <YStack px="$3" pt="$2"><Text fontSize="$2" color="$colorPress">Replying to: {replyTarget.body.slice(0, 80)}</Text></YStack> : null}
    <MessageComposer onSend={submit} disabled={sending || loading} editValue={editTarget?.body ?? null} onEditCancel={() => setEditTarget(null)} onTyping={onTyping} />
  </YStack>;
}
