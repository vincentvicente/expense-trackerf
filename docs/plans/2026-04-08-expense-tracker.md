# 个人日常开销记录软件 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a cross-platform (iOS, Android, Web) personal expense tracker with cloud sync, budget management, and statistics — styled like 钱迹.

**Architecture:** Expo (React Native) app with file-based routing via Expo Router. Supabase provides auth, PostgreSQL database, and realtime sync. Zustand for client state. Tamagui for cross-platform UI with dark mode.

**Tech Stack:** Expo SDK 55, Expo Router, TypeScript, Tamagui, Zustand, Supabase (Auth + DB + Realtime), react-native-gifted-charts, react-native-reanimated

---

## Task 1: Project Scaffolding & Dependencies

**Files:**
- Create: `expense-tracker/` (Expo project root)
- Create: `expense-tracker/tamagui.config.ts`
- Create: `expense-tracker/lib/supabase.ts`
- Create: `expense-tracker/.env.local`

**Step 1: Create Expo project**

```bash
cd /Users/vicentezhu/Desktop
npx create-expo-app@latest expense-tracker --template default@sdk-55
cd expense-tracker
```

**Step 2: Install core dependencies**

```bash
# Supabase
npx expo install @supabase/supabase-js @react-native-async-storage/async-storage expo-secure-store
npm install react-native-url-polyfill

# Tamagui
npm install tamagui @tamagui/core @tamagui/config @tamagui/babel-plugin

# State management
npm install zustand

# Charts
npm install react-native-gifted-charts react-native-linear-gradient
npx expo install react-native-svg

# Animations & gestures (needed for swipe, transitions)
npx expo install react-native-reanimated react-native-gesture-handler

# Date handling
npm install dayjs
```

**Step 3: Configure Tamagui**

Create `tamagui.config.ts`:
```typescript
import { defaultConfig } from '@tamagui/config/v4'
import { createTamagui } from 'tamagui'

export const tamaguiConfig = createTamagui(defaultConfig)
export default tamaguiConfig

export type Conf = typeof tamaguiConfig
declare module 'tamagui' {
  interface TamaguiCustomConfig extends Conf {}
}
```

Update `babel.config.js`:
```javascript
module.exports = function (api) {
  api.cache(true)
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        '@tamagui/babel-plugin',
        {
          components: ['tamagui'],
          config: './tamagui.config.ts',
          logTimings: true,
          disableExtraction: process.env.NODE_ENV === 'development',
        },
      ],
      'react-native-reanimated/plugin',
    ],
  }
}
```

**Step 4: Configure Supabase client**

Create `.env.local`:
```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Create `lib/supabase.ts`:
```typescript
import 'react-native-url-polyfill/auto'
import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
```

**Step 5: Verify project runs**

```bash
npx expo start
```
Expected: Metro bundler starts, app loads on simulator/web.

**Step 6: Commit**

```bash
git init
git add -A
git commit -m "feat: scaffold Expo project with Supabase, Tamagui, Zustand"
```

---

## Task 2: Supabase Database Schema

**Files:**
- Create: `supabase/migrations/001_initial_schema.sql`

**Step 1: Create Supabase project**

Go to https://supabase.com, create a new project. Copy the URL and anon key to `.env.local`.

**Step 2: Write the migration SQL**

Create `supabase/migrations/001_initial_schema.sql`:

```sql
-- Enable extensions
create extension if not exists "uuid-ossp";

-- ============================================================
-- 1. Profiles
-- ============================================================
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

-- ============================================================
-- 2. Categories
-- ============================================================
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

-- ============================================================
-- 3. Transactions
-- ============================================================
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

-- ============================================================
-- 4. Budgets (monthly overall)
-- ============================================================
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

-- ============================================================
-- 5. Quick Templates
-- ============================================================
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

-- ============================================================
-- 6. Recurring Bills
-- ============================================================
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

-- ============================================================
-- 7. Indexes
-- ============================================================
create index idx_transactions_user_date on public.transactions (user_id, date desc);
create index idx_transactions_user_category on public.transactions (user_id, category_id);
create index idx_transactions_recurring_id on public.transactions (recurring_id) where recurring_id is not null;
create index idx_budgets_user_month on public.budgets (user_id, month desc);
create index idx_recurring_bills_due on public.recurring_bills (next_due_date) where is_active = true;
create index idx_categories_user_type on public.categories (user_id, type, sort_order);

