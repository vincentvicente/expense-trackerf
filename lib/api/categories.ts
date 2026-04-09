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
