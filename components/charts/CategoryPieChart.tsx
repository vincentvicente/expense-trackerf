import { View, Text, StyleSheet } from 'react-native'
import { PieChart } from 'react-native-gifted-charts'

interface CategoryBreakdownItem {
  category_id: string
  category_name: string
  category_icon: string
  category_color: string
  total: number
}

interface CategoryPieChartProps {
  data: CategoryBreakdownItem[]
}

function EmptyState() {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyText}>暂无数据</Text>
    </View>
  )
}

export function CategoryPieChart({ data }: CategoryPieChartProps) {
  if (data.length === 0) return <EmptyState />

  const total = data.reduce((sum, d) => sum + Number(d.total), 0)

  const pieData = data.map((d) => ({
    value: Number(d.total),
    color: d.category_color || '#6b7280',
    text: `${Math.round((Number(d.total) / total) * 100)}%`,
  }))

  return (
    <View style={styles.container}>
      <Text style={styles.title}>分类占比</Text>
      <View style={styles.chartRow}>
        <PieChart
          data={pieData}
          donut
          radius={80}
          innerRadius={50}
          centerLabelComponent={() => (
            <View style={styles.centerLabel}>
              <Text style={styles.centerLabelSub}>总支出</Text>
              <Text style={styles.centerLabelAmount}>¥{total.toFixed(0)}</Text>
            </View>
          )}
        />
        <View style={styles.legend}>
          {data.map((d) => (
            <View key={d.category_id} style={styles.legendItem}>
              <View
                style={[
                  styles.legendDot,
                  { backgroundColor: d.category_color || '#6b7280' },
                ]}
              />
              <Text style={styles.legendText} numberOfLines={1}>
                {d.category_icon} {d.category_name}  ¥{Number(d.total).toFixed(0)}
              </Text>
            </View>
          ))}
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
  chartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  centerLabel: {
    alignItems: 'center',
  },
  centerLabelSub: {
    fontSize: 12,
    color: '#9ca3af',
  },
  centerLabelAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  legend: {
    flex: 1,
    gap: 8,
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
    flex: 1,
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
