export type ContentComment = {
  id: string; content_id: string; author_id: string; parent_id: string | null; body: string;
  created_at: string; updated_at: string; deleted_at: string | null;
  author?: { id: string; username: string; display_name: string | null; avatar_path: string | null } | null;
};

export async function searchContent(query: string, limit = 30, offset = 0) {
  const page = await rpc<{ items?: ContentItem[]; has_more?: boolean }>('search_content', {
    p_query: query.trim(), p_room_id: null, p_limit: limit, p_offset: offset,
  });
  const items = Array.isArray(page?.items) ? page.items : [];
  return { items, has_more: Boolean(page?.has_more) };
}

export async function listCategoryContent(categoryId: string, limit = 50, beforeCreatedAt: string | null = null, beforeId: string | null = null) {
  return rpc<{ items: ContentItem[]; has_more: boolean }>('list_category_content', {
    p_category_id: categoryId, p_limit: limit, p_before_created_at: beforeCreatedAt, p_before_id: beforeId,
  });
}

export async function addContentComment(contentId: string, body: string, parentId: string | null = null) {
  return rpc<ContentComment>('add_content_comment', { p_content_id: contentId, p_body: body.trim(), p_parent_id: parentId });
}
export async function listContentComments(contentId: string, limit = 50) {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase.from('content_comments')
    .select('id,content_id,author_id,parent_id,body,created_at,updated_at,deleted_at')
    .eq('content_id', contentId).is('deleted_at', null).order('created_at', { ascending: false }).limit(limit);
  if (error) throw error;
  const items = (data ?? []) as ContentComment[];
  const ids = [...new Set(items.map(x => x.author_id))];
  if (!ids.length) return items;
  const { data: profiles, error: profileError } = await supabase.from('profiles').select('id,username,display_name,avatar_path').in('id', ids);
  if (profileError) throw profileError;
  const byId = new Map((profiles ?? []).map(p => [p.id, p]));
  return items.map(x => ({ ...x, author: byId.get(x.author_id) ?? null }));
}
export async function deleteContentComment(commentId: string) { return rpc<boolean>('delete_content_comment', { p_comment_id: commentId }); }
export async function toggleContentCommentVote(commentId: string, value: number) { return rpc('toggle_content_comment_vote', { p_comment_id: commentId, p_value: value }); }
export async function editContent(contentId: string, title: string | null, body: string, metadata: Record<string, unknown> | null = null) {
  return rpc<ContentItem>('edit_content', { p_content_id: contentId, p_title: title, p_body: body, p_metadata: metadata });
}
export async function deleteContent(contentId: string) { return rpc<boolean>('delete_content', { p_content_id: contentId }); }
export async function repostContent(contentId: string) { return rpc<ContentItem>('repost_content', { p_content_id: contentId, p_room_id: null }); }
export async function voteContentPoll(contentId: string, optionId: string) { return rpc('vote_content_poll', { p_content_id: contentId, p_option_id: optionId }); }
export async function getEngagementLeaderboard(period = 'all', limit = 25, offset = 0) {
  return rpc('get_engagement_leaderboard', { p_period: period, p_limit: limit, p_offset: offset });
}
