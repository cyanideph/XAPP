import { rpc } from '../../lib/backend';
import { supabase } from '../../lib/supabase';

export type RoomManagementMember = {
  user_id: string;
  nickname: string | null;
  role: string;
  muted_until: string | null;
  banned_until: string | null;
};

export async function createRoom(name: string, slug: string, description: string, provinceCode: string | null = null) {
  return rpc<{ id: string; name: string }>('create_room', {
    p_name: name.trim(), p_slug: slug.trim(), p_description: description.trim() || null,
    p_kind: 'public', p_province_code: provinceCode?.trim() || null,
  });
}

export async function listBannedRoomMembers(roomId: string, limit = 100, offset = 0) {
  return rpc<RoomManagementMember[]>('list_room_banned_members', { p_room_id: roomId, p_limit: limit, p_offset: offset });
}

export async function listMutedRoomMembers(roomId: string, limit = 100, offset = 0) {
  return rpc<RoomManagementMember[]>('list_room_muted_members', { p_room_id: roomId, p_limit: limit, p_offset: offset });
}

export async function warnRoomMember(roomId: string, userId: string, reason = 'Room moderation') {
  return rpc('moderate_room_member', { p_room_id: roomId, p_target_user_id: userId, p_action: 'warn', p_duration_minutes: null, p_reason: reason });
}

export async function unbanRoomMember(roomId: string, userId: string) {
  return rpc('moderate_room_member', { p_room_id: roomId, p_target_user_id: userId, p_action: 'unban', p_duration_minutes: null, p_reason: 'Unbanned by Room staff' });
}

export async function requestRoomCoHost(roomId: string) {
  return rpc('request_room_co_host', { p_room_id: roomId });
}

export async function acceptRoomCoHostRequest(requestId: string) {
  return rpc('accept_room_co_host_request', { p_request_id: requestId });
}

export async function declineRoomCoHostRequest(requestId: string) {
  return rpc('decline_room_co_host_request', { p_request_id: requestId });
}

export async function cancelRoomCoHostRequest(requestId: string) {
  return rpc('cancel_room_co_host_request', { p_request_id: requestId });
}

export async function listRoomCoHostRequests(roomId: string) {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase
    .from('room_co_host_requests')
    .select('id,room_id,requester_id,status,created_at,resolved_at')
    .eq('room_id', roomId)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return data ?? [];
}

export async function moderateReportedMessage(messageId: string) {
  return rpc('moderate_room_message', { p_message_id: messageId, p_action: 'delete', p_reason: 'Removed after Room report review' });
}
