import { supabase } from './supabase';

export async function rpc<T = unknown>(name: string, args: Record<string, unknown> = {}) {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase.rpc(name, args);
  if (error) throw error;
  return data as T;
}

export async function getCurrentProfile() {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) return null;
  const { data, error } = await supabase.from('profiles').select('id,username,display_name,avatar_path').eq('id', userData.user.id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function listPublicRooms(limit = 20, offset = 0) { return rpc('list_public_rooms', { p_limit: limit, p_offset: offset }); }
export type Room = { id:string; slug:string; name:string; description:string|null; kind:string; province_code:string|null; created_by:string; is_active:boolean; is_locked:boolean; created_at:string; updated_at:string; pinned_message_id:string|null; announcement:string|null; view_only:boolean; members_can_invite:boolean; };
export async function searchPublicRooms(query:string, limit=20) { return rpc<Room[]>('search_public_rooms',{p_query:query.trim(),p_limit:limit}); }
export async function getRoom(roomId:string) { if(!supabase) throw new Error('Supabase is not configured.'); const {data,error}=await supabase.from('rooms').select('id,slug,name,description,kind,province_code,created_by,is_active,is_locked,created_at,updated_at,pinned_message_id,announcement,view_only,members_can_invite').eq('id',roomId).maybeSingle(); if(error) throw error; return data as Room|null; }
export type CreatedRoomInput={name:string; slug:string; description?:string|null; kind?:string; provinceCode?:string|null;};
export async function createRoom(input:CreatedRoomInput){ return rpc<Room>('create_room',{p_name:input.name.trim(),p_slug:input.slug.trim(),p_description:input.description?.trim()||null,p_kind:input.kind??'public',p_province_code:input.provinceCode?.trim()||null}); }
export async function joinRoom(roomId:string){return rpc('join_room',{p_room_id:roomId});}
export async function leaveRoom(roomId:string){return rpc('leave_room',{p_room_id:roomId});}
export type RoomInvite={id:string;room_id:string;inviter_id:string;invitee_id:string;created_at:string;accepted_at:string|null;declined_at:string|null;room:Pick<Room,'id'|'name'|'province_code'>|null;inviter:{id:string;username:string;display_name:string|null}|null;};
export async function createRoomInvite(roomId:string,inviteeId:string){return rpc('create_room_invite',{p_room_id:roomId,p_invitee_id:inviteeId});}
export async function respondRoomInvite(inviteId:string,accept:boolean){return rpc('respond_room_invite',{p_invite_id:inviteId,p_accept:accept});}
export async function listPendingRoomInvites(limit=50){
  if(!supabase) throw new Error('Supabase is not configured.');
  const {data,error}=await supabase.from('room_invites').select('id,room_id,inviter_id,invitee_id,created_at,accepted_at,declined_at').is('accepted_at',null).is('declined_at',null).order('created_at',{ascending:false}).limit(limit);
  if(error) throw error; const rows=data??[]; if(!rows.length)return [] as RoomInvite[];
  const roomIds=[...new Set(rows.map(r=>r.room_id))], inviterIds=[...new Set(rows.map(r=>r.inviter_id))];
  const [{data:rooms,error:re},{data:profiles,error:pe}]=await Promise.all([supabase.from('rooms').select('id,name,province_code').in('id',roomIds),supabase.from('profiles').select('id,username,display_name').in('id',inviterIds)]);
  if(re)throw re;if(pe)throw pe; const rb=new Map((rooms??[]).map(r=>[r.id,r])),pb=new Map((profiles??[]).map(p=>[p.id,p]));
  return rows.map(r=>({...r,room:rb.get(r.room_id)??null,inviter:pb.get(r.inviter_id)??null})) as RoomInvite[];
}
export async function listOnlineUsers(limit=20,offset=0,onlineFor='2 minutes'){return rpc('list_online_users',{p_limit:limit,p_offset:offset,p_online_for:onlineFor});}
export async function listPublicChats(limit=20,offset=0){return rpc('list_public_chats',{p_limit:limit,p_offset:offset});}

export type RoomManagementMember={user_id:string;nickname:string|null;role:string;muted_until:string|null;banned_until:string|null;};
export async function listBannedRoomMembers(roomId:string,limit=100,offset=0){return rpc<RoomManagementMember[]>('list_room_banned_members',{p_room_id:roomId,p_limit:limit,p_offset:offset});}
export async function listMutedRoomMembers(roomId:string,limit=100,offset=0){return rpc<RoomManagementMember[]>('list_room_muted_members',{p_room_id:roomId,p_limit:limit,p_offset:offset});}
export async function moderateRoomMember(roomId:string,targetUserId:string,action:'warn'|'mute'|'kick'|'ban'|'unban',durationMinutes:number|null=null,reason:string|null=null){return rpc('moderate_room_member',{p_room_id:roomId,p_target_user_id:targetUserId,p_action:action,p_duration_minutes:durationMinutes,p_reason:reason});}
export type RoomCoHostRequest={id:string;room_id:string;requester_id:string;status:string;created_at:string;resolved_at:string|null;};
export async function requestRoomCoHost(roomId:string){return rpc('request_room_co_host',{p_room_id:roomId});}
export async function acceptRoomCoHostRequest(requestId:string){return rpc('accept_room_co_host_request',{p_request_id:requestId});}
export async function declineRoomCoHostRequest(requestId:string){return rpc('decline_room_co_host_request',{p_request_id:requestId});}
export async function cancelRoomCoHostRequest(requestId:string){return rpc('cancel_room_co_host_request',{p_request_id:requestId});}
export async function listRoomCoHostRequests(roomId:string,status:string|null=null){return rpc<RoomCoHostRequest[]>('list_room_co_host_requests',{p_room_id:roomId,p_status:status});}

export type ConversationListItem={id:string;kind:string;title:string|null;updated_at:string;last_read_at:string|null;participant:{id:string;username:string;display_name:string|null;avatar_path:string|null}|null;};
export async function listMyConversations(limit=20){if(!supabase)throw new Error('Supabase is not configured.');const {data:userData,error:userError}=await supabase.auth.getUser();if(userError)throw userError;const userId=userData.user?.id;if(!userId)return [];const {data:memberships,error}=await supabase.from('conversation_members').select('conversation_id,last_read_at,conversations(id,kind,title,updated_at)').eq('user_id',userId).order('joined_at',{ascending:false}).limit(100);if(error)throw error;const rows=(memberships??[]).map(row=>{const c=Array.isArray(row.conversations)?row.conversations[0]:row.conversations;return c?{id:c.id,kind:c.kind,title:c.title,updated_at:c.updated_at,last_read_at:row.last_read_at}:null;}).filter(Boolean).sort((a,b)=>new Date(b.updated_at).getTime()-new Date(a.updated_at).getTime()).slice(0,limit);if(!rows.length)return [];const ids=rows.map(r=>r.id);const {data:ms,error:me}=await supabase.from('conversation_members').select('conversation_id,user_id,profiles(id,username,display_name,avatar_path)').in('conversation_id',ids).neq('user_id',userId);if(me)throw me;const pb=new Map<string,ConversationListItem['participant']>();for(const m of ms??[]){const p=Array.isArray(m.profiles)?m.profiles[0]:m.profiles;if(p&&!pb.has(m.conversation_id))pb.set(m.conversation_id,p);}return rows.map(r=>({...r,participant:pb.get(r.id)??null})) as ConversationListItem[];}

export async function listPendingConversationInvites(limit=50){return [] as Array<never>;}
export async function markNotificationRead(_id:string){return null;}
export async function respondConversationInvite(_id:string,_accept:boolean){return null;}
