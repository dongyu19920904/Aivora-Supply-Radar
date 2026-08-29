drop policy if exists "Allow admin all on apple_store_apps" on public.apple_store_apps;
drop policy if exists "Allow admin all on apple_store_prices" on public.apple_store_prices;

revoke all on public.apple_store_apps from public, anon, authenticated;
grant select (
  id,
  apple_app_id,
  slug,
  name,
  target_countries,
  is_active,
  created_at,
  updated_at
) on public.apple_store_apps to anon, authenticated;

revoke all on public.apple_store_prices from public, anon, authenticated;
grant select (
  id,
  apple_app_id,
  country,
  subscription_name,
  original_price_str,
  price_rmb,
  created_at,
  updated_at
) on public.apple_store_prices to anon, authenticated;
