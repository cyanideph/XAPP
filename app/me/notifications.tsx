import { useCallback, useEffect, useState } from 'react';
import { ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Button, H1, Paragraph, Spinner, Text, YStack } from 'tamagui';
import { listNotifications, markAllNotificationsRead, markNotificationRead, deleteNotification, clearNotifications, type NotificationItem } from '../../src/lib/backend';

export default function Notifications() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [cursor, setCursor] = useState<{ created_at: string; id: string } | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (append = false) => {
    setLoading(true); setError('');
    try {
      const page = await listNotifications(50, append ? cursor?.created_at ?? null : null, append ? cursor?.id ?? null : null);
      setItems(current => append ? [...current, ...page.items] : page.items);
      setHasMore(page.has_more); setCursor(page.next_cursor);
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load notifications.'); }
    finally { setLoading(false); }
  }, [cursor]);

  useEffect(() => { void load(false); }, []);

  const action = async (fn: () => Promise<unknown>) => {
    setBusy(true); setError('');
    try { await fn(); await load(false); } catch (e) { setError(e instanceof Error ? e.message : 'Notification action failed.'); } finally { setBusy(false); }
  };

  return <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 64, paddingBottom: 32 }}>
    <YStack gap="$3">
      <H1>Notifications.</H1>
      <YStack gap="$2">
        <Button disabled={busy} onPress={() => void action(() => markAllNotificationsRead())}>Mark all read</Button>
        <Button disabled={busy || !items.length} chromeless onPress={() => void action(() => clearNotifications())}>Clear all</Button>
      </YStack>
      {error ? <Paragraph color="$red10">{error}</Paragraph> : null}
      {loading && !items.length ? <Spinner /> : items.length ? items.map(x =>
        <YStack key={x.id} p="$3" borderWidth={1} borderColor="$borderColor" gap="$2">
          <Text fontWeight={x.read_at ? '400' : '800'}>{x.type}</Text>
          <Text>{String(x.payload?.message ?? x.payload?.text ?? 'You have a new notification.')}</Text>
          <YStack gap="$2">
            {!x.read_at ? <Button size="$2" onPress={() => void action(() => markNotificationRead(x.id))}>Mark read</Button> : null}
            <Button size="$2" chromeless onPress={() => void action(() => deleteNotification(x.id))}>Delete</Button>
          </YStack>
        </YStack>
      ) : <Text>No notifications.</Text>}
      {hasMore ? <Button disabled={loading || busy} onPress={() => void load(true)}>Load more</Button> : null}
      <Button chromeless onPress={() => router.back()}>Back</Button>
    </YStack>
  </ScrollView>;
}