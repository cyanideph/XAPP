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

  const { data, error } = await supabase
    .from('profiles')
    .select('id,username,display_name,avatar_path')
    .eq('id', userData.user.id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function listPublicRooms(limit = 20, offset = 0) {
  return rpc('list_public_rooms', { p_limit: limit, p_offset: offset });
}
export type Room = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  kind: string;
  province_code: string | null;
  created_by: string;
  is_active: boolean;
  is_locked: boolean;
  created_at: string;
  updated_at: string;
  pinned_message_id: string | null;
  announcement: string | null;
  view_only: boolean;
  members_can_invite: boolean;
};

export async function searchPublicRooms(query: string, limit = 20) {
  return rpc<Room[]>('search_public_rooms', { p_query: query.trim(), p_limit: limit });
}

export async function getRoom(roomId: string) {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase
    .from('rooms')
    .select('id,slug,name,description,kind,province_code,created_by,is_active,is_locked,created_at,updated_at,pinned_message_id,announcement,view_only,members_can_invite')
    .eq('id', roomId)
    .maybeSingle();
  if (error) throw error;
  return data as Room | null;
}

export async function joinRoom(roomId: string) {
  return rpc('join_room', { p_room_id: roomId });
}

export type RoomInvite = {
  id: string;
  room_id: string;
  inviter_id: string;
  invitee_id: string;
  created_at: string;
  accepted_at: string | null;
  declined_at: string | null;
  room: Pick<Room, 'id' | 'name' | 'province_code'> | null;
  inviter: { id: string; username: string; display_name: string | null } | null;
};

export async function createRoomInvite(roomId: string, inviteeId: string) {
  return rpc('create_room_invite', { p_room_id: roomId, p_invitee_id: inviteeId });
}

export async function respondRoomInvite(inviteId: string, accept: boolean) {
  return rpc('respond_room_invite', { p_invite_id: inviteId, p_accept: accept });
}

export async function listPendingRoomInvites(limit = 50) {
  if (!supabase) throw new Error('Supabase is not configured.');

  const { data, error } = await supabase
    .from('room_invites')
    .select('id,room_id,inviter_id,invitee_id,created_at,accepted_at,declined_at')
    .is('accepted_at', null)
    .is('declined_at', null)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  const rows = data ?? [];
  if (!rows.length) return [] as RoomInvite[];

  const roomIds = [...new Set(rows.map(row => row.room_id))];
  const inviterIds = [...new Set(rows.map(row => row.inviter_id))];

  const [{ data: rooms, error: roomsError }, { data: profiles, error: profilesError }] = await Promise.all([
    supabase.from('rooms').select('id,name,province_code').in('id', roomIds),
    supabase.from('profiles').select('id,username,display_name').in('id', inviterIds),
  ]);

  if (roomsError) throw roomsError;
  if (profilesError) throw profilesError;

  const roomById = new Map((rooms ?? []).map(room => [room.id, room]));
  const profileById = new Map((profiles ?? []).map(profile => [profile.id, profile]));

  return rows.map(row => ({
    ...row,
    room: roomById.get(row.room_id) ?? null,
    inviter: profileById.get(row.inviter_id) ?? null,
  })) as RoomInvite[];
}

export async function listOnlineUsers(limit = 20, offset = 0, onlineFor = '2 minutes') {
  return rpc('list_online_users', {
    p_limit: limit,
    p_offset: offset,
    p_online_for: onlineFor,
  });
}

export async function listPublicChats(limit = 20, offset = 0) {
  return rpc('list_public_chats', { p_limit: limit, p_offset: offset });
}

export type ConversationListItem = {
  id: string;
  kind: string;
  title: string | null;
  updated_at: string;
  last_read_at: string | null;
  participant: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_path: string | null;
  } | null;
};

