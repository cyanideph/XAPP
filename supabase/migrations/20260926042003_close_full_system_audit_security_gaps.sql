-- Full-system audit security hardening.
revoke execute on function public.create_content_category(text,text,text,text) from public;
revoke execute on function public.assign_content_category(uuid,uuid) from public;
revoke execute on function public.remove_content_category(uuid,uuid) from public;
revoke execute on function public.set_content_visibility(uuid,boolean) from public;
revoke execute on function public.set_content_featured(uuid,boolean) from public;
revoke execute on function public.set_featured_profile(uuid,integer) from public;
revoke execute on function public.reorder_featured_profiles(uuid[]) from public;
revoke execute on function public.unfeature_profile(uuid) from public;
revoke execute on function public.strike_room_member(uuid,uuid,integer,text) from public;
revoke execute on function public.request_room_co_host(uuid,uuid) from public;
revoke execute on function public.accept_room_co_host_request(uuid) from public;
revoke execute on function public.decline_room_co_host_request(uuid) from public;
revoke execute on function public.cancel_room_co_host_request(uuid);

grant execute on function public.create_content_category(text,text,text,text) to authenticated;
grant execute on function public.assign_content_category(uuid,uuid) to authenticated;
grant execute on function public.remove_content_category(uuid,uuid) to authenticated;
grant execute on function public.set_content_visibility(uuid,boolean) to authenticated;
grant execute on function public.set_content_featured(uuid,boolean) to authenticated;
grant execute on function public.set_featured_profile(uuid,integer) to authenticated;
grant execute on function public.reorder_featured_profiles(uuid[]) to authenticated;
grant execute on function public.unfeature_profile(uuid) to authenticated;
grant execute on function public.strike_room_member(uuid,uuid,integer,text) to authenticated;
grant execute on function public.request_room_co_host(uuid,uuid) to authenticated;
grant execute on function public.accept_room_co_host_request(uuid) to authenticated;
grant execute on function public.decline_room_co_host_request(uuid) to authenticated;
grant execute on function public.cancel_room_co_host_request(uuid) to authenticated;

drop policy if exists message_replies_access on public.message_replies;
drop policy if exists message_replies_select on public.message_replies;
create policy message_replies_select on public.message_replies
for select to authenticated
using (
  exists (
    select 1
    from public.room_messages m
    join public.room_members rm on rm.room_id = m.room_id
    where m.id = message_replies.message_id
      and rm.user_id = (select auth.uid())
  )
);