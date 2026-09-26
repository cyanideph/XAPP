import { Image, Linking, ScrollView } from 'react-native';
import { useEffect, useState } from 'react';
import { Menu, Paragraph, Text, XStack, YStack } from 'tamagui';
import { XButton } from './XButton';
import type { ChatMessage, ChatProfile } from '../features/chat/types';
import { createRoomMediaUrl } from '../features/chat/backend';

function RoomMediaPreview({ message }: { message: ChatMessage }) {
  const [url, setUrl] = useState<string | null>(null);
  const metadata = message.metadata ?? {};
  const bucket = typeof metadata.bucket === 'string' ? metadata.bucket : null;
  const path = typeof metadata.path === 'string' ? metadata.path : null;
  const mimeType = typeof metadata.mime_type === 'string' ? metadata.mime_type : '';
  const filename = typeof metadata.filename === 'string' ? metadata.filename : 'Media';

  useEffect(() => {
    let active = true;
    if (!bucket || !path) return () => { active = false; };
    void createRoomMediaUrl(bucket, path).then(signedUrl => {
      if (active) setUrl(signedUrl);
    });
    return () => { active = false; };
  }, [bucket, path]);

  if (!bucket || !path) return <Text>Media attachment unavailable.</Text>;
  if (!url) return <Text>Loading media…</Text>;
  if (mimeType.startsWith('image/')) {
    return <Image source={{ uri: url }} style={{ width: 240, height: 180, borderRadius: 12 }} resizeMode="cover" />;
  }
  return <XButton size="$2" chromeless onPress={() => { void Linking.openURL(url); }}>
    {mimeType.startsWith('video/') ? 'Open video' : `Open ${filename}`}
  </XButton>;
}

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
  onReport?: (message: ChatMessage) => void;
  profiles?: Record<string, ChatProfile>;
  pinnedMessageId?: string | null;
  reactionOptions?: string[];
};

export function MessageList({ messages, currentUserId, hasMore, loadingOlder, onLoadOlder, onReply, onDelete, onEdit, onReact, onReport, profiles = {}, pinnedMessageId, reactionOptions = ['like', 'love', 'laugh', 'sad', 'angry'] }: Props) {
  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}>
      {hasMore ? <XButton size="$3" onPress={onLoadOlder} disabled={loadingOlder}>{loadingOlder ? 'Loading…' : 'Load older messages'}</XButton> : null}
      <YStack gap="$3">
        {messages.map((message) => {
          const own = message.sender_id === currentUserId;
          return (
            <YStack
              key={message.id}
              self={own ? 'flex-end' : 'flex-start'}
              maxW="88%"
              rounded="$lg"
              bg={own ? '$color' : '$backgroundHover'}
              borderWidth={1}
              borderColor="$borderColor"
              p="$3"
              gap="$1"
            >
              <Text fontSize="$2" color={own ? '$background' : '$colorPress'}>{own ? 'You' : (profiles[message.sender_id]?.display_name || profiles[message.sender_id]?.username || 'Member')}</Text>
              {pinnedMessageId === message.id ? <Text fontSize="$2" fontWeight="800" color={own ? '$background' : '$colorPress'}>Pinned</Text> : null}
              {message.reply_to_id ? <Text fontSize="$2" color={own ? '$background' : '$colorPress'}>Replying to a message</Text> : null}
              {message.kind === 'sticker'
                ? <Text fontSize="$7">{String(message.metadata?.sticker_id ?? 'sticker')}</Text>
                : message.kind === 'media'
                  ? <YStack gap="$2"><RoomMediaPreview message={message} />{message.body ? <Paragraph color={own ? '$background' : '$color'}>{message.body}</Paragraph> : null}</YStack>
                  : <Paragraph color={own ? '$background' : '$color'}>{message.body ?? ''}</Paragraph>}
              {message.kind && message.kind !== 'text' && message.kind !== 'sticker' && message.kind !== 'media'
                ? <Text fontSize="$2" color={own ? '$background' : '$colorPress'}>{message.kind}</Text>
                : null}
              {message.edited_at ? <Text fontSize="$2" color={own ? '$background' : '$colorPress'}>edited</Text> : null}
              <XStack gap="$2" mt="$2" items="center">
                {onReply ? <XButton size="$2" chromeless onPress={() => onReply(message)}>Reply</XButton> : null}
                {(onReact || (onReport && !own) || (own && (onEdit || onDelete))) ? (
                  <Menu>
                    <Menu.Trigger asChild action="press">
                      <XButton size="$2" chromeless>More</XButton>
                    </Menu.Trigger>
                    <Menu.Portal>
                      <Menu.Content>
                        {onReact ? (
                          <>
                            <Menu.Item key="reaction-label" disabled><Menu.ItemTitle>React</Menu.ItemTitle></Menu.Item>
                            {reactionOptions.map(reaction => (
                              <Menu.Item key={reaction} onSelect={() => { void onReact(message, reaction); }}>
                                <Menu.ItemTitle>{reaction === 'like' ? 'Like' : reaction === 'love' ? 'Love' : reaction === 'laugh' ? 'Haha' : reaction === 'sad' ? 'Sad' : 'Angry'}</Menu.ItemTitle>
                              </Menu.Item>
                            ))}
                          </>
                        ) : null}
                        {onReport && !own ? <Menu.Item key="report" onSelect={() => onReport(message)}><Menu.ItemTitle>Report</Menu.ItemTitle></Menu.Item> : null}
                        {own && onEdit ? <Menu.Item key="edit" onSelect={() => onEdit(message)}><Menu.ItemTitle>Edit</Menu.ItemTitle></Menu.Item> : null}
                        {own && onDelete ? <Menu.Item key="delete" destructive onSelect={() => { void onDelete(message); }}><Menu.ItemTitle>Delete</Menu.ItemTitle></Menu.Item> : null}
                      </Menu.Content>
                    </Menu.Portal>
                  </Menu>
                ) : null}
              </XStack>
            </YStack>
          );
        })}
      </YStack>
    </ScrollView>
  );
}
