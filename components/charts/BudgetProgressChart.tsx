import { View, Text, StyleSheet } from 'react-native'
import { useThemeColors } from '../../hooks/useThemeColors'

interface BudgetProgressChartProps {
  spent: number
  budget: number
}

export function BudgetProgressChart({ spent, budget }: BudgetProgressChartProps) {
  const { colors, isDark } = useThemeColors()

  if (budget <= 0) {
    return (
      <View style={[styles.empty, { backgroundColor: colors.card }]}>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>暂未设置预算</Text>
      </View>
    )
  }

  const percentage = Math.min((spent / budget) * 100, 100)
  const overBudget = spent > budget
  const primaryColor = overBudget ? '#ef4444' : '#3b82f6'

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <Text style={[styles.title, { color: colors.text }]}>本月预算使用情况</Text>

      {/* Circular progress */}
      <View style={styles.circleContainer}>
        <View style={[styles.circleOuter, { borderColor: isDark ? '#374151' : '#f3f4f6' }]}>
          <View
            style={[
              styles.circleInner,
              { borderColor: primaryColor },
              // Show progress via a colored border on the top/right
            ]}
          >
            <Text style={[styles.percentText, { color: primaryColor }]}>
              {Math.round((spent / budget) * 100)}%
            </Text>
            <Text style={[styles.percentLabel, { color: colors.textSecondary }]}>
              {overBudget ? '已超支' : '已使用'}
            </Text>
          </View>
        </View>
      </View>

      {/* Progress bar */}
      <View style={[styles.barBackground, { backgroundColor: isDark ? '#374151' : '#f3f4f6' }]}>
        <View
          style={[
            styles.barFill,
            {
              width: `${Math.min((spent / budget) * 100, 100)}%`,
              backgroundColor: primaryColor,
            },
          ]}
        />
      </View>

      {/* Summary */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>已支出</Text>
          <Text style={[styles.summaryValue, { color: primaryColor }]}>
            ¥{spent.toFixed(2)}
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>预算</Text>
          <Text style={[styles.summaryValue, { color: colors.text }]}>¥{budget.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
            {overBudget ? '超支' : '剩余'}
          </Text>
          <Text
            style={[
              styles.summaryValue,
              { color: overBudget ? '#ef4444' : '#22c55e' },
            ]}
          >
            ¥{Math.abs(budget - spent).toFixed(2)}
          </Text>
        </View>
      </View>

      {overBudget && (
        <Text style={styles.warningText}>
          本月支出已超过预算 ¥{(spent - budget).toFixed(2)}
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
    color: '#1f2937',
  },
  circleContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  circleOuter: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleInner: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentText: {
    fontSize: 28,
    fontWeight: '700',
  },
  percentLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  barBackground: {
    height: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 16,
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  warningText: {
    fontSize: 13,
    color: '#ef4444',
    textAlign: 'center',
    marginTop: 12,
  },
  empty: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
  },
})
