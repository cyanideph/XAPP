import { rpc } from '../../lib/backend';
import type { ChatMessage } from './types';

export type MessagePage = {
  items: ChatMessage[];
  has_more: boolean;
  next_cursor: { created_at: string; id: string } | null;
};

export async function joinRoom(roomId: string) { return rpc('join_room', { p_room_id: roomId }); }
export async function leaveRoom(roomId: string) { return rpc('leave_room', { p_room_id: roomId }); }

export async function listRoomMessages(roomId: string, beforeCreatedAt: string | null = null, beforeId: string | null = null, limit = 50) {
  return rpc<MessagePage>('list_room_messages', { p_room_id: roomId, p_before_created_at: beforeCreatedAt, p_before_id: beforeId, p_limit: limit });
}
export async function sendRoomMessage(roomId: string, body: string) {
  return rpc<ChatMessage>('send_room_message', { p_room_id: roomId, p_body: body, p_kind: 'text', p_reply_to_id: null, p_metadata: {} });
}
export async function editRoomMessage(messageId: string, body: string) {
  return rpc<ChatMessage>('edit_room_message', { p_message_id: messageId, p_body: body });
}
export async function deleteRoomMessage(messageId: string) {
  return rpc<ChatMessage>('delete_room_message', { p_message_id: messageId });
}
export async function replyToRoomMessage(roomId: string, replyToMessageId: string, body: string) {
  return rpc<ChatMessage>('reply_to_room_message', { p_room_id: roomId, p_reply_to_message_id: replyToMessageId, p_body: body, p_metadata: {} });
}
export async function toggleRoomReaction(messageId: string, reaction: string) {
  return rpc('toggle_room_message_reaction', { p_message_id: messageId, p_reaction: reaction });
}

export async function listConversationMessages(conversationId: string, beforeCreatedAt: string | null = null, beforeId: string | null = null, limit = 50) {
  return rpc<MessagePage>('list_conversation_messages', { p_conversation_id: conversationId, p_before_created_at: beforeCreatedAt, p_before_id: beforeId, p_limit: limit });
}
export async function sendConversationMessage(conversationId: string, body: string) {
  return rpc<ChatMessage>('send_conversation_message', { p_conversation_id: conversationId, p_body: body, p_kind: 'text', p_reply_to_id: null, p_metadata: {} });
}
export async function editConversationMessage(messageId: string, body: string) {
  return rpc<ChatMessage>('edit_conversation_message', { p_message_id: messageId, p_body: body });
}
export async function deleteConversationMessage(messageId: string) {
  return rpc<ChatMessage>('delete_conversation_message', { p_message_id: messageId });
}
export async function replyToConversationMessage(conversationId: string, replyToMessageId: string, body: string) {
  return rpc<ChatMessage>('reply_to_conversation_message', { p_conversation_id: conversationId, p_reply_to_id: replyToMessageId, p_body: body, p_metadata: {} });
}

export async function markRoomRead(roomId: string, readAt = new Date().toISOString()) {
  return rpc('mark_room_read', { p_room_id: roomId, p_read_at: readAt });
}
export async function markConversationRead(conversationId: string, readAt = new Date().toISOString()) {
  return rpc('mark_conversation_read', { p_conversation_id: conversationId, p_read_at: readAt });
}
