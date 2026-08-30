-- Preserve the distinction between a real zero price and no confirmed in-stock quote.
-- A warranty quote must be explicitly tagged as warranty/after-sales instead of using
-- the highest in-stock price as a proxy.
create or replace function public.get_product_catalog_summary()
returns table (
  id uuid,
  slug text,
  name text,
  short_desc text,
  search_keywords text[],
  is_active boolean,
  platform_id uuid,
  sort_order integer,
  display_id text,
  platform_name text,
  platform_sort_order integer,
  lowest_price numeric,
  warranty_price numeric,
  channel_count bigint,
  latest_offer_at timestamptz
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    catalog.id,
    catalog.slug,
    catalog.name,
    catalog.short_desc,
    catalog.search_keywords,
    catalog.is_active,
    catalog.platform_id,
    catalog.sort_order,
    catalog.display_id,
    platform.name as platform_name,
    platform.sort_order as platform_sort_order,
    min(offer.price) filter (
      where offer.status = 'in_stock'::public.offer_status and offer.price > 0
    ) as lowest_price,
    min(offer.price) filter (
      where offer.status = 'in_stock'::public.offer_status
        and offer.price > 0
        and array_to_string(coalesce(offer.tags, array[]::text[]), ' ') ~* '(warranty|质保|售后)'
    ) as warranty_price,
    count(offer.id) filter (
      where offer.status = 'in_stock'::public.offer_status
    ) as channel_count,
    max(offer.updated_at) as latest_offer_at
  from public.product_catalog as catalog
  join public.product_platforms as platform
    on platform.id = catalog.platform_id
  left join public.market_offers as offer
    on offer.canonical_product_id = catalog.id
   and offer.status <> 'blacklisted'::public.offer_status
  where catalog.is_active = true
  group by catalog.id, platform.id
  order by platform.sort_order, catalog.sort_order, catalog.name;
$$;

revoke all on function public.get_product_catalog_summary() from public;
grant execute on function public.get_product_catalog_summary() to anon, authenticated;
