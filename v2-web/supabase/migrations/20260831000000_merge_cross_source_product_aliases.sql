-- Merge only the 22 exact, manually audited cross-source aliases. Historical
-- catalog rows are retained for rollback and old URL resolution.
do $$
declare
  mapping record;
  alias_id uuid;
  canonical_id uuid;
begin
  for mapping in
    select * from (values
      ('other-email', 'email-account'),
      ('generic-verification', 'phone-verification'),
      ('identity-service', 'identity-verification'),
      ('apple-id', 'apple-id-account'),
      ('chatgpt-account', 'chatgpt-free-account'),
      ('chatgpt-plus-trial', 'chatgpt-plus'),
      ('chatgpt-plus-renewal', 'chatgpt-plus-recharge'),
      ('chatgpt-team', 'chatgpt-team-business'),
      ('claude-pro', 'claude-pro-month'),
      ('chatgpt-services', 'chatgpt-codex-service'),
      ('gemini-pro-account', 'gemini-pro-year'),
      ('gemini-pro-renewal', 'gemini-pro-recharge'),
      ('gmail-email', 'gmail-account'),
      ('google-verification', 'google-phone-verification'),
      ('kiro-free', 'kiro-account'),
      ('kiro-pro', 'kiro-pro-account'),
      ('openai-verification', 'openai-phone-verification'),
      ('outlook-email', 'outlook-account'),
      ('paypal-verification', 'paypal-phone-verification'),
      ('grok-heavy', 'super-grok-heavy'),
      ('x-account', 'x-twitter-account'),
      ('x-premium', 'x-twitter-premium')
    ) as mappings(alias_slug, canonical_slug)
  loop
    select id into alias_id
    from public.product_catalog
    where slug = mapping.alias_slug;

    select id into canonical_id
    from public.product_catalog
    where slug = mapping.canonical_slug;

    -- A new empty database has neither row; importers create only canonical
    -- rows later. An existing alias without its canonical target is unsafe.
    if alias_id is null and canonical_id is null then
      continue;
    end if;
    if alias_id is not null and canonical_id is null then
      raise exception 'canonical product missing for alias % -> %', mapping.alias_slug, mapping.canonical_slug;
    end if;
    if alias_id is null then
      continue;
    end if;

    update public.market_offers
    set canonical_product_id = canonical_id
    where canonical_product_id = alias_id;

    insert into public.market_price_changes (
      product_slug,
      product_name,
      merchant_name,
      source_url,
      previous_price,
      current_price,
      previous_stock,
      current_stock,
      observed_at,
      imported_at
    )
    select
      mapping.canonical_slug,
      product_name,
      merchant_name,
      source_url,
      previous_price,
      current_price,
      previous_stock,
      current_stock,
      observed_at,
      imported_at
    from public.market_price_changes
    where product_slug = mapping.alias_slug
    on conflict (product_slug, merchant_name, source_url, observed_at) do nothing;

    delete from public.market_price_changes
    where product_slug = mapping.alias_slug;

    update public.product_catalog
    set is_active = false
    where id = alias_id;
  end loop;

  if exists (
    select 1
    from public.product_catalog
    where is_active = true
      and slug in (
        'other-email', 'generic-verification', 'identity-service', 'apple-id',
        'chatgpt-account', 'chatgpt-plus-trial', 'chatgpt-plus-renewal', 'chatgpt-team',
        'claude-pro', 'chatgpt-services', 'gemini-pro-account', 'gemini-pro-renewal',
        'gmail-email', 'google-verification', 'kiro-free', 'kiro-pro',
        'openai-verification', 'outlook-email', 'paypal-verification', 'grok-heavy',
        'x-account', 'x-premium'
      )
  ) then
    raise exception 'one or more audited product aliases remain active';
  end if;

  if exists (
    select 1
    from public.market_offers as offer
    join public.product_catalog as catalog on catalog.id = offer.canonical_product_id
    where catalog.slug in (
      'other-email', 'generic-verification', 'identity-service', 'apple-id',
      'chatgpt-account', 'chatgpt-plus-trial', 'chatgpt-plus-renewal', 'chatgpt-team',
      'claude-pro', 'chatgpt-services', 'gemini-pro-account', 'gemini-pro-renewal',
      'gmail-email', 'google-verification', 'kiro-free', 'kiro-pro',
      'openai-verification', 'outlook-email', 'paypal-verification', 'grok-heavy',
      'x-account', 'x-premium'
    )
  ) then
    raise exception 'one or more offers remain attached to a product alias';
  end if;
end
$$;
