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