-- ============================================================
-- 8. Updated-at trigger
-- ============================================================
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

-- ============================================================
-- 9. Row Level Security
-- ============================================================
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

-- ============================================================
-- 10. Seed default categories (via function, called after user sign-up)
-- ============================================================
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
```

**Step 3: Run migration in Supabase**

Go to Supabase Dashboard → SQL Editor → paste and run the migration.

**Step 4: Commit**

```bash
git add supabase/
git commit -m "feat: add Supabase database schema with RLS and seed categories"
```

---

## Task 3: TypeScript Types & Supabase Helpers

**Files:**
- Create: `types/database.ts`
- Create: `lib/api/transactions.ts`
- Create: `lib/api/categories.ts`
- Create: `lib/api/budgets.ts`
- Create: `lib/api/templates.ts`
- Create: `lib/api/recurring.ts`
- Create: `lib/api/stats.ts`

**Step 1: Define TypeScript types**

Create `types/database.ts`:
```typescript
export type TransactionType = 'income' | 'expense'
export type RecurrenceCycle = 'weekly' | 'monthly' | 'yearly'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  currency: string
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  user_id: string
  name: string
  type: TransactionType
  icon: string | null
  color: string | null
  sort_order: number
  is_default: boolean
  created_at: string
}

export interface Transaction {
  id: string
  user_id: string
  category_id: string | null
  type: TransactionType
  amount: number
  date: string
  notes: string | null
  is_recurring: boolean
  recurring_id: string | null
  created_at: string
  updated_at: string
  // Joined
  category?: Category
}

export interface Budget {
  id: string
  user_id: string
  month: string
  amount: number
  created_at: string
  updated_at: string
}

export interface QuickTemplate {
  id: string
  user_id: string
  category_id: string | null
  name: string
  type: TransactionType
  amount: number | null
  notes: string | null
  sort_order: number
  created_at: string
  category?: Category
}

export interface RecurringBill {
  id: string
  user_id: string
  category_id: string | null
  name: string
  amount: number
  cycle: RecurrenceCycle
  next_due_date: string
  reminder_days: number
  is_active: boolean
  created_at: string
  updated_at: string
  category?: Category
}
```

**Step 2: Create API helpers**

Create `lib/api/transactions.ts`:
```typescript
import { supabase } from '../supabase'
import type { Transaction } from '../../types/database'

export async function getTransactionsByMonth(year: number, month: number) {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const endDate = month === 12
    ? `${year + 1}-01-01`
    : `${year}-${String(month + 1).padStart(2, '0')}-01`

  const { data, error } = await supabase
    .from('transactions')
    .select('*, category:categories(*)')
    .gte('date', startDate)
    .lt('date', endDate)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as Transaction[]
}

export async function createTransaction(tx: {
  type: 'income' | 'expense'
  amount: number
  category_id: string
  date: string
  notes?: string
  is_recurring?: boolean
  recurring_id?: string
}) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('transactions')
    .insert({ ...tx, user_id: user.id })
    .select('*, category:categories(*)')
    .single()

  if (error) throw error
  return data as Transaction
}

export async function updateTransaction(id: string, updates: Partial<Transaction>) {
  const { data, error } = await supabase
    .from('transactions')
    .update(updates)
    .eq('id', id)
    .select('*, category:categories(*)')
    .single()

  if (error) throw error
  return data as Transaction
}

export async function deleteTransaction(id: string) {
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id)

  if (error) throw error
}
```

Create `lib/api/categories.ts`:
```typescript
import { supabase } from '../supabase'
import type { Category, TransactionType } from '../../types/database'

export async function getCategories(type?: TransactionType) {
  let query = supabase
    .from('categories')
    .select('*')
    .order('sort_order')

  if (type) query = query.eq('type', type)

  const { data, error } = await query
  if (error) throw error
  return data as Category[]
}

export async function createCategory(category: {
  name: string
  type: TransactionType
  icon?: string
  color?: string
}) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('categories')
    .insert({ ...category, user_id: user.id })
    .select()
    .single()

  if (error) throw error
  return data as Category
}

export async function updateCategory(id: string, updates: Partial<Category>) {
  const { data, error } = await supabase
    .from('categories')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Category
}

