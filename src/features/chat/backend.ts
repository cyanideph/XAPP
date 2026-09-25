import { rpc } from '../../lib/backend';
import type { ChatMessage } from './types';

export async function listRoomMessages(roomId: string, beforeCreatedAt: string | null = null, beforeId: string | null = null, limit = 50) {
  return rpc<ChatMessage[]>('list_room_messages', {
    p_room_id: roomId,
    p_before_created_at: beforeCreatedAt,
    p_before_id: beforeId,
    p_limit: limit,
  });
}

export async function sendRoomMessage(roomId: string, body: string) {
  return rpc<ChatMessage>('send_room_message', {
    p_room_id: roomId,
    p_body: body,
    p_kind: 'text',
    p_reply_to_id: null,
    p_metadata: {},
  });
}

export async function listConversationMessages(conversationId: string, beforeCreatedAt: string | null = null, beforeId: string | null = null, limit = 50) {
  return rpc<ChatMessage[]>('list_conversation_messages', {
    p_conversation_id: conversationId,
    p_before_created_at: beforeCreatedAt,
    p_before_id: beforeId,
    p_limit: limit,
  });
}

export async function sendConversationMessage(conversationId: string, body: string) {
  return rpc<ChatMessage>('send_conversation_message', {
    p_conversation_id: conversationId,
    p_body: body,
    p_kind: 'text',
    p_reply_to_id: null,
    p_metadata: {},
  });
}
