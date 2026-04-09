import { View, Text, StyleSheet } from 'react-native'
import { BarChart } from 'react-native-gifted-charts'
import { useThemeColors } from '../../hooks/useThemeColors'

interface IncomeExpenseBarChartProps {
  data: { date: string; income: number; expense: number }[]
}

function EmptyState() {
  const { colors } = useThemeColors()
  return (
    <View style={[styles.empty, { backgroundColor: colors.card }]}>
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>暂无数据</Text>
    </View>
  )
}

export function IncomeExpenseBarChart({ data }: IncomeExpenseBarChartProps) {
  const { colors } = useThemeColors()

  if (data.length === 0) return <EmptyState />

  // Group daily data into weekly buckets
  const weeklyData: { label: string; income: number; expense: number }[] = []
  for (let i = 0; i < data.length; i += 7) {
    const chunk = data.slice(i, i + 7)
    const weekNum = Math.floor(i / 7) + 1
    const income = chunk.reduce((sum, d) => sum + Number(d.income), 0)
    const expense = chunk.reduce((sum, d) => sum + Number(d.expense), 0)
    weeklyData.push({ label: `第${weekNum}周`, income, expense })
  }

  const barData = weeklyData.flatMap((w) => [
    {
      value: w.income,
      label: w.label,
      frontColor: '#22c55e',
      spacing: 2,
    },
    {
      value: w.expense,
      frontColor: '#ef4444',
      spacing: 24,
    },
  ])

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <Text style={[styles.title, { color: colors.text }]}>收支对比</Text>
      <BarChart
        data={barData}
        barWidth={20}
        spacing={16}
        xAxisLabelTextStyle={{ fontSize: 10, color: colors.textSecondary }}
        yAxisTextStyle={{ fontSize: 10, color: colors.textSecondary }}
        height={200}
        noOfSections={4}
        rulesType="solid"
        rulesColor={colors.border}
      />
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#22c55e' }]} />
          <Text style={[styles.legendText, { color: colors.text }]}>收入</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#ef4444' }]} />
          <Text style={[styles.legendText, { color: colors.text }]}>支出</Text>
        </View>
      </View>
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
    marginBottom: 12,
    color: '#1f2937',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginTop: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 13,
    color: '#374151',
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
