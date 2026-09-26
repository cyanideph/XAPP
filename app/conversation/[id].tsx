import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { H1, Paragraph, Spinner, Text, XStack, YStack } from 'tamagui';
import { BentoCard } from '../../src/components/BentoCard';
import { XButton } from '../../src/components/XButton';
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
  const {
    messages,
    loading,
    sending,
    error,
    hasMore,
    loadOlder,
    send,
    reply,
    edit,
    remove,
    profiles,
    typingUsers,
    onTyping,
  } = useChatMessages({ scope: 'conversation', id });

  const submit = async (body: string) => {
    if (replyTarget) {
      await reply(replyTarget.id, body);
      setReplyTarget(null);
    } else if (editTarget) {
      await edit(editTarget.id, body);
      setEditTarget(null);
    } else {
      await send(body);
    }
  };

  const typingNames = Object.keys(typingUsers)
    .map(userId => profiles[userId]?.display_name || profiles[userId]?.username || 'Someone')
    .slice(0, 2);

  return (
    <YStack flex={1} bg="$background">
      <YStack px="$4" pt="$3" pb="$2" gap="$3">
        <BentoCard title="CONVERSATION" description="Private chat">
          <XStack style={{ alignItems: 'center', justifyContent: 'space-between' }}>
            <YStack flex={1}>
              <H1 fontSize="$7" fontWeight="900">Chat</H1>
              <Paragraph color="$colorPress">
                {messages.length ? `${messages.length} messages loaded` : 'Start the conversation.'}
              </Paragraph>
            </YStack>
            <XButton size="$2" chromeless onPress={() => router.back()}>Done</XButton>
          </XStack>
        </BentoCard>
        {error ? <Paragraph color="$red10">{error}</Paragraph> : null}
      </YStack>

      {loading ? (
        <YStack flex={1} style={{ alignItems: 'center', justifyContent: 'center' }}>
          <Spinner />
        </YStack>
      ) : (
        <YStack flex={1}>
          <MessageList
            messages={messages}
            currentUserId={session?.user.id}
            hasMore={hasMore}
            onLoadOlder={loadOlder}
            profiles={profiles}
            onReply={message => { setEditTarget(null); setReplyTarget(message); }}
            onEdit={message => { setReplyTarget(null); setEditTarget(message); }}
            onDelete={message => remove(message.id)}
          />
        </YStack>
      )}

      {typingNames.length ? (
        <XStack px="$4" pb="$2" style={{ alignItems: 'center' }}>
          <Text fontSize="$2" color="$colorPress">
            {typingNames.join(', ')} {typingNames.length === 1 ? 'is' : 'are'} typing…
          </Text>
        </XStack>
      ) : null}

      {replyTarget ? (
        <YStack px="$3" pt="$2">
          <BentoCard
            title="Replying"
            description={(replyTarget.body ?? '').slice(0, 80) || 'Message'}
          />
        </YStack>
      ) : null}

      <MessageComposer
        onSend={submit}
        disabled={sending || loading}
        editValue={editTarget?.body ?? null}
        onEditCancel={() => setEditTarget(null)}
        onTyping={onTyping}
      />
    </YStack>
  );
}
