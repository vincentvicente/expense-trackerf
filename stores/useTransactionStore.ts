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
