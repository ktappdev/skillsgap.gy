-- The provider verification guard (public.prevent_provider_self_verification,
-- 20260922101438_complete_provider_signup_journey.sql) runs as the invoking
-- role and calls private.is_platform_admin(), so service_role needs usage on
-- the private schema and execute on that helper.
grant usage on schema private to service_role;
grant execute on function private.is_platform_admin() to service_role;
