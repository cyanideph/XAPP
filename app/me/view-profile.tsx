import { useCallback, useEffect, useState } from 'react';
import { ScrollView, RefreshControl } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { H1, Input, Menu, Paragraph, Spinner, Text, XStack, YGroup, YStack } from 'tamagui';
import { XButton } from '../../src/components/XButton';
import { addProfileComment, deleteProfileComment, getCurrentProfile, getProfileRelationshipState, getPublicProfile, listProfileComments, recordProfileVisit, toggleBlock, toggleFavorite, toggleFollow, toggleProfileCommentVote, type ProfileComment, type ProfileRelationshipState, type PublicProfile } from '../../src/lib/backend';

type VoteState = { upvotes: number; downvotes: number; user_vote: number | null };

export default function PublicProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const profileId = typeof id === 'string' ? id : '';
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [state, setState] = useState<ProfileRelationshipState>({ following: false, blocked: false, favorite: false });
  const [comments, setComments] = useState<ProfileComment[]>([]);
  const [commentBody, setCommentBody] = useState('');
  const [votes, setVotes] = useState<Record<string, VoteState>>({});
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!profileId) {
      setError('Profile not found.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const [p, relationship, commentPage, current] = await Promise.all([
        getPublicProfile(profileId),
        getProfileRelationshipState(profileId),
        listProfileComments(profileId, 50),
        getCurrentProfile(),
      ]);
      if (!p) {
        setProfile(null);
        setError('Profile not found.');
        return;
      }
      setProfile(p);
      setState(relationship);
      setComments(commentPage.items);
      setCurrentUserId(current?.id ?? null);
      if (current?.id && current.id !== profileId) void recordProfileVisit(profileId).catch(() => undefined);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load profile.');
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  useEffect(() => { void load(); }, [load]);

  async function runAction(name: 'follow' | 'favorite' | 'block') {
    setBusy(name);
    setError('');
    try {
      const value = name === 'follow' ? await toggleFollow(profileId) : name === 'favorite' ? await toggleFavorite(profileId) : await toggleBlock(profileId);
      setState(previous => ({ ...previous, [name === 'block' ? 'blocked' : name]: Boolean(value) }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Action failed.');
    } finally {
      setBusy('');
    }
  }

  async function addComment() {
    const body = commentBody.trim();
    if (!body || !profileId) return;
    setBusy('comment');
    setError('');
    try {
      const comment = await addProfileComment(profileId, body);
      setComments(previous => [comment, ...previous]);
      setCommentBody('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to add comment.');
    } finally {
      setBusy('');
    }
  }

  async function voteComment(commentId: string, value: number) {
    setBusy(`vote:${commentId}`);
    try {
      const result = await toggleProfileCommentVote(commentId, value);
      setVotes(previous => ({ ...previous, [commentId]: result }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to vote.');
    } finally {
      setBusy('');
    }
  }

  async function removeComment(commentId: string) {
    setBusy(`delete:${commentId}`);
    try {
      await deleteProfileComment(commentId);
      setComments(previous => previous.filter(comment => comment.id !== commentId));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to delete comment.');
    } finally {
      setBusy('');
    }
  }

  if (loading) {
    return (
      <YStack flex={1} bg="$background" items="center" justify="center">
        <Spinner color="$brandBackground" />
      </YStack>
    );
  }

  return (
    <ScrollView
      refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void load()} />}
      contentContainerStyle={{ padding: 20, paddingTop: 64, paddingBottom: 40 }}
    >
      <YStack gap="$4">
        <XButton chromeless onPress={() => router.back()}>Back</XButton>
        {error ? <Paragraph color="$red10">{error}</Paragraph> : null}
        {!profile ? (
          <YStack gap="$2"><Text fontSize="$5" fontWeight="800">Profile unavailable</Text><Paragraph color="$colorPress">This profile could not be loaded.</Paragraph></YStack>
        ) : (
          <>
            <YStack gap="$3"><Text fontSize="$5" fontWeight="800">PROFILE</Text><Paragraph color="$colorPress">{profile.status_text || 'X-App community profile'}</Paragraph>
              <YStack gap="$2">
                <H1>{profile.display_name || `@${profile.username}`}</H1>
                <Text color="$colorPress">@{profile.username}</Text>
                {profile.bio ? <Paragraph>{profile.bio}</Paragraph> : null}
              </YStack>
            </YStack>
            {currentUserId !== profile.id ? (
              <XStack gap="$2" flexWrap="wrap">
                <XButton disabled={busy !== ''} onPress={() => void runAction('follow')}>{state.following ? 'Unfollow' : 'Follow'}</XButton>
                <Menu native={false}><Menu.Trigger asChild action="press"><XButton size="$2" chromeless disabled={busy !== ''}>More</XButton></Menu.Trigger><Menu.Portal><Menu.Content><Menu.Item onSelect={() => { void runAction('favorite'); }}><Menu.ItemTitle>{state.favorite ? 'Unfavorite' : 'Favorite'}</Menu.ItemTitle></Menu.Item><Menu.Item destructive={!state.blocked} onSelect={() => { void runAction('block'); }}><Menu.ItemTitle>{state.blocked ? 'Unblock' : 'Block'}</Menu.ItemTitle></Menu.Item></Menu.Content></Menu.Portal></Menu>
              </XStack>
            ) : (
              <Text color="$colorPress">This is your profile.</Text>
            )}
            <YStack gap="$3">
<Text fontSize="$5" fontWeight="800">Comments</Text>
<Paragraph color="$colorPress">{`${comments.length} comment${comments.length === 1 ? '' : 's'}`}</Paragraph>
              <YStack gap="$3">
                {currentUserId ? (
                  <YStack gap="$2">
                    <Input value={commentBody} onChangeText={setCommentBody} placeholder="Leave a comment" multiline />
                    <XButton disabled={!commentBody.trim() || busy === 'comment'} onPress={() => void addComment()}>
                      {busy === 'comment' ? 'Posting…' : 'Post comment'}
                    </XButton>
                  </YStack>
                ) : null}
                <YGroup borderWidth={1} borderColor="$borderColor">
                  {comments.map(comment => {
                    const vote = votes[comment.id];
                    return (
                      <YGroup.Item key={comment.id}>
                        <XStack p="$3" gap="$3" items="center">
                          <YStack flex={1} gap="$1">
                            <Text fontWeight="800">@{comment.author?.username || 'user'}</Text>
                            <Paragraph>{comment.body}</Paragraph>
                          </YStack>
                          <Menu native={false}>
                            <Menu.Trigger asChild action="press"><XButton size="$2" chromeless>More</XButton></Menu.Trigger>
                            <Menu.Portal><Menu.Content>
                              <Menu.Item onSelect={() => { void voteComment(comment.id, 1); }}><Menu.ItemTitle>Upvote ({vote ? vote.upvotes : 0})</Menu.ItemTitle></Menu.Item>
                              <Menu.Item onSelect={() => { void voteComment(comment.id, -1); }}><Menu.ItemTitle>Downvote ({vote ? vote.downvotes : 0})</Menu.ItemTitle></Menu.Item>
                              {currentUserId === comment.author_id ? <Menu.Item destructive onSelect={() => { void removeComment(comment.id); }}><Menu.ItemTitle>Delete</Menu.ItemTitle></Menu.Item> : null}
                            </Menu.Content></Menu.Portal>
                          </Menu>
                        </XStack>
                      </YGroup.Item>
                    );
                  })}
                </YGroup>
                {!comments.length ? <Text color="$colorPress">No comments yet.</Text> : null}
              </YStack>
            </YStack>
          </>
        )}
      </YStack>
    </ScrollView>
  );
}
