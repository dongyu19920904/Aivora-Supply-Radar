create table if not exists public.account_opportunities (
  report_date date primary key,
  title text not null check (char_length(title) between 1 and 200),
  description text not null default '' check (char_length(description) <= 600),
  body_markdown text not null check (char_length(body_markdown) <= 120000),
  source_url text not null check (source_url ~ '^https://'),
  source_sha text check (source_sha is null or char_length(source_sha) <= 80),
  published_at timestamptz not null,
  source_synced_at timestamptz,
  imported_at timestamptz not null default now()
);

create table if not exists public.market_price_changes (
  id bigint generated always as identity primary key,
  product_slug text not null check (char_length(product_slug) between 1 and 160),
  product_name text not null check (char_length(product_name) between 1 and 240),
  merchant_name text not null check (char_length(merchant_name) between 1 and 240),
  source_url text not null check (source_url ~ '^https://'),
  previous_price numeric,
  current_price numeric,
  previous_stock text check (previous_stock is null or char_length(previous_stock) <= 80),
  current_stock text check (current_stock is null or char_length(current_stock) <= 80),
  observed_at timestamptz not null,
  imported_at timestamptz not null default now(),
  unique (product_slug, merchant_name, source_url, observed_at)
);

create index if not exists account_opportunities_report_date_desc
  on public.account_opportunities (report_date desc);
create index if not exists market_price_changes_observed_at_desc
  on public.market_price_changes (observed_at desc);

alter table public.account_opportunities enable row level security;
alter table public.market_price_changes enable row level security;

revoke all on table public.account_opportunities from public, anon, authenticated;
revoke all on table public.market_price_changes from public, anon, authenticated;
grant select (report_date, title, description, body_markdown, source_url, source_sha, published_at, source_synced_at)
  on public.account_opportunities to anon, authenticated;
grant select (product_slug, product_name, merchant_name, source_url, previous_price, current_price, previous_stock, current_stock, observed_at)
  on public.market_price_changes to anon, authenticated;
grant all on table public.account_opportunities to service_role;
grant all on table public.market_price_changes to service_role;
grant usage, select on sequence public.market_price_changes_id_seq to service_role;

drop policy if exists "Public read account opportunities" on public.account_opportunities;
create policy "Public read account opportunities"
  on public.account_opportunities for select to anon, authenticated using (true);

drop policy if exists "Public read market price changes" on public.market_price_changes;
create policy "Public read market price changes"
  on public.market_price_changes for select to anon, authenticated using (true);
