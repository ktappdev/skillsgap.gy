-- Trigger-only functions must not be callable through the public Data API.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
grant execute on function public.handle_new_user() to supabase_auth_admin;

revoke execute on function public.set_updated_at() from public, anon, authenticated;
