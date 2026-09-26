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
    .select('conversation_id, conversations(id,kind,title,updated_at)')
    .eq('user_id', userId)
    .order('joined_at', { ascending: false })
    .limit(limit);

  if (membershipError) throw membershipError;

  const rows = (memberships ?? [])
    .map(row => {
      const conversation = Array.isArray(row.conversations) ? row.conversations[0] : row.conversations;
      return conversation ? {
        id: conversation.id,
        kind: conversation.kind,
        title: conversation.title,
        updated_at: conversation.updated_at,
      } : null;
    })
    .filter((row): row is { id: string; kind: string; title: string | null; updated_at: string } => Boolean(row));

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

export async function listFavorites(limit = 20, offset = 0) {
  return rpc('list_favorite_users', { p_limit: limit, p_offset: offset });
}

export async function listNotifications(limit = 20, offset = 0) {
  return rpc('list_notifications', { p_limit: limit, p_offset: offset });
}
