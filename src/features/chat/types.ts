export type ChatScope = 'room' | 'conversation';

export type ChatProfile = {\n  id: string;\n  username: string;\n  display_name?: string | null;\n  avatar_path?: string | null;\n};\n\nexport type ChatMessage = {
  id: string;
  body: string;
  sender_id: string;
  created_at: string;
  kind?: string;
  reply_to_id?: string | null;
  edited_at?: string | null;
  deleted_at?: string | null;
  metadata?: Record<string, unknown> | null;
};
