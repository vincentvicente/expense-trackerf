import { useState, useEffect, useMemo } from 'react'
import { View, Text, TextInput, TouchableOpacity, SectionList, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../../lib/supabase'
import { TransactionItem } from '../../components/TransactionItem'
import type { Transaction } from '../../types/database'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'

dayjs.locale('zh-cn')

type FilterType = 'all' | 'expense' | 'income'

const FILTER_LABELS: Record<FilterType, string> = {
  all: '全部',
  expense: '支出',
  income: '收入',
}

export default function BillsScreen() {
  const router = useRouter()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterType>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAllTransactions()
  }, [])

  const loadAllTransactions = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('transactions')
      .select('*, category:categories(*)')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(500)

    if (!error && data) setTransactions(data as Transaction[])
    setLoading(false)
  }

  // Filter and search
  const filtered = useMemo(() => {
    let result = transactions
    if (filter !== 'all') result = result.filter(t => t.type === filter)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      result = result.filter(
        t =>
          t.notes?.toLowerCase().includes(q) ||
          t.category?.name?.toLowerCase().includes(q),
      )
    }
    return result
  }, [transactions, filter, search])

  // Group by date into sections
  const sections = useMemo(() => {
    const groups: Record<string, Transaction[]> = {}
    filtered.forEach(t => {
      const key = t.date
      if (!groups[key]) groups[key] = []
      groups[key].push(t)
    })
    return Object.keys(groups)
      .sort((a, b) => b.localeCompare(a))
      .map(date => ({
        title: dayjs(date).format('M月D日 dddd'),
        data: groups[date],
      }))
  }, [filtered])

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>账单</Text>

      {/* Search bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={18} color="#9ca3af" />
        <TextInput
          style={styles.searchInput}
          placeholder="搜索备注..."
          value={search}
          onChangeText={setSearch}
          placeholderTextColor="#9ca3af"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color="#9ca3af" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter chips */}
      <View style={styles.filters}>
        {(['all', 'expense', 'income'] as FilterType[]).map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.chip, filter === f && styles.activeChip]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.chipText, filter === f && styles.activeChipText]}>
              {FILTER_LABELS[f]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Transaction list */}
      <SectionList
        sections={sections}
        keyExtractor={item => item.id}
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionHeader}>{section.title}</Text>
        )}
        renderItem={({ item }) => (
          <TransactionItem
            transaction={item}
            onPress={(id) => router.push(`/transaction/${id}`)}
          />
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {loading ? '加载中...' : '暂无账单记录'}
          </Text>
        }
        stickySectionHeadersEnabled={false}
        contentContainerStyle={sections.length === 0 ? styles.emptyContainer : undefined}
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
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    marginHorizontal: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
    marginLeft: 8,
    paddingVertical: 0,
  },
  filters: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
  },
  activeChip: {
    backgroundColor: '#3b82f6',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  activeChipText: {
    color: '#ffffff',
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: '#ffffff',
  },
  empty: {
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 15,
    marginTop: 60,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
})
