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