export async function deleteCategory(id: string) {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function reorderCategories(orderedIds: string[]) {
  const updates = orderedIds.map((id, index) => ({
    id,
    sort_order: index,
  }))

  for (const { id, sort_order } of updates) {
    await supabase.from('categories').update({ sort_order }).eq('id', id)
  }
}
```

Create `lib/api/budgets.ts`:
```typescript
import { supabase } from '../supabase'
import type { Budget } from '../../types/database'

export async function getBudget(year: number, month: number) {
  const monthDate = `${year}-${String(month).padStart(2, '0')}-01`

  const { data, error } = await supabase
    .from('budgets')
    .select('*')
    .eq('month', monthDate)
    .maybeSingle()

  if (error) throw error
  return data as Budget | null
}

export async function upsertBudget(year: number, month: number, amount: number) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const monthDate = `${year}-${String(month).padStart(2, '0')}-01`

  const { data, error } = await supabase
    .from('budgets')
    .upsert(
      { user_id: user.id, month: monthDate, amount },
      { onConflict: 'user_id,month' }
    )
    .select()
    .single()

  if (error) throw error
  return data as Budget
}
```

Create `lib/api/templates.ts`:
```typescript
import { supabase } from '../supabase'
import type { QuickTemplate } from '../../types/database'

export async function getTemplates() {
  const { data, error } = await supabase
    .from('quick_templates')
    .select('*, category:categories(*)')
    .order('sort_order')

  if (error) throw error
  return data as QuickTemplate[]
}

export async function createTemplate(template: {
  name: string
  type: 'income' | 'expense'
  category_id?: string
  amount?: number
  notes?: string
}) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('quick_templates')
    .insert({ ...template, user_id: user.id })
    .select('*, category:categories(*)')
    .single()

  if (error) throw error
  return data as QuickTemplate
}

export async function deleteTemplate(id: string) {
  const { error } = await supabase
    .from('quick_templates')
    .delete()
    .eq('id', id)

  if (error) throw error
}
```

Create `lib/api/recurring.ts`:
```typescript
import { supabase } from '../supabase'
import type { RecurringBill } from '../../types/database'

export async function getRecurringBills() {
  const { data, error } = await supabase
    .from('recurring_bills')
    .select('*, category:categories(*)')
    .eq('is_active', true)
    .order('next_due_date')

  if (error) throw error
  return data as RecurringBill[]
}

export async function getDueBills() {
  const today = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('recurring_bills')
    .select('*, category:categories(*)')
    .eq('is_active', true)
    .lte('next_due_date', today)

  if (error) throw error
  return data as RecurringBill[]
}

export async function createRecurringBill(bill: {
  name: string
  amount: number
  category_id?: string
  cycle: 'weekly' | 'monthly' | 'yearly'
  next_due_date: string
  reminder_days?: number
}) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('recurring_bills')
    .insert({ ...bill, user_id: user.id })
    .select('*, category:categories(*)')
    .single()

  if (error) throw error
  return data as RecurringBill
}

export async function advanceRecurringBill(id: string, currentDueDate: string, cycle: 'weekly' | 'monthly' | 'yearly') {
  const current = new Date(currentDueDate)
  let next: Date

  switch (cycle) {
    case 'weekly':
      next = new Date(current.setDate(current.getDate() + 7))
      break
    case 'monthly':
      next = new Date(current.setMonth(current.getMonth() + 1))
      break
    case 'yearly':
      next = new Date(current.setFullYear(current.getFullYear() + 1))
      break
  }

  const { data, error } = await supabase
    .from('recurring_bills')
    .update({ next_due_date: next.toISOString().split('T')[0] })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as RecurringBill
}

export async function deleteRecurringBill(id: string) {
  const { error } = await supabase
    .from('recurring_bills')
    .delete()
    .eq('id', id)

  if (error) throw error
}
```

Create `lib/api/stats.ts`:
```typescript
import { supabase } from '../supabase'

export interface MonthSummary {
  total_income: number
  total_expense: number
}

export interface CategoryBreakdown {
  category_id: string
  category_name: string
  category_icon: string
  category_color: string
  total: number
}

export async function getMonthSummary(year: number, month: number): Promise<MonthSummary> {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const endDate = month === 12
    ? `${year + 1}-01-01`
    : `${year}-${String(month + 1).padStart(2, '0')}-01`

  const { data, error } = await supabase.rpc('get_month_summary', {
    start_date: startDate,
    end_date: endDate,
  })

  if (error) throw error
  return data as MonthSummary
}

