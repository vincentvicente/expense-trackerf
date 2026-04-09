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
