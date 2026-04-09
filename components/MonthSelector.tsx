import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

interface MonthSelectorProps {
  year: number
  month: number
  totalExpense: number
  totalIncome: number
  onChangeMonth: (year: number, month: number) => void
}

export function MonthSelector({
  year,
  month,
  totalExpense,
  totalIncome,
  onChangeMonth,
}: MonthSelectorProps) {
  const goToPrevMonth = () => {
    if (month === 1) onChangeMonth(year - 1, 12)
    else onChangeMonth(year, month - 1)
  }

  const goToNextMonth = () => {
    if (month === 12) onChangeMonth(year + 1, 1)
    else onChangeMonth(year, month + 1)
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={goToPrevMonth} style={styles.arrow}>
        <Ionicons name="chevron-back" size={24} color="#6b7280" />
      </TouchableOpacity>
      <View style={styles.center}>
        <Text style={styles.monthText}>
          {year}年{month}月
        </Text>
        <View style={styles.summaryRow}>
          <Text style={styles.expenseText}>支出 ¥{totalExpense.toFixed(2)}</Text>
          <Text style={styles.incomeText}>收入 ¥{totalIncome.toFixed(2)}</Text>
        </View>
      </View>
      <TouchableOpacity onPress={goToNextMonth} style={styles.arrow}>
        <Ionicons name="chevron-forward" size={24} color="#6b7280" />
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  arrow: {
    padding: 8,
  },
  center: {
    alignItems: 'center',
  },
  monthText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  summaryRow: {
    flexDirection: 'row',
    marginTop: 4,
    gap: 16,
  },
  expenseText: {
    fontSize: 13,
    color: '#ef4444',
  },
  incomeText: {
    fontSize: 13,
    color: '#22c55e',
  },
})
