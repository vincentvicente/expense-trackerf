import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/useAuthStore'
import { useTransactionStore } from '../stores/useTransactionStore'
import { useCategoryStore } from '../stores/useCategoryStore'
import { useBudgetStore } from '../stores/useBudgetStore'

/**
 * Subscribes to Supabase realtime changes on transactions, categories, and budgets.
 * Automatically refetches data when changes are detected from other devices/sessions.
 *
 * NOTE: Realtime must be enabled per table in the Supabase dashboard.
 * Go to Database > Replication and enable realtime for: transactions, categories, budgets.
 */
export function useRealtimeSync() {
  const session = useAuthStore((s) => s.session)
  const fetchTransactions = useTransactionStore((s) => s.fetchTransactions)
  const currentYear = useTransactionStore((s) => s.currentYear)
  const currentMonth = useTransactionStore((s) => s.currentMonth)
  const fetchCategories = useCategoryStore((s) => s.fetchCategories)
  const fetchBudget = useBudgetStore((s) => s.fetchBudget)

  useEffect(() => {
    if (!session) return

    const channel = supabase
      .channel('db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions' },
        () => {
          fetchTransactions()
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'categories' },
        () => {
          fetchCategories()
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'budgets' },
        () => {
          fetchBudget(currentYear, currentMonth)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [session, currentYear, currentMonth, fetchTransactions, fetchCategories, fetchBudget])
}
