import { View, Text, StyleSheet } from 'react-native'
import { useThemeColors } from '../hooks/useThemeColors'

interface BudgetProgressBarProps {
  spent: number
  budget: number
}

export function BudgetProgressBar({ spent, budget }: BudgetProgressBarProps) {
  const { colors, isDark } = useThemeColors()

  if (budget <= 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.card }]}>
        <Text style={[styles.noBudgetText, { color: colors.textSecondary }]}>未设置预算</Text>
      </View>
    )
  }

  const percentage = Math.round((spent / budget) * 100)
  const barWidth = Math.min(percentage, 100)
  const isOver = percentage > 100
  const barColor = isOver ? '#ef4444' : '#3b82f6'

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <Text style={[styles.budgetText, { color: colors.textSecondary }]}>
        预算 ¥{spent.toFixed(2)} / ¥{budget.toFixed(2)}  已用 {percentage}%
      </Text>
      <View style={[styles.barBackground, { backgroundColor: isDark ? '#374151' : '#e5e7eb' }]}>
        <View style={[styles.barFill, { width: `${barWidth}%`, backgroundColor: barColor }]} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  noBudgetText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  budgetText: {
    fontSize: 13,
    color: '#374151',
    marginBottom: 8,
  },
  barBackground: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: 8,
    borderRadius: 4,
  },
})