export async function getCategoryBreakdown(
  year: number,
  month: number,
  type: 'income' | 'expense'
): Promise<CategoryBreakdown[]> {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const endDate = month === 12
    ? `${year + 1}-01-01`
    : `${year}-${String(month + 1).padStart(2, '0')}-01`

  const { data, error } = await supabase.rpc('get_category_breakdown', {
    start_date: startDate,
    end_date: endDate,
    tx_type: type,
  })

  if (error) throw error
  return data as CategoryBreakdown[]
}

export async function getDailyTrend(year: number, month: number) {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const endDate = month === 12
    ? `${year + 1}-01-01`
    : `${year}-${String(month + 1).padStart(2, '0')}-01`

  const { data, error } = await supabase.rpc('get_daily_trend', {
    start_date: startDate,
    end_date: endDate,
  })

  if (error) throw error
  return data as { date: string; income: number; expense: number }[]
}
```

**Step 3: Add Supabase RPC functions for stats**

Add to `supabase/migrations/002_stats_functions.sql`:
```sql
-- Month summary (total income & expense)
create or replace function public.get_month_summary(start_date date, end_date date)
returns json language sql stable security definer as $$
  select json_build_object(
    'total_income', coalesce(sum(case when type = 'income' then amount end), 0),
    'total_expense', coalesce(sum(case when type = 'expense' then amount end), 0)
  )
  from public.transactions
  where user_id = auth.uid()
    and date >= start_date
    and date < end_date;
$$;

-- Category breakdown
create or replace function public.get_category_breakdown(start_date date, end_date date, tx_type text)
returns json language sql stable security definer as $$
  select coalesce(json_agg(row_to_json(t)), '[]'::json)
  from (
    select
      c.id as category_id,
      c.name as category_name,
      c.icon as category_icon,
      c.color as category_color,
      sum(t.amount) as total
    from public.transactions t
    join public.categories c on c.id = t.category_id
    where t.user_id = auth.uid()
      and t.date >= start_date
      and t.date < end_date
      and t.type = tx_type
    group by c.id, c.name, c.icon, c.color
    order by total desc
  ) t;
$$;

-- Daily trend
create or replace function public.get_daily_trend(start_date date, end_date date)
returns json language sql stable security definer as $$
  select coalesce(json_agg(row_to_json(t) order by t.date), '[]'::json)
  from (
    select
      date,
      coalesce(sum(case when type = 'income' then amount end), 0) as income,
      coalesce(sum(case when type = 'expense' then amount end), 0) as expense
    from public.transactions
    where user_id = auth.uid()
      and date >= start_date
      and date < end_date
    group by date
  ) t;
$$;
```

**Step 4: Commit**

```bash
git add types/ lib/ supabase/
git commit -m "feat: add TypeScript types, API helpers, and stats RPC functions"
```

---

## Task 4: Zustand Stores

**Files:**
- Create: `stores/useAuthStore.ts`
- Create: `stores/useTransactionStore.ts`
- Create: `stores/useCategoryStore.ts`
- Create: `stores/useBudgetStore.ts`
- Create: `stores/useSettingsStore.ts`

**Step 1: Create auth store**

Create `stores/useAuthStore.ts`:
```typescript
import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { Profile } from '../types/database'
import type { Session } from '@supabase/supabase-js'

interface AuthState {
  session: Session | null
  profile: Profile | null
  loading: boolean
  setSession: (session: Session | null) => void
  setProfile: (profile: Profile | null) => void
  fetchProfile: () => Promise<void>
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  session: null,
  profile: null,
  loading: true,

  setSession: (session) => set({ session, loading: false }),

  setProfile: (profile) => set({ profile }),

  fetchProfile: async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (data) set({ profile: data })
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ session: null, profile: null })
  },
}))
```

**Step 2: Create transaction store**

Create `stores/useTransactionStore.ts`:
```typescript
import { create } from 'zustand'
import type { Transaction } from '../types/database'
import * as api from '../lib/api/transactions'

