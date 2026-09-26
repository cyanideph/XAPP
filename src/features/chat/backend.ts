import { rpc } from '../../lib/backend';
import type { ChatMessage, ChatProfile } from './types';
import { supabase } from '../../lib/supabase';

export type MessagePage = {
  items: ChatMessage[];
  has_more: boolean;
  next_cursor: { created_at: string; id: string } | null;
};

export async function joinRoom(roomId: string) { return rpc('join_room', { p_room_id: roomId }); }
export async function leaveRoom(roomId: string) { return rpc('leave_room', { p_room_id: roomId }); }
export async function touchRoomPresence(roomId: string) { return rpc('touch_room_presence', { p_room_id: roomId }); }
export async function listOnlineRoomMembers(roomId: string, limit = 20, offset = 0, onlineFor = '2 minutes') { return rpc('list_online_room_members', { p_room_id: roomId, p_limit: limit, p_offset: offset, p_online_for: onlineFor }); }
export type RoomMember = {
  user_id: string;
  role: string;
  nickname: string | null;
  joined_at: string;
  last_seen_at: string | null;
  muted_until: string | null;
  banned_until: string | null;
  last_read_at: string | null;
  chat_notifications_enabled: boolean;
  is_pinned: boolean;
  profile?: ChatProfile | null;
};

export async function listRoomMembers(roomId: string, limit = 50, offset = 0) {
  const rows = await rpc<RoomMember[]>('list_room_members', { p_room_id: roomId, p_limit: limit, p_offset: offset });
  if (!Array.isArray(rows) || rows.length === 0) return [];
  const profiles = await listProfiles(rows.map(row => row.user_id));
  const profileById = new Map(profiles.map(profile => [profile.id, profile]));
  return rows.map(row => ({ ...row, profile: profileById.get(row.user_id) ?? null }));
}


export type RoomCoHost = {
  room_id: string;
  user_id: string;
  assigned_by: string;
  created_at: string;
};

export async function listRoomCoHosts(roomId: string) {
  return rpc<RoomCoHost[]>('list_room_co_hosts', { p_room_id: roomId });
}

export async function setRoomCoHost(roomId: string, targetUserId: string, enabled: boolean) {
  return rpc('set_room_co_host', {
    p_room_id: roomId,
    p_target_user_id: targetUserId,
    p_enabled: enabled,
  });
}

export async function kickRoomMember(roomId: string, targetUserId: string, allowRejoin = true, reason: string | null = null) {
  return rpc('kick_room_member', {
    p_room_id: roomId,
    p_target_user_id: targetUserId,
    p_allow_rejoin: allowRejoin,
    p_reason: reason,
  });
}

export type RoomMemberModerationAction = 'warn' | 'mute' | 'kick' | 'ban' | 'unban';

export async function moderateRoomMember(
  roomId: string,
  targetUserId: string,
  action: RoomMemberModerationAction,
  durationMinutes: number | null = null,
  reason: string | null = null,
) {
  return rpc('moderate_room_member', {
    p_room_id: roomId,
    p_target_user_id: targetUserId,
    p_action: action,
    p_duration_minutes: durationMinutes,
    p_reason: reason,
  });
}

export async function strikeRoomMember(
  roomId: string,
  targetUserId: string,
  durationMinutes: number | null = null,
  reason: string | null = null,
) {
  return rpc('strike_room_member', {
    p_room_id: roomId,
    p_target_user_id: targetUserId,
    p_duration_minutes: durationMinutes,
    p_reason: reason,
  });
}

export async function setRoomChatSettings(
  roomId: string,
  announcement: string | null,
  viewOnly: boolean,
  membersCanInvite: boolean,
) {
  return rpc('set_room_chat_settings', {
    p_room_id: roomId,
    p_announcement: announcement,
    p_view_only: viewOnly,
    p_members_can_invite: membersCanInvite,
  });
}

export async function setRoomLock(roomId: string, locked: boolean, reason: string | null = null) {
  return rpc('set_room_lock', {
    p_room_id: roomId,
    p_locked: locked,
    p_reason: reason,
  });
}

export async function setRoomMemberChatPreferences(
  roomId: string,
  notificationsEnabled: boolean | null = null,
  isPinned: boolean | null = null,
) {
  return rpc('set_room_member_chat_preferences', {
    p_room_id: roomId,
    p_notifications_enabled: notificationsEnabled,
    p_is_pinned: isPinned,
  });
}

export async function setRoomPinnedMessage(roomId: string, messageId: string | null) {
  return rpc('set_room_pinned_message', {
    p_room_id: roomId,
    p_message_id: messageId,
  });
}

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

export type RoomReportStatus = 'open' | 'reviewing' | 'resolved' | 'dismissed';
export type RoomReport = {
  id: string;
  room_id: string | null;
  reporter_id: string;
  reported_user_id: string | null;
  message_id: string | null;
  reason: string;
  status: RoomReportStatus;
  resolution: string | null;
  resolved_by: string | null;
  created_at: string;
  resolved_at: string | null;
};

export async function createRoomReport(
  roomId: string,
  reason: string,
  reportedUserId: string | null = null,
  messageId: string | null = null,
) {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) throw new Error('You must be signed in.');
  const { data, error } = await supabase.from('reports').insert({
    room_id: roomId,
    reported_user_id: reportedUserId,
    message_id: messageId,
    reason: reason.trim(),
    reporter_id: userData.user.id,
  }).select('*').single();
  if (error) throw error;
  return data as RoomReport;
}

export async function listRoomReports(roomId: string, status: RoomReportStatus | null = null, limit = 50, offset = 0) {
  return rpc<RoomReport[]>('list_room_reports', {
    p_room_id: roomId,
    p_status: status,
    p_limit: limit,
    p_offset: offset,
  });
}

export async function updateRoomReport(
  reportId: string,
  status: RoomReportStatus,
  resolution: string | null = null,
) {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) throw new Error('You must be signed in.');
  const resolved = status === 'resolved' || status === 'dismissed';
  const { data, error } = await supabase.from('reports').update({
    status,
    resolution: resolution?.trim() || null,
    resolved_by: resolved ? userData.user.id : null,
    resolved_at: resolved ? new Date().toISOString() : null,
  }).eq('id', reportId).select('*').single();
  if (error) throw error;
  return data as RoomReport;
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

export async function listProfiles(userIds: string[]) {
  if (!supabase || userIds.length === 0) return [] as ChatProfile[];
  const { data, error } = await supabase.from('profiles').select('id,username,display_name,avatar_path').in('id', userIds);
  if (error) throw error;
  return (data ?? []) as ChatProfile[];
}

export async function markRoomRead(roomId: string, readAt = new Date().toISOString()) {
  return rpc('mark_room_read', { p_room_id: roomId, p_read_at: readAt });
}
export async function markConversationRead(conversationId: string, readAt = new Date().toISOString()) {
  return rpc('mark_conversation_read', { p_conversation_id: conversationId, p_read_at: readAt });
}
