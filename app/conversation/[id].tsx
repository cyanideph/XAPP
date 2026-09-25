import { useLocalSearchParams } from 'expo-router';
import { H1, Paragraph, Spinner, YStack } from 'tamagui';
import { MessageComposer } from '../../src/components/MessageComposer';
import { MessageList } from '../../src/components/MessageList';
import { useSession } from '../../src/hooks/useSession';
import { useChatMessages } from '../../src/features/chat/useChatMessages';

export default function ConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useSession();
  const { messages, loading, sending, error, hasMore, loadOlder, send } = useChatMessages({ scope: 'conversation', id });

  return (
    <YStack flex={1} backgroundColor="$background">
      <YStack padding="$4" borderBottomWidth={1} borderColor="$borderColor">
        <H1 fontSize="$7">Chat</H1>
        {error ? <Paragraph color="$red10">{error}</Paragraph> : null}
      </YStack>
      {loading ? <YStack flex={1} alignItems="center" justifyContent="center"><Spinner /></YStack> : <YStack flex={1}><MessageList messages={messages} currentUserId={session?.user.id} hasMore={hasMore} onLoadOlder={loadOlder} /></YStack>}
      <MessageComposer onSend={send} disabled={sending || loading} />
    </YStack>
  );
}