interface TransactionState {
  transactions: Transaction[]
  currentYear: number
  currentMonth: number
  loading: boolean
  setMonth: (year: number, month: number) => void
  fetchTransactions: () => Promise<void>
  addTransaction: (tx: Parameters<typeof api.createTransaction>[0]) => Promise<Transaction>
  removeTransaction: (id: string) => Promise<void>
}

const now = new Date()

export const useTransactionStore = create<TransactionState>()((set, get) => ({
  transactions: [],
  currentYear: now.getFullYear(),
  currentMonth: now.getMonth() + 1,
  loading: false,

  setMonth: (year, month) => {
    set({ currentYear: year, currentMonth: month })
    get().fetchTransactions()
  },

  fetchTransactions: async () => {
    set({ loading: true })
    try {
      const { currentYear, currentMonth } = get()
      const data = await api.getTransactionsByMonth(currentYear, currentMonth)
      set({ transactions: data })
    } finally {
      set({ loading: false })
    }
  },

  addTransaction: async (tx) => {
    const created = await api.createTransaction(tx)
    const { transactions } = get()
    set({ transactions: [created, ...transactions] })
    return created
  },

  removeTransaction: async (id) => {
    await api.deleteTransaction(id)
    set({ transactions: get().transactions.filter((t) => t.id !== id) })
  },
}))
```

**Step 3: Create category store**

Create `stores/useCategoryStore.ts`:
```typescript
import { create } from 'zustand'
import type { Category, TransactionType } from '../types/database'
import * as api from '../lib/api/categories'

interface CategoryState {
  expenseCategories: Category[]
  incomeCategories: Category[]
  loading: boolean
  fetchCategories: () => Promise<void>
  addCategory: (cat: { name: string; type: TransactionType; icon?: string; color?: string }) => Promise<void>
  removeCategory: (id: string) => Promise<void>
  reorder: (type: TransactionType, orderedIds: string[]) => Promise<void>
}

export const useCategoryStore = create<CategoryState>()((set, get) => ({
  expenseCategories: [],
  incomeCategories: [],
  loading: false,

  fetchCategories: async () => {
    set({ loading: true })
    try {
      const all = await api.getCategories()
      set({
        expenseCategories: all.filter((c) => c.type === 'expense'),
        incomeCategories: all.filter((c) => c.type === 'income'),
      })
    } finally {
      set({ loading: false })
    }
  },

  addCategory: async (cat) => {
    await api.createCategory(cat)
    await get().fetchCategories()
  },

  removeCategory: async (id) => {
    await api.deleteCategory(id)
    await get().fetchCategories()
  },

  reorder: async (type, orderedIds) => {
    await api.reorderCategories(orderedIds)
    await get().fetchCategories()
  },
}))
```

**Step 4: Create budget store**

Create `stores/useBudgetStore.ts`:
```typescript
import { create } from 'zustand'
import type { Budget } from '../types/database'
import * as api from '../lib/api/budgets'

interface BudgetState {
  budget: Budget | null
  loading: boolean
  fetchBudget: (year: number, month: number) => Promise<void>
  setBudget: (year: number, month: number, amount: number) => Promise<void>
}

export const useBudgetStore = create<BudgetState>()((set) => ({
  budget: null,
  loading: false,

  fetchBudget: async (year, month) => {
    set({ loading: true })
    try {
      const data = await api.getBudget(year, month)
      set({ budget: data })
    } finally {
      set({ loading: false })
    }
  },

  setBudget: async (year, month, amount) => {
    const data = await api.upsertBudget(year, month, amount)
    set({ budget: data })
  },
}))
```

**Step 5: Create settings store (with persistence)**

Create `stores/useSettingsStore.ts`:
```typescript
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

interface SettingsState {
  theme: 'light' | 'dark'
  toggleTheme: () => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      toggleTheme: () => set({ theme: get().theme === 'light' ? 'dark' : 'light' }),
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)
```

**Step 6: Commit**

```bash
git add stores/
git commit -m "feat: add Zustand stores for auth, transactions, categories, budget, settings"
```

---

## Task 5: App Layout & Navigation (Expo Router)

**Files:**
- Create: `app/_layout.tsx` (root layout with providers)
- Create: `app/(auth)/login.tsx`
- Create: `app/(auth)/register.tsx`
- Create: `app/(auth)/_layout.tsx`
- Create: `app/(tabs)/_layout.tsx`
- Create: `app/(tabs)/index.tsx` (首页)
- Create: `app/(tabs)/stats.tsx` (统计)
- Create: `app/(tabs)/bills.tsx` (账单)
- Create: `app/(tabs)/profile.tsx` (我的)

**Step 1: Root layout with auth + providers**

Create `app/_layout.tsx`:
```tsx
import { useEffect } from 'react'
import { Slot, useRouter, useSegments } from 'expo-router'
import { TamaguiProvider, Theme } from 'tamagui'
import { tamaguiConfig } from '../tamagui.config'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/useAuthStore'
import { useSettingsStore } from '../stores/useSettingsStore'