export async function listMyConversations(limit = 20) {
  if (!supabase) throw new Error('Supabase is not configured.');

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  const userId = userData.user?.id;
  if (!userId) return [] as ConversationListItem[];

  const { data: memberships, error: membershipError } = await supabase
    .from('conversation_members')
    .select('conversation_id,last_read_at,conversations(id,kind,title,updated_at)')
    .eq('user_id', userId)
    .order('joined_at', { ascending: false })
    .limit(100);

  if (membershipError) throw membershipError;

  const rows = (memberships ?? [])
    .map(row => {
      const conversation = Array.isArray(row.conversations) ? row.conversations[0] : row.conversations;
      return conversation ? {
        id: conversation.id,
        kind: conversation.kind,
        title: conversation.title,
        updated_at: conversation.updated_at,
        last_read_at: row.last_read_at,
      } : null;
    })
    .filter((row): row is {
      id: string;
      kind: string;
      title: string | null;
      updated_at: string;
      last_read_at: string | null;
    } => Boolean(row))
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, limit);

  if (!rows.length) return [];

  const conversationIds = rows.map(row => row.id);
  const { data: members, error: membersError } = await supabase
    .from('conversation_members')
    .select('conversation_id,user_id,profiles(id,username,display_name,avatar_path)')
    .in('conversation_id', conversationIds)
    .neq('user_id', userId);

  if (membersError) throw membersError;

  const participantByConversation = new Map<string, ConversationListItem['participant']>();
  for (const member of members ?? []) {
    const profile = Array.isArray(member.profiles) ? member.profiles[0] : member.profiles;
    if (profile && !participantByConversation.has(member.conversation_id)) {
      participantByConversation.set(member.conversation_id, profile);
    }
  }

  return rows.map(row => ({
    ...row,
    participant: participantByConversation.get(row.id) ?? null,
  }));
}

export type ConversationInvite = {
  notification_id: string;
  invite_id: string;
  conversation_id: string;
  conversation_title: string | null;
  inviter: { id: string; username: string; display_name: string | null } | null;
  created_at: string;
};

export async function listPendingConversationInvites(limit = 50) {
  const page = await rpc<{
    items: Array<{
      id: string;
      actor_id: string | null;
      type: string;
      payload: Record<string, unknown>;
      read_at: string | null;
      created_at: string;
    }>;
  }>('list_notifications', {
    p_before_created_at: null,
    p_before_id: null,
    p_limit: limit,
  });

  const notifications = Array.isArray(page?.items) ? page.items : [];
  const invites = notifications.filter(item => item.type === 'conversation_invite' && !item.read_at);
  if (!invites.length) return [] as ConversationInvite[];

  const actorIds = [...new Set(invites.map(item => item.actor_id).filter((id): id is string => Boolean(id)))];
  if (!supabase) throw new Error('Supabase is not configured.');

  const { data: profiles, error } = actorIds.length
    ? await supabase.from('profiles').select('id,username,display_name').in('id', actorIds)
    : { data: [], error: null };

  if (error) throw error;

  const profileById = new Map((profiles ?? []).map(row => [row.id, row]));

  return invites
    .map(item => {
      const inviteId = String(item.payload?.invite_id ?? '');
      const conversationId = String(item.payload?.conversation_id ?? '');
      if (!inviteId || !conversationId) return null;

      const invite: ConversationInvite = {
        notification_id: item.id,
        invite_id: inviteId,
        conversation_id: conversationId,
        conversation_title: null,
        inviter: item.actor_id ? profileById.get(item.actor_id) ?? null : null,
        created_at: item.created_at,
      };
      return invite;
    })
    .filter((item): item is ConversationInvite => Boolean(item));
}

export async function respondConversationInvite(inviteId: string, accept: boolean) {
  return rpc('respond_conversation_invite', { p_invite_id: inviteId, p_accept: accept });
}

export async function markNotificationRead(notificationId: string) {
  return rpc('mark_notification_read', { p_notification_id: notificationId });
}

export async function listFavorites(limit = 20, offset = 0) {
  return rpc<any[]>('list_favorite_users', { p_limit: limit, p_offset: offset });
}

export type NotificationItem = {
  id: string; user_id: string; actor_id: string | null; type: string;
  payload: Record<string, unknown>; read_at: string | null; created_at: string;
};
export type NotificationPage = { items: NotificationItem[]; has_more: boolean; next_cursor: { created_at: string; id: string } | null };

