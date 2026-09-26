import { ScrollView } from 'react-native';
import { Button, Paragraph, Text, XStack, YStack } from 'tamagui';
import type { ChatMessage, ChatProfile } from '../features/chat/types';

type Props = {
  messages: ChatMessage[];
  currentUserId?: string;
  hasMore?: boolean;
  loadingOlder?: boolean;
  onLoadOlder?: () => Promise<void>;
  onReply?: (message: ChatMessage) => void;
  onDelete?: (message: ChatMessage) => Promise<void>;
  onEdit?: (message: ChatMessage) => void;
  onReact?: (message: ChatMessage, reaction: string) => Promise<void>;
  profiles?: Record<string, ChatProfile>;
};

export function MessageList({ messages, currentUserId, hasMore, loadingOlder, onLoadOlder, onReply, onDelete, onReact, onEdit, profiles = {} }: Props) {
  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}>
      {hasMore ? <Button size="$3" onPress={onLoadOlder} disabled={loadingOlder}>{loadingOlder ? 'Loading…' : 'Load older messages'}</Button> : null}
      <YStack gap="$3">
        {messages.map((message) => {
          const own = message.sender_id === currentUserId;
          return (
            <YStack
              key={message.id}
              style={{
                alignSelf: own ? "flex-end" : "flex-start",
                maxWidth: "88%",
                borderRadius: 24,
              }}
              bg={own ? '$color' : '$background'}
              borderWidth={1}
              borderColor="$borderColor"
              p="$3"
            >
              <Text fontSize="$2" color={own ? '$background' : '$colorPress'}>{own ? 'You' : (profiles[message.sender_id]?.display_name || profiles[message.sender_id]?.username || 'Member')}</Text>
              {message.reply_to_id ? <Text fontSize="$2" color={own ? '$background' : '$colorPress'}>Replying to a message</Text> : null}
              <Paragraph color={own ? '$background' : '$color'}>{message.body}</Paragraph>
              {message.edited_at ? <Text fontSize="$2" color={own ? '$background' : '$colorPress'}>edited</Text> : null}
              <XStack gap="$2" mt="$2" flexWrap="wrap">
                {onReply ? <Button size="$2" chromeless onPress={() => onReply(message)}>Reply</Button> : null}
                {onReact ? <Button size="$2" chromeless onPress={() => onReact(message, 'like')}>Like</Button> : null}
                {own && onEdit ? <Button size="$2" chromeless onPress={() => onEdit(message)}>Edit</Button> : null}
                {own && onDelete ? <Button size="$2" chromeless onPress={() => onDelete(message)}>Delete</Button> : null}
              </XStack>
            </YStack>
          );
        })}
      </YStack>
    </ScrollView>
  );
}
