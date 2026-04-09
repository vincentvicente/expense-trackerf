import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import type { Transaction } from '../types/database'

interface TransactionItemProps {
  transaction: Transaction
  onPress: (id: string) => void
}

export function TransactionItem({ transaction, onPress }: TransactionItemProps) {
  const isExpense = transaction.type === 'expense'
  const icon = transaction.category?.icon ?? (isExpense ? '💰' : '📥')
  const color = transaction.category?.color ?? (isExpense ? '#ef4444' : '#22c55e')
  const categoryName = transaction.category?.name ?? (isExpense ? '支出' : '收入')
  const amountText = isExpense
    ? `-¥${Number(transaction.amount).toFixed(2)}`
    : `+¥${Number(transaction.amount).toFixed(2)}`

  return (
    <TouchableOpacity style={styles.container} onPress={() => onPress(transaction.id)}>
      <View style={[styles.iconCircle, { backgroundColor: color + '20' }]}>
        <Text style={styles.iconText}>{icon}</Text>
      </View>
      <View style={styles.middle}>
        <Text style={styles.categoryName}>{categoryName}</Text>
        {transaction.notes ? <Text style={styles.notes} numberOfLines={1}>{transaction.notes}</Text> : null}
      </View>
      <Text style={[styles.amount, { color: isExpense ? '#ef4444' : '#22c55e' }]}>
        {amountText}
      </Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 20,
  },
  middle: {
    flex: 1,
    marginLeft: 12,
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  notes: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 2,
  },
  amount: {
    fontSize: 16,
    fontWeight: '600',
  },
})