export async function listNotifications(limit = 50, beforeCreatedAt: string | null = null, beforeId: string | null = null) {
  const page = await rpc<NotificationPage>('list_notifications', { p_before_created_at: beforeCreatedAt, p_before_id: beforeId, p_limit: limit });
  return { items: Array.isArray(page?.items) ? page.items : [], has_more: Boolean(page?.has_more), next_cursor: page?.next_cursor ?? null };
}
export async function markAllNotificationsRead() { return rpc<number>('mark_all_notifications_read'); }
export async function deleteNotification(notificationId: string) { return rpc<boolean>('delete_notification', { p_notification_id: notificationId }); }
export async function clearNotifications() { return rpc<number>('clear_notifications'); }
export type NotificationPreferences = {
  user_id: string; follow_enabled: boolean; block_enabled: boolean; content_comment_enabled: boolean; comment_reply_enabled: boolean;
  content_reaction_enabled: boolean; room_message_reaction_enabled: boolean; profile_comment_enabled: boolean; mention_enabled: boolean;
  room_invite_enabled: boolean; conversation_invite_enabled: boolean;
};
export async function getNotificationPreferences() { return rpc<NotificationPreferences>('get_notification_preferences'); }
export async function setNotificationPreferences(value: Omit<NotificationPreferences, 'user_id'>) {
  return rpc<NotificationPreferences>('set_notification_preferences', {
    p_follow_enabled:value.follow_enabled,p_block_enabled:value.block_enabled,p_content_comment_enabled:value.content_comment_enabled,
    p_comment_reply_enabled:value.comment_reply_enabled,p_content_reaction_enabled:value.content_reaction_enabled,
    p_room_message_reaction_enabled:value.room_message_reaction_enabled,p_profile_comment_enabled:value.profile_comment_enabled,
    p_mention_enabled:value.mention_enabled,p_room_invite_enabled:value.room_invite_enabled,p_conversation_invite_enabled:value.conversation_invite_enabled,
  });
}
export async function updateCurrentProfile(values: { username: string; display_name: string | null; bio: string | null; status_text: string | null }) {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data: u, error: ue } = await supabase.auth.getUser(); if (ue) throw ue; if (!u.user) throw new Error('You must be signed in.');
  const { data, error } = await supabase.from('profiles').update({
    username:values.username.trim().toLowerCase(),display_name:values.display_name?.trim()||null,bio:values.bio?.trim()||null,
    status_text:values.status_text?.trim()||null,updated_at:new Date().toISOString(),
  }).eq('id',u.user.id).select('id,username,display_name,avatar_path,bio,status_text').single();
  if (error) throw error; return data;
}
export async function listFollowing(userId: string, limit = 50) { return rpc<any[]>('list_following', { p_user_id:userId,p_limit:limit }); }
export async function listFollowers(userId: string, limit = 50) { return rpc<any[]>('list_followers', { p_user_id:userId,p_limit:limit }); }
export async function listBlockedUsers(limit = 100) { return rpc<any[]>('list_blocked_users', { p_limit:limit }); }
export async function listProfileVisitors(limit = 50) { return rpc<any[]>('list_profile_visitors', { p_limit:limit }); }
export async function toggleFollow(targetUserId: string) { return rpc<boolean>('toggle_follow', { p_target_user_id:targetUserId }); }
export async function toggleBlock(targetUserId: string) { return rpc<boolean>('toggle_block', { p_target_user_id:targetUserId }); }
export async function toggleFavorite(targetUserId: string) { return rpc<boolean>('toggle_favorite', { p_target_user_id:targetUserId }); }

export type ContentItem = {
  id: string;
  author_id: string;
  room_id: string | null;
  kind: string;
  title: string | null;
  body: string | null;
  metadata: Record<string, unknown>;
  is_published: boolean;
  is_featured: boolean;
  is_hidden: boolean;
  created_at: string;
  updated_at: string;
  author: { id: string; username: string; display_name: string | null; avatar_path: string | null } | null;
};

export type ContentCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  kind: string;
};

export type FeaturedProfile = {
  profile: { id: string; username: string; display_name: string | null; avatar_path: string | null; bio: string | null; status_text: string | null };
  featured_until: string | null;
  featured_at: string;
  position: number;
};

