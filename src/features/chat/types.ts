export type ChatScope = 'room' | 'conversation';

export type ChatProfile = {
  id: string;
  username: string;
  display_name?: string | null;
  avatar_path?: string | null;
};

export type ChatMessage = {
  id: string;
  body: string | null;
  sender_id: string;
  created_at: string;
  kind?: string;
  reply_to_id?: string | null;
  edited_at?: string | null;
  deleted_at?: string | null;
  metadata?: Record<string, unknown> | null;
};