export default function RootLayout() {
  const router = useRouter()
  const segments = useSegments()
  const { session, setSession } = useAuthStore()
  const theme = useSettingsStore((s) => s.theme)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const inAuthGroup = segments[0] === '(auth)'
    if (!session && !inAuthGroup) {
      router.replace('/(auth)/login')
    } else if (session && inAuthGroup) {
      router.replace('/(tabs)')
    }
  }, [session, segments])

  return (
    <TamaguiProvider config={tamaguiConfig} defaultTheme={theme}>
      <Theme name={theme}>
        <Slot />
      </Theme>
    </TamaguiProvider>
  )
}
```

**Step 2: Auth layout**

Create `app/(auth)/_layout.tsx`:
```tsx
import { Stack } from 'expo-router'

export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />
}
```

**Step 3: Tabs layout**

Create `app/(tabs)/_layout.tsx`:
```tsx
import { Tabs } from 'expo-router'

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen
        name="index"
        options={{ title: '首页', tabBarIcon: () => null /* TODO: add icons */ }}
      />
      <Tabs.Screen
        name="stats"
        options={{ title: '统计' }}
      />
      <Tabs.Screen
        name="bills"
        options={{ title: '账单' }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: '我的' }}
      />
    </Tabs>
  )
}
```

**Step 4: Create placeholder screens**

Create each tab screen (`app/(tabs)/index.tsx`, `stats.tsx`, `bills.tsx`, `profile.tsx`) with placeholder content:
```tsx
import { YStack, Text } from 'tamagui'

export default function HomeScreen() {
  return (
    <YStack flex={1} alignItems="center" justifyContent="center">
      <Text>首页</Text>
    </YStack>
  )
}
```

Create auth screens (`app/(auth)/login.tsx`, `register.tsx`) with similar placeholders.

**Step 5: Verify navigation works**

```bash
npx expo start
```
Expected: App redirects to login screen. Tab navigation structure loads after login.

**Step 6: Commit**

```bash
git add app/
git commit -m "feat: add Expo Router layout with auth guard and tab navigation"
```

---

## Task 6: Auth Screens (Login & Register)

**Files:**
- Modify: `app/(auth)/login.tsx`
- Modify: `app/(auth)/register.tsx`

**Step 1: Build login screen**

`app/(auth)/login.tsx`:
```tsx
import { useState } from 'react'
import { YStack, XStack, Input, Button, Text, H2 } from 'tamagui'
import { useRouter } from 'expo-router'
import { supabase } from '../../lib/supabase'

