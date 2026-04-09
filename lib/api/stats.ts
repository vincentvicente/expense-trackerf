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
