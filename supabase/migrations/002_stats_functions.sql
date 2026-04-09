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
