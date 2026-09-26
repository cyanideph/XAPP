import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { deleteConversationMessage, deleteRoomMessage, editConversationMessage, editRoomMessage, joinRoom, leaveRoom, listConversationMessages, listProfiles, listRoomMessages, markConversationRead, markRoomRead, replyToConversationMessage, replyToRoomMessage, sendConversationMessage, sendRoomMessage, sendRoomSticker, toggleRoomReaction, touchRoomPresence } from './backend';
import type { ChatMessage, ChatProfile } from './types';

type Props = { scope: 'room' | 'conversation'; id: string };
type Cursor = { created_at: string; id: string };
type TypingState = Record<string, number>;

export function useChatMessages({ scope, id }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [cursor, setCursor] = useState<Cursor | null>(null);
  const [typingUsers, setTypingUsers] = useState<TypingState>({});
  const [profiles, setProfiles] = useState<Record<string, ChatProfile>>({});
  const channelRef = useRef<ReturnType<NonNullable<typeof supabase>['channel']> | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const presenceTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const selfIdRef = useRef<string | null>(null);
  const loadRequestRef = useRef(0);

  const load = useCallback(async (before: Cursor | null = null) => {
    const requestId = ++loadRequestRef.current;
    setLoading(true);
    setError(null);
    try {
      if (scope === 'room') { await joinRoom(id); await touchRoomPresence(id); }
      const page = scope === 'room'
        ? await listRoomMessages(id, before?.created_at ?? null, before?.id ?? null, 50)
        : await listConversationMessages(id, before?.created_at ?? null, before?.id ?? null, 50);
      if (requestId !== loadRequestRef.current) return;

      const incoming = Array.isArray(page?.items) ? page.items : [];
      setMessages(current => before ? [...incoming.reverse(), ...current] : [...incoming].reverse());
      setHasMore(Boolean(page?.has_more));
      setCursor(page?.next_cursor ?? null);

      const ids = [...new Set(incoming.map((item: ChatMessage) => item.sender_id))];
      if (ids.length) {
        const people = await listProfiles(ids);
        if (requestId !== loadRequestRef.current) return;
        setProfiles(current => ({ ...current, ...Object.fromEntries(people.map(person => [person.id, person])) }));
      }

      if (!before) scope === 'room' ? await markRoomRead(id) : await markConversationRead(id);
    } catch (e) {
      if (requestId === loadRequestRef.current) {
        setError(e instanceof Error ? e.message : 'Unable to load messages.');
      }
    } finally {
      if (requestId === loadRequestRef.current) setLoading(false);
    }
  }, [id, scope]);

  useEffect(() => { load().catch(() => undefined); }, [load]);

  useEffect(() => {
    if (scope !== 'room' || !supabase) return;
    let active = true;
    const heartbeat = () => { if (active) void touchRoomPresence(id).catch(() => undefined); };
    heartbeat();
    presenceTimerRef.current = setInterval(heartbeat, 30000);
    return () => {
      active = false;
      if (presenceTimerRef.current) clearInterval(presenceTimerRef.current);
      presenceTimerRef.current = null;
      void leaveRoom(id).catch(() => undefined);
    };
  }, [id, scope]);

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    const topic = scope === 'room' ? `room:${id}` : `conversation:${id}`;
    const channel = supabase.channel(topic, { config: { private: true } });
    channelRef.current = channel;

    let refreshTimer: ReturnType<typeof setTimeout> | null = null;
    const refresh = () => {
      if (!active || refreshTimer) return;
      refreshTimer = setTimeout(() => {
        refreshTimer = null;
        if (active) load().catch(() => undefined);
      }, 100);
    };

    if (scope === 'room') {
      channel.on('broadcast', { event: 'message.created' }, refresh);
      channel.on('broadcast', { event: 'message.updated' }, refresh);
      channel.on('broadcast', { event: 'message.deleted' }, refresh);
    } else {
      channel.on('broadcast', { event: 'conversation.message.changed' }, refresh);
    }

    channel.on('broadcast', { event: 'typing.started' }, ({ payload }) => {
      const userId = String(payload?.user_id ?? '');
      if (!userId || userId === selfIdRef.current) return;
      setTypingUsers(current => ({ ...current, [userId]: Date.now() + 4000 }));
    });
    channel.on('broadcast', { event: 'typing.stopped' }, ({ payload }) => {
      const userId = String(payload?.user_id ?? '');
      if (!userId) return;
      setTypingUsers(current => {
        const next = { ...current };
        delete next[userId];
        return next;
      });
    });

    void supabase.auth.getUser().then(({ data }) => { selfIdRef.current = data.user?.id ?? null; });
    channel.subscribe();

    const cleanupTimer = setInterval(() => {
      const now = Date.now();
      setTypingUsers(current => {
        const next = Object.fromEntries(Object.entries(current).filter(([, expires]) => expires > now)) as TypingState;
        return Object.keys(next).length === Object.keys(current).length ? current : next;
      });
    }, 1000);

    return () => {
      active = false;
      clearInterval(cleanupTimer);
      if (refreshTimer) clearTimeout(refreshTimer);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      channelRef.current = null;
      if (supabase) void supabase.removeChannel(channel);
    };
  }, [id, scope, load]);

  const broadcastTyping = useCallback(async (typing: boolean) => {
    if (!supabase) return;
    const channel = channelRef.current;
    if (!channel) return;
    const { data } = await supabase.auth.getUser();
    const userId = data.user?.id;
    if (!userId) return;
    selfIdRef.current = userId;
    await channel.send({
      type: 'broadcast',
      event: typing ? 'typing.started' : 'typing.stopped',
      payload: { user_id: userId },
    });
  }, []);

  const onTyping = useCallback(() => {
    void broadcastTyping(true);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => { void broadcastTyping(false); }, 2500);
  }, [broadcastTyping]);

  const loadOlder = useCallback(async () => {
    if (hasMore && !loading && cursor) await load(cursor);
  }, [cursor, hasMore, loading, load]);

  const send = useCallback(async (body: string) => {
    const value = body.trim();
    if (!value || sending) return null;
    setSending(true);
    setError(null);
    try {
      await broadcastTyping(false);
      const message = scope === 'room' ? await sendRoomMessage(id, value) : await sendConversationMessage(id, value);
      if (message) setMessages(current => current.some(m => m.id === message.id) ? current : [...current, message]);
      return message ?? null;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to send message.');
      throw e;
    } finally {
      setSending(false);
    }
  }, [broadcastTyping, id, scope, sending]);

  const sendMedia = useCallback(async (body: string, metadata: Record<string, unknown>) => {
    if (scope !== 'room' || sending) return null;
    setSending(true);
    setError(null);
    try {
      await broadcastTyping(false);
      const message = await sendRoomMessage(id, body.trim(), 'media', metadata);
      if (message) setMessages(current => current.some(m => m.id === message.id) ? current : [...current, message]);
      return message ?? null;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to send media.');
      throw e;
    } finally {
      setSending(false);
    }
  }, [broadcastTyping, id, scope, sending]);

  const sendSticker = useCallback(async (stickerId: string) => {
    if (scope !== 'room' || !stickerId.trim() || sending) return null;
    setSending(true);
    setError(null);
    try {
      await broadcastTyping(false);
      const message = await sendRoomSticker(id, stickerId.trim());
      if (message) setMessages(current => current.some(m => m.id === message.id) ? current : [...current, message]);
      return message ?? null;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to send sticker.');
      throw e;
    } finally {
      setSending(false);
    }
  }, [broadcastTyping, id, scope, sending]);

  const reply = useCallback(async (targetId: string, body: string) => {
    const value = body.trim();
    if (!value) return;
    await broadcastTyping(false);
    const message = scope === 'room' ? await replyToRoomMessage(id, targetId, value) : await replyToConversationMessage(id, targetId, value);
    if (message) setMessages(current => current.some(m => m.id === message.id) ? current : [...current, message]);
  }, [broadcastTyping, id, scope]);

  const edit = useCallback(async (messageId: string, body: string) => {
    const value = body.trim();
    if (!value) return;
    const message = scope === 'room' ? await editRoomMessage(messageId, value) : await editConversationMessage(messageId, value);
    if (message) setMessages(current => current.map(m => m.id === message.id ? message : m));
  }, [id, scope]);

  const remove = useCallback(async (messageId: string) => {
    const message = scope === 'room' ? await deleteRoomMessage(messageId) : await deleteConversationMessage(messageId);
    if (message) setMessages(current => current.map(m => m.id === message.id ? message : m));
  }, [scope]);

  const react = useCallback(async (messageId: string, reaction: string) => {
    if (scope === 'room') await toggleRoomReaction(messageId, reaction);
    await load();
  }, [load, scope]);

  return {
    messages, loading, sending, error, hasMore, typingUsers, profiles,
    send, sendMedia, sendSticker, reply, edit, remove, react, onTyping, loadOlder,
    reload: () => load(),
  };
}