export default function LoginScreen() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async () => {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    setLoading(false)
  }

  return (
    <YStack flex={1} padding="$4" justifyContent="center" gap="$3">
      <H2 textAlign="center">开销记录</H2>
      {error ? <Text color="$red10">{error}</Text> : null}
      <Input placeholder="邮箱" value={email} onChangeText={setEmail} autoCapitalize="none" />
      <Input placeholder="密码" value={password} onChangeText={setPassword} secureTextEntry />
      <Button onPress={handleLogin} disabled={loading} theme="active">
        {loading ? '登录中...' : '登录'}
      </Button>
      <Button variant="outlined" onPress={() => router.push('/(auth)/register')}>
        注册账号
      </Button>
    </YStack>
  )
}
```

**Step 2: Build register screen** (similar structure with `supabase.auth.signUp`)

**Step 3: Test auth flow**

**Step 4: Commit**

```bash
git add app/(auth)/
git commit -m "feat: add login and register screens with Supabase auth"
```

---

## Task 7: Home Screen (首页)

**Files:**
- Modify: `app/(tabs)/index.tsx`
- Create: `components/BudgetProgressBar.tsx`
- Create: `components/DueBillCard.tsx`
- Create: `components/TransactionList.tsx`
- Create: `components/TransactionItem.tsx`
- Create: `components/FloatingAddButton.tsx`
- Create: `components/MonthSelector.tsx`

**Step 1: Build MonthSelector** (left/right arrows or swipe to change month)

**Step 2: Build BudgetProgressBar** (shows ¥spent / ¥budget, bar turns red when over)

**Step 3: Build DueBillCard** (shows pending recurring bills, tap to jump to add screen with prefilled data)

**Step 4: Build TransactionItem** (single row: icon + category name + notes + amount)

**Step 5: Build TransactionList** (SectionList grouped by date)

**Step 6: Build FloatingAddButton** (absolute positioned circle button, bottom-right)

**Step 7: Assemble HomeScreen**

```tsx
import { useEffect } from 'react'
import { YStack } from 'tamagui'
import { useRouter } from 'expo-router'
import { MonthSelector } from '../../components/MonthSelector'
import { BudgetProgressBar } from '../../components/BudgetProgressBar'
import { DueBillCard } from '../../components/DueBillCard'
import { TransactionList } from '../../components/TransactionList'
import { FloatingAddButton } from '../../components/FloatingAddButton'
import { useTransactionStore } from '../../stores/useTransactionStore'
import { useBudgetStore } from '../../stores/useBudgetStore'

export default function HomeScreen() {
  const router = useRouter()
  const { currentYear, currentMonth, setMonth, fetchTransactions, transactions } = useTransactionStore()
  const { fetchBudget, budget } = useBudgetStore()

  useEffect(() => {
    fetchTransactions()
    fetchBudget(currentYear, currentMonth)
  }, [currentYear, currentMonth])

  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)

  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)

  return (
    <YStack flex={1}>
      <MonthSelector
        year={currentYear}
        month={currentMonth}
        onChangeMonth={setMonth}
        totalExpense={totalExpense}
        totalIncome={totalIncome}
      />
      <BudgetProgressBar spent={totalExpense} budget={budget?.amount ?? 0} />
      <DueBillCard />
      <TransactionList transactions={transactions} />
      <FloatingAddButton onPress={() => router.push('/add')} />
    </YStack>
  )
}
```

**Step 8: Commit**

```bash
git add app/(tabs)/index.tsx components/
git commit -m "feat: build home screen with budget bar, due bills, transaction list"
```

---

## Task 8: Add Transaction Screen (记账页)

**Files:**
- Create: `app/add.tsx`
- Create: `components/CategoryGrid.tsx`
- Create: `components/NumericKeypad.tsx`
- Create: `components/TemplateList.tsx`

**Step 1: Build CategoryGrid** (icon grid, tappable, selected state highlighted)

**Step 2: Build NumericKeypad** (calculator-style: 0-9, dot, backspace, +, -, confirm)

**Step 3: Build TemplateList** (horizontal scroll of saved templates)

**Step 4: Assemble AddScreen**

Layout top-to-bottom:
- Tab bar: 支出 | 收入 | 常用
- If 支出/收入 tab: CategoryGrid → notes input + date picker → NumericKeypad
- If 常用 tab: TemplateList (tap to prefill and switch to category tab)
- Confirm button creates transaction, shows toast, stays on page

**Step 5: Test adding transactions**

**Step 6: Commit**

```bash
git add app/add.tsx components/
git commit -m "feat: add transaction screen with category grid, keypad, templates"
```

---

## Task 9: Transaction Detail Screen

**Files:**
- Create: `app/transaction/[id].tsx`

**Step 1: Build detail screen**

Shows: amount (large), category icon+name, date, notes, created_at.
Bottom: Edit button → navigates to add screen pre-filled. Delete button → confirmation dialog → delete → go back.

**Step 2: Commit**

```bash
git add app/transaction/
git commit -m "feat: add transaction detail screen with edit and delete"
```

---

## Task 10: Statistics Screen (统计页)

**Files:**
- Modify: `app/(tabs)/stats.tsx`
- Create: `components/charts/ExpenseTrendChart.tsx`
- Create: `components/charts/CategoryPieChart.tsx`
- Create: `components/charts/IncomeExpenseBarChart.tsx`
- Create: `components/charts/BudgetProgressChart.tsx`

**Step 1: Build ExpenseTrendChart** (daily expense line chart using gifted-charts LineChart)

**Step 2: Build CategoryPieChart** (expense breakdown using gifted-charts PieChart)

**Step 3: Build IncomeExpenseBarChart** (side-by-side bars using gifted-charts BarChart)

**Step 4: Build BudgetProgressChart** (simple progress bar with percentage)

**Step 5: Assemble StatsScreen**

Top: 周 | 月 | 年 tab
Below: 4 chart tabs (trend / category / income-vs-expense / budget)

**Step 6: Commit**

```bash
git add app/(tabs)/stats.tsx components/charts/
git commit -m "feat: add statistics screen with 4 chart types"
```

---

## Task 11: Bills Screen (账单页)

**Files:**
- Modify: `app/(tabs)/bills.tsx`

Full history of all transactions, searchable, filterable by type/category/date range.

**Step 1: Build bills screen** with FlatList, search bar, filter chips

**Step 2: Commit**

```bash
git add app/(tabs)/bills.tsx
git commit -m "feat: add bills history screen with search and filters"
```

---

## Task 12: Profile Screen (我的)

**Files:**
- Modify: `app/(tabs)/profile.tsx`
- Create: `app/settings/budget.tsx`
- Create: `app/settings/categories.tsx`
- Create: `app/settings/recurring.tsx`
- Create: `app/settings/templates.tsx`

**Step 1: Build profile screen** (menu list: budget, categories, recurring, templates, theme toggle, logout)

**Step 2: Build budget setting screen** (input for monthly budget amount, save)

**Step 3: Build categories management screen** (list with drag-to-reorder, delete, add new)

**Step 4: Build recurring bills management screen** (list, add/delete, edit cycle & amount)

**Step 5: Build templates management screen** (list, add/delete)

**Step 6: Commit**

```bash
git add app/(tabs)/profile.tsx app/settings/
git commit -m "feat: add profile screen and settings pages"
```

---

## Task 13: Dark Mode & Theme Polish

**Files:**
- Modify: `app/_layout.tsx`
- Modify: `tamagui.config.ts` (custom tokens if needed)

**Step 1: Wire theme toggle** to Tamagui's Theme provider using useSettingsStore

**Step 2: Verify all screens look correct** in both light and dark mode

**Step 3: Add proper tab bar icons** (using @expo/vector-icons)

**Step 4: Polish spacing, colors, typography** across all screens

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add dark mode support and UI polish"
```

