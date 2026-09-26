import { useCallback, useEffect, useState } from 'react';
import { ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, H1, Input, Paragraph, Spinner, Text, YStack } from 'tamagui';
import { addContentComment, deleteContentComment, listContentComments, listContentFeed, toggleContentCommentVote, toggleContentReaction, toggleContentSave, type ContentComment, type ContentItem } from '../../src/lib/backend';

export default function ContentDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [item, setItem] = useState<ContentItem | null>(null);
  const [comments, setComments] = useState<ContentComment[]>([]);
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true); setError('');
    try {
      const page = await listContentFeed(50);
      const found = page.items.find(x => x.id === id) ?? null;
      if (!found) throw new Error('Content not found.');
      setItem(found);
      setComments(await listContentComments(id, 50));
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load content.'); }
    finally { setLoading(false); }
  }, [id]);
  useEffect(() => { void load(); }, [load]);

  const act = async (fn: () => Promise<unknown>) => {
    setBusy(true); setError('');
    try { await fn(); } catch (e) { setError(e instanceof Error ? e.message : 'Action failed.'); } finally { setBusy(false); }
  };

  if (loading) return <YStack flex={1} style={{ justifyContent: 'center', alignItems: 'center' }}><Spinner /></YStack>;
  return <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 64, paddingBottom: 32 }}>
    <YStack gap="$4">
      <H1>{item?.title || 'Community post'}</H1>
      {error ? <Paragraph color="$red10">{error}</Paragraph> : null}
      {item ? <>
        <Text>@{item.author?.username || 'user'} · {item.kind}</Text>
        {item.body ? <Paragraph fontSize="$5">{item.body}</Paragraph> : null}
        <YStack gap="$2"><Button disabled={busy} onPress={() => void act(() => toggleContentReaction(item.id, 'like'))}>Like</Button><Button disabled={busy} chromeless onPress={() => void act(() => toggleContentSave(item.id))}>Save</Button></YStack>
        <YStack gap="$2"><Text fontSize="$6" fontWeight="800">Comments</Text><Input value={body} onChangeText={setBody} placeholder="Write a comment" /><Button disabled={busy || !body.trim()} onPress={() => void act(async () => { await addContentComment(item.id, body); setBody(''); setComments(await listContentComments(item.id, 50)); })}>Comment</Button></YStack>
        {comments.map(c => <YStack key={c.id} p="$3" borderWidth={1} borderColor="$borderColor" gap="$2"><Text fontWeight="800">@{c.author?.username || 'user'}</Text><Text>{c.body}</Text><Button size="$2" onPress={() => void act(() => toggleContentCommentVote(c.id, 1))}>Like</Button><Button size="$2" chromeless onPress={() => void act(() => deleteContentComment(c.id).then(() => setComments(v => v.filter(x => x.id !== c.id))))}>Delete</Button></YStack>)}
      </> : null}
      <Button chromeless onPress={() => router.back()}>Back</Button>
    </YStack>
  </ScrollView>;
}