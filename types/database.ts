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
