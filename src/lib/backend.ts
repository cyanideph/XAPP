import { supabase } from './supabase';

export async function rpc<T = unknown>(name: string, args: Record<string, unknown> = {}) {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase.rpc(name, args);
  if (error) throw error;
  return data as T;
}

export async function listPublicRooms() {
  return rpc('list_public_rooms', {});
}

export async function listOnlineUsers(limit = 20, offset = 0) {
  return rpc('list_online_users', { p_limit: limit, p_offset: offset });
}

export async function listPublicChats(limit = 20, offset = 0) {
  return rpc('list_public_chats', { p_limit: limit, p_offset: offset });
}

export async function listFavorites(limit = 20, offset = 0) {
  return rpc('list_favorite_users', { p_limit: limit, p_offset: offset });
}

export async function listNotifications(limit = 20, offset = 0) {
  return rpc('list_notifications', { p_limit: limit, p_offset: offset });
}
