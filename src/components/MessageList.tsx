import { ScrollView } from 'react-native';
import { Paragraph, YStack } from 'tamagui';
import type { ChatMessage } from '../features/chat/types';

export function MessageList({ messages }: { messages: ChatMessage[] }) {
  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}>
      <YStack gap="$3">
        {messages.map((message) => (
          <YStack key={message.id} alignSelf="flex-start" maxWidth="88%" backgroundColor="$background" borderWidth={1} borderColor="$borderColor" borderRadius="$6" padding="$3">
            <Paragraph>{message.body}</Paragraph>
          </YStack>
        ))}
      </YStack>
    </ScrollView>
  );
}
