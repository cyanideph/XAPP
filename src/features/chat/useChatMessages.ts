import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { listConversationMessages, listRoomMessages, markConversationRead, markRoomRead, sendConversationMessage, sendRoomMessage } from './backend';
import type { ChatMessage } from './types';

type Props = { scope: 'room' | 'conversation'; id: string };

export function useChatMessages({ scope, id }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const rows = scope === 'room'
        ? await listRoomMessages(id, null, null, 50)
        : await listConversationMessages(id, null, null, 50);
      setMessages(Array.isArray(rows) ? [...rows].reverse() : []);
      if (scope === 'room') await markRoomRead(id);
      else await markConversationRead(id);
    } finally {
      setLoading(false);
    }
  }, [id, scope]);

  useEffect(() => { load().catch(() => setLoading(false)); }, [load]);

  useEffect(() => {
    if (!supabase) return;
    const channelName = scope === 'room' ? `room:${id}` : `conversation:${id}`;
    const event = scope === 'room' ? 'message.created' : 'conversation.message.changed';
    const channel = supabase.channel(channelName);
    channel.on('broadcast', { event }, () => { load().catch(() => undefined); });
    channel.subscribe();

    return () => { void supabase.removeChannel(channel); };
  }, [id, scope, load]);

  const send = useCallback(async (body: string) => {
    const value = body.trim();
    if (!value || sending) return;
    setSending(true);
    try {
      const message = scope === 'room'
        ? await sendRoomMessage(id, value)
        : await sendConversationMessage(id, value);
      if (message && typeof message === 'object') {
        setMessages(current => current.some(m => m.id === message.id) ? current : [...current, message]);
      }
    } finally {
      setSending(false);
    }
  }, [id, scope, sending]);

  return { messages, loading, sending, send, reload: load };
}
