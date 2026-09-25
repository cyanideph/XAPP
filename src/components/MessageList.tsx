import { ScrollView } from 'react-native';
import { Button, Paragraph, Text, YStack } from 'tamagui';
import type { ChatMessage } from '../features/chat/types';

type Props = {
  messages: ChatMessage[];
  currentUserId?: string;
  hasMore?: boolean;
  loadingOlder?: boolean;
  onLoadOlder?: () => Promise<void>;
};

export function MessageList({ messages, currentUserId, hasMore, loadingOlder, onLoadOlder }: Props) {
  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}>
      {hasMore ? <Button size="$3" onPress={onLoadOlder} disabled={loadingOlder}>{loadingOlder ? 'Loading…' : 'Load older messages'}</Button> : null}
      <YStack gap="$3">
        {messages.map((message) => {
          const own = message.sender_id === currentUserId;
          return (
            <YStack key={message.id} alignSelf={own ? 'flex-end' : 'flex-start'} maxWidth="88%" backgroundColor={own ? '$color' : '$background'} borderWidth={1} borderColor="$borderColor" borderRadius="$6" padding="$3">
              <Text fontSize="$2" color={own ? '$background' : '$colorPress'}>{own ? 'You' : 'Member'}</Text>
              <Paragraph color={own ? '$background' : '$color'}>{message.body}</Paragraph>
              {message.edited_at ? <Text fontSize="$2" color={own ? '$background' : '$colorPress'}>edited</Text> : null}
            </YStack>
          );
        })}
      </YStack>
    </ScrollView>
  );
}
