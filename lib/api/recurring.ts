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
