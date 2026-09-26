import { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Input, Paragraph, Spinner, Text, XStack, YStack } from 'tamagui';
import { XButton } from '../../src/components/XButton';
import {
  addContentComment,
  deleteContent,
  deleteContentComment,
  editContent,
  getContent,
  getCurrentProfile,
  listContentComments,
  listPollOptions,
  repostContent,
  toggleContentCommentVote,
  toggleContentReaction,
  toggleContentSave,
  voteContentPoll,
  type ContentComment,
  type ContentItem,
  type PollOption,
} from '../../src/lib/backend';

export default function ContentDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [item, setItem] = useState<ContentItem | null>(null);
  const [comments, setComments] = useState<ContentComment[]>([]);
  const [pollOptions, setPollOptions] = useState<PollOption[]>([]);
  const [body, setBody] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const [found, profile] = await Promise.all([getContent(id), getCurrentProfile()]);
      if (!found) throw new Error('Content not found.');
      setItem(found);
      setCurrentUserId(profile?.id ?? null);
      setEditTitle(found.title ?? '');
      setEditBody(found.body ?? '');
      setComments(await listContentComments(id, 50));
      setPollOptions(found.kind === 'poll' ? await listPollOptions(id) : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load content.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  const act = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setError('');
    try { await fn(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Action failed.'); }
    finally { setBusy(false); }
  };

  if (loading) {
    return (
      <YStack flex={1} bg="$background" items="center" justify="center">
        <Spinner color="$brandBackground" />
      </YStack>
    );
  }

  if (!item) {
    return (
      <YStack flex={1} p="$4" gap="$4" bg="$background">
        <Paragraph>{error || 'Content not found.'}</Paragraph>
        <XButton onPress={() => router.back()}>Back</XButton>
      </YStack>
    );
  }

  const isOwner = currentUserId === item.author_id;

  return (
    <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 64, paddingBottom: 32 }}>
      <YStack gap="$4">
        <XButton chromeless onPress={() => router.back()}>Back</XButton>
        {error ? <Paragraph color="$red10">{error}</Paragraph> : null}

        {editing ? (
          <YStack gap="$3">
<Text fontSize="$5" fontWeight="800">Edit post</Text>
<Paragraph color="$colorPress">Update your community post.</Paragraph>
            <YStack gap="$3">
              <Input value={editTitle} onChangeText={setEditTitle} placeholder="Title" />
              <Input value={editBody} onChangeText={setEditBody} multiline placeholder="Post text" />
              <XStack gap="$2">
                <XButton
                  disabled={busy || !editBody.trim()}
                  onPress={() => void act(async () => {
                    const updated = await editContent(item.id, editTitle.trim() || null, editBody.trim(), item.metadata);
                    setItem(updated);
                    setEditing(false);
                  })}
                >
                  Save
                </XButton>
                <XButton chromeless onPress={() => setEditing(false)}>Cancel</XButton>
              </XStack>
            </YStack>
          </YStack>
        ) : (
          <YStack gap="$3">
<Text fontSize="$5" fontWeight="800">{item.title || 'Community post'}</Text>
<Paragraph color="$colorPress">{`@${item.author?.username || 'user'} · ${item.kind}`}</Paragraph>
            <YStack gap="$3">
              {item.body ? <Paragraph fontSize="$5">{item.body}</Paragraph> : null}
              <XStack gap="$2" flexWrap="wrap">
                <XButton disabled={busy} onPress={() => void act(() => toggleContentReaction(item.id, 'like'))}>Like</XButton>
                <XButton disabled={busy} chromeless onPress={() => void act(() => toggleContentSave(item.id))}>Save</XButton>
                <XButton disabled={busy} chromeless onPress={() => void act(() => repostContent(item.id))}>Repost</XButton>
              </XStack>
            </YStack>
          </YStack>
        )}

        {item.kind === 'poll' ? (
          <YStack gap="$3">
<Text fontSize="$5" fontWeight="800">Poll</Text>
<Paragraph color="$colorPress">Choose an option.</Paragraph>
            <YStack gap="$2">
              {pollOptions.map(option => (
                <XButton key={option.id} disabled={busy} onPress={() => void act(() => voteContentPoll(item.id, option.id))}>
                  {option.label}
                </XButton>
              ))}
            </YStack>
          </YStack>
        ) : null}

        <YStack gap="$3">
<Text fontSize="$5" fontWeight="800">Comments</Text>
<Paragraph color="$colorPress">Join the conversation.</Paragraph>
          <YStack gap="$2">
            <Input value={body} onChangeText={setBody} placeholder={replyTo ? 'Write a reply' : 'Write a comment'} />
            <XStack gap="$2">
              <XButton
                disabled={busy || !body.trim()}
                onPress={() => void act(async () => {
                  await addContentComment(item.id, body.trim(), replyTo);
                  setBody('');
                  setReplyTo(null);
                  setComments(await listContentComments(item.id, 50));
                })}
              >
                {replyTo ? 'Reply' : 'Comment'}
              </XButton>
              {replyTo ? <XButton chromeless onPress={() => setReplyTo(null)}>Cancel reply</XButton> : null}
            </XStack>

            {comments.map(comment => (
              <YStack key={comment.id} gap="$2" p="$3" borderWidth={1} borderColor="$borderColor" rounded="$4">
                <Text fontWeight="800">@{comment.author?.username || 'user'}</Text>
                <Text>{comment.body}</Text>
                <XStack gap="$2">
                  <XButton size="$2" onPress={() => void act(() => toggleContentCommentVote(comment.id, 1))}>Like</XButton>
                  <XButton size="$2" chromeless onPress={() => setReplyTo(comment.id)}>Reply</XButton>
                  <XButton
                    size="$2"
                    chromeless
                    onPress={() => void act(async () => {
                      await deleteContentComment(comment.id);
                      setComments(values => values.filter(value => value.id !== comment.id));
                    })}
                  >
                    Delete
                  </XButton>
                </XStack>
              </YStack>
            ))}
          </YStack>
        </YStack>

        {isOwner ? (
          <XStack gap="$2">
            <XButton disabled={busy} onPress={() => setEditing(true)}>Edit</XButton>
            <XButton
              disabled={busy}
              chromeless
              onPress={() => Alert.alert('Delete post', 'Delete this post?', [
                { text: 'Cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: () => void act(async () => {
                    await deleteContent(item.id);
                    router.back();
                  }),
                },
              ])}
            >
              Delete
            </XButton>
          </XStack>
        ) : null}
      </YStack>
    </ScrollView>
  );
}