export async function listContentFeed(limit = 20, beforeCreatedAt: string | null = null, beforeId: string | null = null) {
  const page = await rpc<{ items: ContentItem[]; has_more: boolean }>('list_content_feed', {
    p_room_id: null,
    p_author_id: null,
    p_before_created_at: beforeCreatedAt,
    p_before_id: beforeId,
    p_limit: limit,
  });
  const items = Array.isArray(page?.items) ? page.items : [];
  if (!items.length || !supabase) return { items: [] as ContentItem[], has_more: Boolean(page?.has_more) };
  const authorIds = [...new Set(items.map(item => item.author_id))];
  const { data: profiles, error } = await supabase.from('profiles').select('id,username,display_name,avatar_path,bio,status_text').in('id', authorIds);
  if (error) throw error;
  const byId = new Map((profiles ?? []).map(profile => [profile.id, profile]));
  return { items: items.map(item => ({ ...item, author: byId.get(item.author_id) ?? null })), has_more: Boolean(page?.has_more) };
}

export async function listContentCategories(kind: string | null = null) {
  const data = await rpc<ContentCategory[]>('list_content_categories', { p_kind: kind });
  return Array.isArray(data) ? data : [];
}

export async function listFeaturedProfiles(limit = 10, offset = 0) {
  const data = await rpc<FeaturedProfile[]>('list_featured_profiles', { p_limit: limit, p_offset: offset });
  return Array.isArray(data) ? data : [];
}

export async function createContent(kind: string, title: string | null, body: string, metadata: Record<string, unknown> = {}) {
  return rpc<ContentItem>('create_content', { p_room_id: null, p_kind: kind, p_title: title, p_body: body, p_metadata: metadata });
}

export async function toggleContentReaction(contentId: string, reaction: string) {
  return rpc<boolean>('toggle_content_reaction', { p_content_id: contentId, p_reaction: reaction });
}

export async function toggleContentSave(contentId: string) {
  return rpc<boolean>('toggle_content_save', { p_content_id: contentId });
}

export async function checkIn() {
  return rpc<{ checkin_date: string; streak: number; points: number; already_checked_in: boolean }>('check_in');
}


export type ProfileComment = {
  id: string;
  profile_id: string;
  author_id: string;
  parent_id: string | null;
  body: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  author?: { id: string; username: string; display_name: string | null; avatar_path: string | null } | null;
};

export async function getProfile(userId: string) {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase.from('profiles')
    .select('id,username,display_name,avatar_path,bio,status_text,is_active,created_at,updated_at,last_seen_at')
    .eq('id', userId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function recordProfileVisit(profileId: string) {
  return rpc('record_profile_visit', { p_profile_id: profileId });
}

export async function listProfileComments(profileId: string, limit = 50, beforeCreatedAt: string | null = null, beforeId: string | null = null) {
  const page = await rpc<{ items: ProfileComment[]; has_more: boolean }>('list_profile_comments', {
    p_profile_id: profileId, p_before_created_at: beforeCreatedAt, p_before_id: beforeId, p_limit: limit,
  });
  const items = Array.isArray(page?.items) ? page.items : [];
  if (!items.length || !supabase) return { items, has_more: Boolean(page?.has_more) };
  const authorIds = [...new Set(items.map(item => item.author_id))];
  const { data, error } = await supabase.from('profiles')
    .select('id,username,display_name,avatar_path').in('id', authorIds);
  if (error) throw error;
  const byId = new Map((data ?? []).map(p => [p.id, p]));
  return { items: items.map(item => ({ ...item, author: byId.get(item.author_id) ?? null })), has_more: Boolean(page?.has_more) };
}

export async function addProfileComment(profileId: string, body: string, parentId: string | null = null) {
  return rpc<ProfileComment>('add_profile_comment', { p_profile_id: profileId, p_body: body.trim(), p_parent_id: parentId });
}

export async function deleteProfileComment(commentId: string) {
  return rpc<boolean>('delete_profile_comment', { p_comment_id: commentId });
}

export async function toggleProfileCommentVote(commentId: string, value: number) {
  return rpc<{ value: number | null; upvotes?: number; downvotes?: number }>('toggle_profile_comment_vote', { p_comment_id: commentId, p_value: value });
}