---

## Task 14: Realtime Sync

**Files:**
- Modify: `stores/useTransactionStore.ts`

**Step 1: Add Supabase realtime subscription**

```typescript
// In the store or a hook
supabase
  .channel('transactions')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => {
    fetchTransactions() // re-fetch on any change from another device
  })
  .subscribe()
```

**Step 2: Test** by adding a transaction from web while viewing on mobile

**Step 3: Commit**

```bash
git add stores/
git commit -m "feat: add realtime sync for multi-device support"
```

---

## Task 15: Testing & Final QA

**Step 1: Test all auth flows** (register, login, logout, session persistence)

**Step 2: Test CRUD** (add/edit/delete transactions, categories, templates, recurring bills)

**Step 3: Test budget** (set budget, verify progress bar, verify red state on overspend)

**Step 4: Test statistics** (verify charts render correctly with data)

**Step 5: Test recurring bills** (verify due bills appear on home, mark as recorded)

**Step 6: Test dark mode** (toggle, verify all screens)

**Step 7: Test multi-device sync** (add on web, see on mobile)

**Step 8: Final commit**

```bash
git add -A
git commit -m "chore: final QA polish and fixes"
```

---

## Summary

| Task | Description | Estimated Steps |
|------|-------------|----------------|
| 1 | Project scaffolding | 6 |
| 2 | Database schema | 4 |
| 3 | Types & API helpers | 4 |
| 4 | Zustand stores | 6 |
| 5 | App layout & navigation | 6 |
| 6 | Auth screens | 4 |
| 7 | Home screen | 8 |
| 8 | Add transaction screen | 6 |
| 9 | Transaction detail | 2 |
| 10 | Statistics screen | 6 |
| 11 | Bills screen | 2 |
| 12 | Profile & settings | 6 |
| 13 | Dark mode & polish | 5 |
| 14 | Realtime sync | 3 |
| 15 | Testing & QA | 8 |
