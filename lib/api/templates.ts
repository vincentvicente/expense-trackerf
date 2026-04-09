import { supabase } from '../supabase'
import type { QuickTemplate } from '../../types/database'

export async function getTemplates() {
  const { data, error } = await supabase
    .from('quick_templates')
    .select('*, category:categories(*)')
    .order('sort_order')

  if (error) throw error
  return data as QuickTemplate[]
}

export async function createTemplate(template: {
  name: string
  type: 'income' | 'expense'
  category_id?: string
  amount?: number
  notes?: string
}) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('quick_templates')
    .insert({ ...template, user_id: user.id })
    .select('*, category:categories(*)')
    .single()

  if (error) throw error
  return data as QuickTemplate
}

export async function deleteTemplate(id: string) {
  const { error } = await supabase
    .from('quick_templates')
    .delete()
    .eq('id', id)

  if (error) throw error
}
