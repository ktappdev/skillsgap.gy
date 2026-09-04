-- Keep the Data API surface limited to the operations represented by the RLS policies.
revoke all on table public.profiles, public.content_items from public, anon, authenticated;
grant select on public.profiles to anon, authenticated;
grant insert, update on public.profiles to authenticated;
grant select on public.content_items to anon, authenticated;
grant insert, update, delete on public.content_items to authenticated;
