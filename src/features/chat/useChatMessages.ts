import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { joinRoom, listConversationMessages, listRoomMessages, markConversationRead, markRoomRead, sendConversationMessage, sendRoomMessage } from './backend';
import type { ChatMessage } from './types';

type Props = { scope: 'room' | 'conversation'; id: string };

export function useChatMessages({ scope, id }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [cursor, setCursor] = useState<{ created_at: string; id: string } | null>(null);

  const load = useCallback(async (before: { created_at: string; id: string } | null = null) => {
    setLoading(true);
    setError(null);
    try {
      if (scope === 'room') await joinRoom(id);
      const page = scope === 'room'
        ? await listRoomMessages(id, before?.created_at ?? null, before?.id ?? null, 50)
        : await listConversationMessages(id, before?.created_at ?? null, before?.id ?? null, 50);
      const incoming = Array.isArray(page?.items) ? page.items : [];
      setMessages(current => before ? [...incoming.reverse(), ...current] : [...incoming].reverse());
      setHasMore(Boolean(page?.has_more));
      setCursor(page?.next_cursor ?? null);
      if (!before) {
        if (scope === 'room') await markRoomRead(id);
        else await markConversationRead(id);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load messages.');
    } finally {
      setLoading(false);
    }
  }, [id, scope]);

  useEffect(() => { load().catch(() => undefined); }, [load]);

  useEffect(() => {
    if (!supabase) return;
    const channelName = scope === 'room' ? `room:${id}` : `conversation:${id}`;
    const event = scope === 'room' ? 'message.created' : 'conversation.message.changed';
    const channel = supabase.channel(channelName);
    channel.on('broadcast', { event }, () => { load().catch(() => undefined); });
    channel.subscribe();

    return () => { void supabase.removeChannel(channel); };
  }, [id, scope, load]);

  const loadOlder = useCallback(async () => {
    if (!hasMore || loading || !cursor) return;
    await load(cursor);
  }, [cursor, hasMore, loading, load]);

  const send = useCallback(async (body: string) => {
    const value = body.trim();
    if (!value || sending) return;
    setSending(true);
    setError(null);
    try {
      const message = scope === 'room'
        ? await sendRoomMessage(id, value)
        : await sendConversationMessage(id, value);
      if (message && typeof message === 'object') {
        setMessages(current => current.some(m => m.id === message.id) ? current : [...current, message]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to send message.');
      throw e;
    } finally {
      setSending(false);
    }
  }, [id, scope, sending]);

  return { messages, loading, sending, error, hasMore, send, loadOlder, reload: () => load() };
}
