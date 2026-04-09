import { View, Text, StyleSheet } from 'react-native'
import { LineChart } from 'react-native-gifted-charts'

interface ExpenseTrendChartProps {
  data: { date: string; expense: number; income: number }[]
}

function EmptyState() {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyText}>暂无数据</Text>
    </View>
  )
}

export function ExpenseTrendChart({ data }: ExpenseTrendChartProps) {
  if (data.length === 0) return <EmptyState />

  const lineData = data.map((d) => ({
    value: Number(d.expense),
    label: d.date.slice(8), // day number
  }))

  return (
    <View style={styles.container}>
      <Text style={styles.title}>支出趋势</Text>
      <LineChart
        data={lineData}
        color="#ef4444"
        thickness={2}
        curved
        hideDataPoints={false}
        dataPointsColor="#ef4444"
        xAxisLabelTextStyle={{ fontSize: 10, color: '#9ca3af' }}
        yAxisTextStyle={{ fontSize: 10, color: '#9ca3af' }}
        spacing={data.length > 15 ? 30 : 50}
        width={300}
        height={200}
        noOfSections={4}
        rulesType="solid"
        rulesColor="#f3f4f6"
      />
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
