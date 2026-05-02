create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.recipe_collections (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.recipe_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  image_url text,
  icon text,
  sort_order integer not null default 0
);

create table if not exists public.recipes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null references public.recipe_categories(name) on update cascade,
  ingredients text not null default '',
  instructions text not null default '',
  image_url text not null default '',
  cook_time text not null default '',
  serves text not null default '',
  description text not null default '',
  is_favorite boolean not null default false,
  collection_id uuid references public.recipe_collections(id) on delete set null,
  rating integer check (rating is null or rating between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.recipes add column if not exists is_favorite boolean not null default false;
alter table public.recipes add column if not exists collection_id uuid references public.recipe_collections(id) on delete set null;
alter table public.recipes add column if not exists rating integer check (rating is null or rating between 1 and 5);
alter table public.recipes add column if not exists updated_at timestamptz not null default now();
alter table public.recipes alter column is_favorite set default false;
update public.recipes set is_favorite = false where is_favorite is null;
update public.recipes set updated_at = created_at where updated_at is null;

drop trigger if exists set_recipes_updated_at on public.recipes;
create trigger set_recipes_updated_at
before update on public.recipes
for each row execute function public.set_updated_at();

create table if not exists public.recipe_notes (
  id uuid primary key default gen_random_uuid(),
  body text not null,
  pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_recipe_notes_updated_at on public.recipe_notes;
create trigger set_recipe_notes_updated_at
before update on public.recipe_notes
for each row execute function public.set_updated_at();

create table if not exists public.shopping_items (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  checked boolean not null default false,
  category text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_shopping_items_updated_at on public.shopping_items;
create trigger set_shopping_items_updated_at
before update on public.shopping_items
for each row execute function public.set_updated_at();

create index if not exists recipes_created_at_idx on public.recipes(created_at desc);
create index if not exists recipes_category_idx on public.recipes(category);
create index if not exists recipes_is_favorite_idx on public.recipes(is_favorite);
create index if not exists recipe_notes_created_at_idx on public.recipe_notes(created_at desc);
create index if not exists shopping_items_checked_idx on public.shopping_items(checked);

alter table public.recipe_collections enable row level security;
alter table public.recipe_categories enable row level security;
alter table public.recipes enable row level security;
alter table public.recipe_notes enable row level security;
alter table public.shopping_items enable row level security;

insert into public.recipe_categories (name, image_url, icon, sort_order)
values
  ('Breakfast', 'https://images.unsplash.com/photo-1484723091739-30a097e8f929?auto=format&fit=crop&w=240&q=80', 'Coffee', 10),
  ('Lunch', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=240&q=80', 'Utensils', 20),
  ('Dinner', 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=240&q=80', 'ChefHat', 30),
  ('Dessert', 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=240&q=80', 'Cookie', 40),
  ('Holiday', 'https://images.unsplash.com/photo-1606787366850-de6330128bfc?auto=format&fit=crop&w=240&q=80', 'Sparkles', 50),
  ('Southern', 'https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=240&q=80', 'Heart', 60),
  ('Soup', 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=240&q=80', 'Utensils', 70),
  ('Lemon', 'https://images.unsplash.com/photo-1587324438673-56c78a866b15?auto=format&fit=crop&w=240&q=80', 'Sparkles', 80)
on conflict (name) do update
set
  image_url = excluded.image_url,
  icon = excluded.icon,
  sort_order = excluded.sort_order;

insert into public.recipe_collections (name, description)
values
  ('Family Favorites', 'Recipes Cristy loves making again.'),
  ('Dinner Party Ideas', 'Special dishes for gathering around the table.'),
  ('Coastal Cottage Weekends', 'Easy, sunny recipes for slow weekends.')
on conflict do nothing;
