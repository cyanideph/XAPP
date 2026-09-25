import { useLocalSearchParams } from 'expo-router';
import { H1, Spinner, YStack } from 'tamagui';
import { MessageComposer } from '../../src/components/MessageComposer';
import { MessageList } from '../../src/components/MessageList';
import { useChatMessages } from '../../src/features/chat/useChatMessages';

export default function RoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { messages, loading, sending, send } = useChatMessages({ scope: 'room', id });
  return (
    <YStack flex={1} backgroundColor="$background">
      <YStack padding="$4" borderBottomWidth={1} borderColor="$borderColor"><H1 fontSize="$7">Room</H1></YStack>
      {loading ? <YStack flex={1} alignItems="center" justifyContent="center"><Spinner /></YStack> : <YStack flex={1}><MessageList messages={messages} /></YStack>}
      <MessageComposer onSend={send} disabled={sending || loading} />
    </YStack>
  );
}