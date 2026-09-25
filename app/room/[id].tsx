import { useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { H1, Paragraph, Spinner, Text, YStack } from 'tamagui';
import { MessageComposer } from '../../src/components/MessageComposer';
import { MessageList } from '../../src/components/MessageList';
import { useSession } from '../../src/hooks/useSession';
import { useChatMessages } from '../../src/features/chat/useChatMessages';
import type { ChatMessage } from '../../src/features/chat/types';

export default function RoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useSession();
  const [replyTarget, setReplyTarget] = useState<ChatMessage | null>(null);
  const { messages, loading, sending, error, hasMore, loadOlder, send, reply, remove, react } = useChatMessages({ scope: 'room', id });
  const submit = async (body: string) => {
    if (replyTarget) { await reply(replyTarget.id, body); setReplyTarget(null); }
    else await send(body);
  };
  return <YStack flex={1} backgroundColor="$background">
    <YStack padding="$4" borderBottomWidth={1} borderColor="$borderColor">
      <H1 fontSize="$7">Room</H1>{error ? <Paragraph color="$red10">{error}</Paragraph> : null}
    </YStack>
    {loading ? <YStack flex={1} alignItems="center" justifyContent="center"><Spinner /></YStack> :
      <YStack flex={1}><MessageList messages={messages} currentUserId={session?.user.id} hasMore={hasMore} onLoadOlder={loadOlder} onReply={setReplyTarget} onDelete={m => remove(m.id)} onReact={(m,r) => react(m.id,r)} /></YStack>}
    {replyTarget ? <YStack paddingHorizontal="$3" paddingTop="$2"><Text fontSize="$2" color="$colorPress">Replying to: {replyTarget.body.slice(0, 80)}</Text></YStack> : null}
    <MessageComposer onSend={submit} disabled={sending || loading} />
  </YStack>;
}
