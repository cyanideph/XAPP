import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { deleteConversationMessage, deleteRoomMessage, editConversationMessage, editRoomMessage, joinRoom, listConversationMessages, listRoomMessages, markConversationRead, markRoomRead, replyToConversationMessage, replyToRoomMessage, sendConversationMessage, sendRoomMessage, toggleRoomReaction } from './backend';
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
    setLoading(true); setError(null);
    try {
      if (scope === 'room') await joinRoom(id);
      const page = scope === 'room' ? await listRoomMessages(id, before?.created_at ?? null, before?.id ?? null, 50) : await listConversationMessages(id, before?.created_at ?? null, before?.id ?? null, 50);
      const incoming = Array.isArray(page?.items) ? page.items : [];
      setMessages(current => before ? [...incoming.reverse(), ...current] : [...incoming].reverse());
      setHasMore(Boolean(page?.has_more)); setCursor(page?.next_cursor ?? null);
      if (!before) scope === 'room' ? await markRoomRead(id) : await markConversationRead(id);
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load messages.'); }
    finally { setLoading(false); }
  }, [id, scope]);

  useEffect(() => { load().catch(() => undefined); }, [load]);
  useEffect(() => {
    if (!supabase) return;
    const channel = supabase.channel(scope === 'room' ? `room:${id}` : `conversation:${id}`, { config: { private: true } });
    if (scope === 'room') {\n      channel.on('broadcast', { event: 'message.created' }, () => { load().catch(() => undefined); });\n      channel.on('broadcast', { event: 'message.updated' }, () => { load().catch(() => undefined); });\n      channel.on('broadcast', { event: 'message.deleted' }, () => { load().catch(() => undefined); });\n    } else {\n      channel.on('broadcast', { event: 'conversation.message.changed' }, () => { load().catch(() => undefined); });\n    }
    channel.subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [id, scope, load]);

  const loadOlder = useCallback(async () => { if (hasMore && !loading && cursor) await load(cursor); }, [cursor, hasMore, loading, load]);
  const send = useCallback(async (body: string) => {
    const value = body.trim(); if (!value || sending) return;
    setSending(true); setError(null);
    try {
      const message = scope === 'room' ? await sendRoomMessage(id, value) : await sendConversationMessage(id, value);
      if (message) setMessages(current => current.some(m => m.id === message.id) ? current : [...current, message]);
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to send message.'); throw e; }
    finally { setSending(false); }
  }, [id, scope, sending]);

  const reply = useCallback(async (targetId: string, body: string) => {
    const value = body.trim(); if (!value) return;
    const message = scope === 'room' ? await replyToRoomMessage(id, targetId, value) : await replyToConversationMessage(id, targetId, value);
    if (message) setMessages(current => current.some(m => m.id === message.id) ? current : [...current, message]);
  }, [id, scope]);

  const edit = useCallback(async (messageId: string, body: string) => {
    const message = scope === 'room' ? await editRoomMessage(messageId, body) : await editConversationMessage(messageId, body);
    if (message) setMessages(current => current.map(m => m.id === message.id ? message : m));
  }, [scope]);

  const remove = useCallback(async (messageId: string) => {
    const message = scope === 'room' ? await deleteRoomMessage(messageId) : await deleteConversationMessage(messageId);
    if (message) setMessages(current => current.map(m => m.id === message.id ? message : m));
  }, [scope]);

  const react = useCallback(async (messageId: string, reaction: string) => {
    if (scope === 'room') await toggleRoomReaction(messageId, reaction);
    await load();
  }, [load, scope]);

  return { messages, loading, sending, error, hasMore, send, reply, edit, remove, react, loadOlder, reload: () => load() };
}
