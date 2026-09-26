import { useCallback, useEffect, useState } from 'react';
import { ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, H1, Input, Paragraph, Spinner, Text, XStack, YStack } from 'tamagui';
import { getProfile, listProfileComments, addProfileComment, deleteProfileComment, toggleProfileCommentVote, toggleFollow, toggleBlock, toggleFavorite, recordProfileVisit, type ProfileComment } from '../../src/lib/backend';

export default function ViewProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [comments, setComments] = useState<ProfileComment[]>([]);
  const [following, setFollowing] = useState(false);
  const [favorite, setFavorite] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true); setError('');
    try {
      const [p, c] = await Promise.all([getProfile(id), listProfileComments(id, 50)]);
      setProfile(p); setComments(c.items);
      await recordProfileVisit(id);
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load profile.'); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => { void import('../../src/lib/supabase').then(({ supabase }) => supabase?.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id ?? null))); }, []);

  const act = async (fn: () => Promise<unknown>, after?: () => void) => {
    setBusy(true); setError('');
    try { await fn(); after?.(); } catch (e) { setError(e instanceof Error ? e.message : 'Action failed.'); } finally { setBusy(false); }
  };

  if (loading) return <YStack flex={1} style={{ justifyContent: 'center', alignItems: 'center' }}><Spinner /></YStack>;
  if (!profile) return <YStack flex={1} p="$5" gap="$3"><Text>{error || 'Profile not found.'}</Text><Button onPress={() => router.back()}>Back</Button></YStack>;

  return <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 64, paddingBottom: 32 }}>
    <YStack gap="$4">
      <H1>{profile.display_name || ('@' + profile.username)}</H1>
      <Text>@{profile.username}</Text>
      {profile.status_text ? <Paragraph>{profile.status_text}</Paragraph> : null}
      {profile.bio ? <Paragraph>{profile.bio}</Paragraph> : null}
      {error ? <Paragraph color="$red10">{error}</Paragraph> : null}
      <XStack gap="$2" flexWrap="wrap">
        <Button disabled={busy} onPress={() => void act(() => toggleFollow(profile.id), () => setFollowing(v => !v))}>{following ? 'Unfollow' : 'Follow'}</Button>
        <Button disabled={busy} onPress={() => void act(() => toggleFavorite(profile.id), () => setFavorite(v => !v))}>{favorite ? 'Remove favorite' : 'Favorite'}</Button>
        <Button disabled={busy} chromeless onPress={() => void act(() => toggleBlock(profile.id), () => setBlocked(v => !v))}>{blocked ? 'Unblock' : 'Block'}</Button>
      </XStack>
      <YStack gap="$2"><Text fontSize="$6" fontWeight="800">Profile comments</Text>
        <Input value={body} onChangeText={setBody} placeholder="Write a comment" />
        <Button disabled={busy || body.trim().length < 1} onPress={() => void act(async () => { await addProfileComment(profile.id, body); setBody(''); const page = await listProfileComments(profile.id, 50); setComments(page.items); })}>Comment</Button>
      </YStack>
      {comments.map(comment => <YStack key={comment.id} p="$3" borderWidth={1} borderColor="$borderColor" gap="$2">
        <Text fontWeight="800">{comment.author?.display_name || ('@' + (comment.author?.username || comment.author_id.slice(0, 8)))}</Text>
        <Text>{comment.body}</Text>
        <XStack gap="$2">
          <Button size="$2" onPress={() => void act(() => toggleProfileCommentVote(comment.id, 1))}>Like</Button>
          <Button size="$2" chromeless onPress={() => void act(() => toggleProfileCommentVote(comment.id, -1))}>Dislike</Button>
          {currentUserId === comment.author_id ? <Button size="$2" chromeless onPress={() => void act(() => deleteProfileComment(comment.id), () => setComments(v => v.filter(x => x.id !== comment.id)))}>Delete</Button> : null}
        </XStack>
      </YStack>)}
      <Button chromeless onPress={() => router.back()}>Back</Button>
    </YStack>
  </ScrollView>;
}