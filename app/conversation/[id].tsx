import { useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { H1, Paragraph, Spinner, Text, YStack } from 'tamagui';
import { MessageComposer } from '../../src/components/MessageComposer';
import { MessageList } from '../../src/components/MessageList';
import { useSession } from '../../src/hooks/useSession';
import { useChatMessages } from '../../src/features/chat/useChatMessages';
import type { ChatMessage } from '../../src/features/chat/types';

export default function ConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useSession();
  const [replyTarget, setReplyTarget] = useState<ChatMessage | null>(null);
  const [editTarget, setEditTarget] = useState<ChatMessage | null>(null);
  const { messages, loading, sending, error, hasMore, loadOlder, send, reply, edit, remove, typingUsers, profiles, onTyping } = useChatMessages({ scope: 'conversation', id });
  const submit = async (body: string) => {
    if (replyTarget) { await reply(replyTarget.id, body); setReplyTarget(null); }
    else if (editTarget) { await edit(editTarget.id, body); setEditTarget(null); }
    else await send(body);
  };
  return <YStack flex={1} bg="$background">
    <YStack p="$4" borderBottomWidth={1} borderColor="$borderColor">
      <H1 fontSize="$7">Chat</H1>{error ? <Paragraph color="$red10">{error}</Paragraph> : null}
    </YStack>
    {loading ? <YStack flex={1} ai="center" jc="center"><Spinner /></YStack> :
      <YStack flex={1}><MessageList messages={messages} currentUserId={session?.user.id} hasMore={hasMore} onLoadOlder={loadOlder} profiles={profiles} onReply={m => { setEditTarget(null); setReplyTarget(m); }} onEdit={m => { setReplyTarget(null); setEditTarget(m); }} onDelete={m => remove(m.id)} /></YStack>}
    {replyTarget ? <YStack px="$3" pt="$2"><Text fontSize="$2" color="$colorPress">Replying to: {replyTarget.body.slice(0, 80)}</Text></YStack> : null}
    <MessageComposer onSend={submit} disabled={sending || loading} editValue={editTarget?.body ?? null} onEditCancel={() => setEditTarget(null)} onTyping={onTyping} />
  </YStack>;
}
