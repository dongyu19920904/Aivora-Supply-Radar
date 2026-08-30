-- Aggregate offer counts inside Postgres. The previous page downloaded every
-- in-stock offer and performed an O(channels * offers) count in Next.js.
create or replace function public.get_active_channel_summary()
returns table (
  id uuid,
  name text,
  scraper_type text,
  created_at timestamptz,
  updated_at timestamptz,
  product_count bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    target.id,
    target.name,
    target.scraper_type::text,
    target.created_at,
    target.updated_at,
    count(offer.id) filter (where offer.status = 'in_stock'::public.offer_status) as product_count
  from public.crawler_targets as target
  left join public.market_offers as offer on offer.target_id = target.id
  where target.is_active = true
  group by target.id
  order by target.updated_at desc, target.name;
$$;

revoke all on function public.get_active_channel_summary() from public;
grant execute on function public.get_active_channel_summary() to anon, authenticated, service_role;
