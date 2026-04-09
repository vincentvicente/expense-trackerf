-- Enable extensions
create extension if not exists "uuid-ossp";

-- 1. Profiles table
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  full_name   text,
  avatar_url  text,
  currency    text not null default 'CNY',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Auto-create profile on sign-up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2. Categories
create table public.categories (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  name        text not null,
  type        text not null check (type in ('income', 'expense')),
  icon        text,
  color       text,
  sort_order  integer not null default 0,
  is_default  boolean not null default false,
  created_at  timestamptz not null default now(),
  constraint categories_user_name_type_unique unique (user_id, name, type)
);

-- 3. Transactions
create table public.transactions (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid not null references public.profiles(id) on delete cascade,
  category_id    uuid references public.categories(id) on delete set null,
  type           text not null check (type in ('income', 'expense')),
  amount         numeric(12, 2) not null check (amount > 0),
  date           date not null,
  notes          text,
  is_recurring   boolean not null default false,
  recurring_id   uuid,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- 4. Budgets (monthly overall)
create table public.budgets (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  month       date not null,
  amount      numeric(12, 2) not null check (amount > 0),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint budgets_user_month_unique unique (user_id, month),
  constraint budgets_month_is_first_of_month check (extract(day from month) = 1)
);

-- 5. Quick Templates
create table public.quick_templates (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  category_id  uuid references public.categories(id) on delete set null,
  name         text not null,
  type         text not null check (type in ('income', 'expense')),
  amount       numeric(12, 2) check (amount > 0),
  notes        text,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now()
);

-- 6. Recurring Bills
create type public.recurrence_cycle as enum ('weekly', 'monthly', 'yearly');

create table public.recurring_bills (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  category_id     uuid references public.categories(id) on delete set null,
  name            text not null,
  amount          numeric(12, 2) not null check (amount > 0),
  cycle           public.recurrence_cycle not null,
  next_due_date   date not null,
  reminder_days   integer not null default 3 check (reminder_days >= 0),
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- FK from transactions to recurring_bills
alter table public.transactions
  add constraint transactions_recurring_id_fkey
  foreign key (recurring_id) references public.recurring_bills(id) on delete set null;

-- 7. Indexes
create index idx_transactions_user_date on public.transactions (user_id, date desc);
create index idx_transactions_user_category on public.transactions (user_id, category_id);
create index idx_transactions_recurring_id on public.transactions (recurring_id) where recurring_id is not null;
create index idx_budgets_user_month on public.budgets (user_id, month desc);
create index idx_recurring_bills_due on public.recurring_bills (next_due_date) where is_active = true;
create index idx_categories_user_type on public.categories (user_id, type, sort_order);

-- 8. Updated-at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger trg_transactions_updated_at before update on public.transactions
  for each row execute function public.set_updated_at();
create trigger trg_budgets_updated_at before update on public.budgets
  for each row execute function public.set_updated_at();
create trigger trg_recurring_bills_updated_at before update on public.recurring_bills
  for each row execute function public.set_updated_at();

-- 9. Row Level Security
alter table public.profiles        enable row level security;
alter table public.categories      enable row level security;
alter table public.transactions    enable row level security;
alter table public.budgets         enable row level security;
alter table public.quick_templates enable row level security;
alter table public.recurring_bills enable row level security;

create policy "profiles: owner access" on public.profiles for all
  using (id = auth.uid()) with check (id = auth.uid());
create policy "categories: owner access" on public.categories for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "transactions: owner access" on public.transactions for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "budgets: owner access" on public.budgets for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "quick_templates: owner access" on public.quick_templates for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "recurring_bills: owner access" on public.recurring_bills for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- 10. Seed default categories on profile creation
create or replace function public.seed_default_categories()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- Expense categories
  insert into public.categories (user_id, name, type, icon, color, sort_order, is_default) values
    (new.id, '餐饮', 'expense', '🍜', '#FF6B6B', 0, true),
    (new.id, '交通', 'expense', '🚇', '#4ECDC4', 1, true),
    (new.id, '购物', 'expense', '🛒', '#45B7D1', 2, true),
    (new.id, '住房', 'expense', '🏠', '#96CEB4', 3, true),
    (new.id, '衣物', 'expense', '👕', '#FFEAA7', 4, true),
    (new.id, '娱乐', 'expense', '🎮', '#DDA0DD', 5, true),
    (new.id, '通讯', 'expense', '📱', '#98D8C8', 6, true),
    (new.id, '医疗', 'expense', '🏥', '#F7DC6F', 7, true),
    (new.id, '教育', 'expense', '📚', '#BB8FCE', 8, true),
    (new.id, '其他', 'expense', '📦', '#AEB6BF', 9, true);
  -- Income categories
  insert into public.categories (user_id, name, type, icon, color, sort_order, is_default) values
    (new.id, '工资',  'income', '💰', '#2ECC71', 0, true),
    (new.id, '奖金',  'income', '🎁', '#F39C12', 1, true),
    (new.id, '理财',  'income', '📈', '#3498DB', 2, true),
    (new.id, '兼职',  'income', '💼', '#1ABC9C', 3, true),
    (new.id, '其他',  'income', '📦', '#AEB6BF', 4, true);
  return new;
end;
$$;

create trigger trg_seed_categories
  after insert on public.profiles
  for each row execute function public.seed_default_categories();
