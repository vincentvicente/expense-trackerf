import { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Alert } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { CategoryGrid } from '../components/CategoryGrid'
import { NumericKeypad } from '../components/NumericKeypad'
import { TemplateList } from '../components/TemplateList'
import { useCategoryStore } from '../stores/useCategoryStore'
import { useTransactionStore } from '../stores/useTransactionStore'
import { useThemeColors } from '../hooks/useThemeColors'
import { getTemplates } from '../lib/api/templates'
import type { QuickTemplate } from '../types/database'
import dayjs from 'dayjs'

type TabType = 'expense' | 'income' | 'template'

export default function AddScreen() {
  const router = useRouter()
  const { colors, isDark } = useThemeColors()
  const params = useLocalSearchParams<{
    prefill_category_id?: string
    prefill_amount?: string
    prefill_notes?: string
    prefill_type?: string
    prefill_recurring_id?: string
  }>()

  const { expenseCategories, incomeCategories, fetchCategories } = useCategoryStore()
  const { addTransaction } = useTransactionStore()

  const [activeTab, setActiveTab] = useState<TabType>(
    params.prefill_type === 'income' ? 'income' : 'expense'
  )
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    params.prefill_category_id ?? null
  )
  const [amount, setAmount] = useState(params.prefill_amount ?? '')
  const [notes, setNotes] = useState(params.prefill_notes ?? '')
  const [date] = useState(dayjs().format('YYYY-MM-DD'))
  const [templates, setTemplates] = useState<QuickTemplate[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchCategories()
    getTemplates().then(setTemplates).catch(() => {})
  }, [])

  // Auto-select first category if none selected
  useEffect(() => {
    if (!selectedCategoryId && activeTab !== 'template') {
      const cats = activeTab === 'expense' ? expenseCategories : incomeCategories
      if (cats.length > 0) setSelectedCategoryId(cats[0].id)
    }
  }, [activeTab, expenseCategories, incomeCategories, selectedCategoryId])

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab)
    if (tab !== 'template') {
      // Reset selection when switching between expense/income
      setSelectedCategoryId(null)
    }
  }

  const handleTemplateSelect = (template: QuickTemplate) => {
    const tab = template.type === 'income' ? 'income' : 'expense'
    setActiveTab(tab)
    if (template.category_id) setSelectedCategoryId(template.category_id)
    if (template.amount != null) setAmount(String(template.amount))
    if (template.notes) setNotes(template.notes)
  }

  const handleConfirm = async () => {
    const numAmount = parseFloat(amount)
    if (!numAmount || numAmount <= 0) {
      Alert.alert('提示', '请输入有效金额')
      return
    }
    if (!selectedCategoryId) {
      Alert.alert('提示', '请选择分类')
      return
    }

    setSaving(true)
    try {
      const type = activeTab === 'template' ? 'expense' : activeTab
      await addTransaction({
        type,
        amount: numAmount,
        category_id: selectedCategoryId,
        date,
        notes: notes || undefined,
        is_recurring: !!params.prefill_recurring_id,
        recurring_id: params.prefill_recurring_id || undefined,
      })
      // Reset for next entry (stay on page for continuous recording)
      setAmount('')
      setNotes('')
      setSelectedCategoryId(null)
      Alert.alert('成功', '记录已保存')
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : '保存失败'
      Alert.alert('错误', message)
    } finally {
      setSaving(false)
    }
  }

  const categories = activeTab === 'income' ? incomeCategories : expenseCategories

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>记一笔</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Tabs: 支出 | 收入 | 常用 */}
      <View style={[styles.tabs, { borderBottomColor: colors.border }]}>
        {(['expense', 'income', 'template'] as TabType[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => handleTabChange(tab)}
          >
            <Text style={[styles.tabText, { color: colors.textSecondary }, activeTab === tab && styles.activeTabText]}>
              {tab === 'expense' ? '支出' : tab === 'income' ? '收入' : '常用'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {activeTab === 'template' ? (
          <TemplateList templates={templates} onSelect={handleTemplateSelect} />
        ) : (
          <CategoryGrid
            categories={categories}
            selectedId={selectedCategoryId}
            onSelect={setSelectedCategoryId}
          />
        )}
      </View>

      {/* Notes + Date row */}
      <View style={[styles.metaRow, { borderTopColor: colors.border }]}>
        <TextInput
          style={[styles.notesInput, { color: colors.text }]}
          placeholder="添加备注..."
          value={notes}
          onChangeText={setNotes}
          placeholderTextColor={colors.textSecondary}
        />
        <TouchableOpacity style={[styles.dateButton, { backgroundColor: isDark ? '#1f2937' : '#f3f4f6' }]}>
          <Text style={[styles.dateText, { color: colors.textSecondary }]}>{dayjs(date).format('M月D日')}</Text>
        </TouchableOpacity>
      </View>

      {/* Numeric Keypad */}
      <NumericKeypad
        value={amount}
        onValueChange={setAmount}
        onConfirm={handleConfirm}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1f2937',
  },
  headerSpacer: {
    width: 24,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#3b82f6',
  },
  tabText: {
    fontSize: 15,
    color: '#9ca3af',
  },
  activeTabText: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e5e7eb',
  },
  notesInput: {
    flex: 1,
    fontSize: 14,
    color: '#1f2937',
    paddingVertical: 4,
  },
  dateButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    marginLeft: 10,
  },
  dateText: {
    fontSize: 13,
    color: '#374151',
  },
})
