import { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { getDueBills } from '../lib/api/recurring'
import type { RecurringBill } from '../types/database'

export function DueBillCard() {
  const router = useRouter()
  const [bills, setBills] = useState<RecurringBill[]>([])

  useEffect(() => {
    getDueBills()
      .then(setBills)
      .catch(() => setBills([]))
  }, [])

  if (bills.length === 0) return null

  const handlePressBill = (bill: RecurringBill) => {
    router.push({
      pathname: '/add',
      params: {
        amount: String(bill.amount),
        category_id: bill.category_id ?? '',
        notes: bill.name,
        recurring_id: bill.id,
      },
    })
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="notifications-outline" size={18} color="#92400e" />
        <Text style={styles.headerText}>有 {bills.length} 笔待记录账单</Text>
      </View>
      {bills.map((bill) => (
        <TouchableOpacity key={bill.id} style={styles.billRow} onPress={() => handlePressBill(bill)}>
          <Text style={styles.billName}>{bill.name}</Text>
          <Text style={styles.billAmount}>¥{Number(bill.amount).toFixed(2)}</Text>
        </TouchableOpacity>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fef3c7',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  headerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400e',
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  billName: {
    fontSize: 14,
    color: '#78350f',
  },
  billAmount: {
    fontSize: 14,
    fontWeight: '500',
    color: '#78350f',
  },
})
