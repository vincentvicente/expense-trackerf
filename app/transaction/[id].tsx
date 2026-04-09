import { useEffect, useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../../lib/supabase'
import { useTransactionStore } from '../../stores/useTransactionStore'
import type { Transaction } from '../../types/database'
import dayjs from 'dayjs'

export default function TransactionDetailScreen() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const { removeTransaction } = useTransactionStore()
  const [transaction, setTransaction] = useState<Transaction | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTransaction()
  }, [id])

  const loadTransaction = async () => {
    if (!id) {
      setLoading(false)
      return
    }
    const { data, error } = await supabase
      .from('transactions')
      .select('*, category:categories(*)')
      .eq('id', id)
      .single()

    if (!error && data) setTransaction(data as Transaction)
    setLoading(false)
  }

  const handleDelete = () => {
    Alert.alert('确认删除', '确定要删除这笔记录吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          if (!id) return
          await removeTransaction(id)
          router.back()
        },
      },
    ])
  }

  const handleEdit = () => {
    if (!transaction) return
    router.push({
      pathname: '/add',
      params: {
        prefill_category_id: transaction.category_id ?? '',
        prefill_amount: String(transaction.amount),
        prefill_notes: transaction.notes ?? '',
        prefill_type: transaction.type,
      },
    })
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      </SafeAreaView>
    )
  }

  if (!transaction) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>账单详情</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.centered}>
          <Text style={styles.notFoundText}>记录不存在</Text>
        </View>
      </SafeAreaView>
    )
  }

  const isExpense = transaction.type === 'expense'
  const amountColor = isExpense ? '#ef4444' : '#22c55e'
  const amountPrefix = isExpense ? '-¥' : '+¥'
  const categoryIcon = transaction.category?.icon ?? '📦'
  const categoryName = transaction.category?.name ?? '未分类'

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>账单详情</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Category icon & amount */}
      <View style={styles.heroSection}>
        <Text style={styles.heroIcon}>{categoryIcon}</Text>
        <Text style={styles.heroCategory}>{categoryName}</Text>
        <Text style={[styles.heroAmount, { color: amountColor }]}>
          {amountPrefix}
          {transaction.amount.toFixed(2)}
        </Text>
      </View>

      {/* Detail rows */}
      <View style={styles.detailCard}>
        <DetailRow label="分类" value={categoryName} />
        <DetailRow
          label="日期"
          value={dayjs(transaction.date).format('YYYY年M月D日')}
        />
        <DetailRow label="备注" value={transaction.notes || '无'} />
        <DetailRow
          label="创建"
          value={dayjs(transaction.created_at).format('YYYY-MM-DD HH:mm')}
          isLast
        />
      </View>

      {/* Action buttons */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.editBtn} onPress={handleEdit}>
          <Text style={styles.editBtnText}>编辑</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
          <Text style={styles.deleteBtnText}>删除</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

function DetailRow({
  label,
  value,
  isLast = false,
}: {
  label: string
  value: string
  isLast?: boolean
}) {
  return (
    <View style={[styles.detailRow, !isLast && styles.detailRowBorder]}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e5e5',
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
  },
  headerRight: {
    width: 32,
  },
  notFoundText: {
    fontSize: 16,
    color: '#999',
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#fff',
  },
  heroIcon: {
    fontSize: 48,
  },
  heroCategory: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  heroAmount: {
    fontSize: 36,
    fontWeight: '700',
    marginTop: 12,
  },
  detailCard: {
    backgroundColor: '#fff',
    marginTop: 12,
    marginHorizontal: 16,
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  detailRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e5e5',
  },
  detailLabel: {
    fontSize: 15,
    color: '#999',
  },
  detailValue: {
    fontSize: 15,
    color: '#333',
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 32,
    gap: 12,
  },
  editBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#6366f1',
    alignItems: 'center',
  },
  editBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366f1',
  },
  deleteBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#ef4444',
    alignItems: 'center',
  },
  deleteBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
})
