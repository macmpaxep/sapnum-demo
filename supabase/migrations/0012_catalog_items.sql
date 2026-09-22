create type public.catalog_item_type as enum ('product', 'service');

create table public.catalog_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  type public.catalog_item_type not null,
  name text not null,
  price_text text,
  description text,
  image_url text,
  created_at timestamptz not null default now()
);

create index catalog_items_company_idx on public.catalog_items(company_id, created_at desc);

alter table public.catalog_items enable row level security;

create policy "catalog items are publicly readable" on public.catalog_items
  for select using (true);

create policy "company owner or admin can manage catalog items" on public.catalog_items
  for all to authenticated using (
    exists (
      select 1 from public.company_members m
      where m.company_id = catalog_items.company_id and m.user_id = auth.uid() and m.role in ('owner', 'admin')
    )
  ) with check (
    exists (
      select 1 from public.company_members m
      where m.company_id = catalog_items.company_id and m.user_id = auth.uid() and m.role in ('owner', 'admin')
    )
  );
