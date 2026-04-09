import { useState, useEffect } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ExpenseTrendChart } from '../../components/charts/ExpenseTrendChart'
import { CategoryPieChart } from '../../components/charts/CategoryPieChart'
import { IncomeExpenseBarChart } from '../../components/charts/IncomeExpenseBarChart'
import { BudgetProgressChart } from '../../components/charts/BudgetProgressChart'
import { useTransactionStore } from '../../stores/useTransactionStore'
import { useBudgetStore } from '../../stores/useBudgetStore'
import { getDailyTrend, getCategoryBreakdown } from '../../lib/api/stats'
import type { CategoryBreakdown } from '../../lib/api/stats'

type TimeRange = 'week' | 'month' | 'year'
type ChartTab = 'trend' | 'category' | 'comparison' | 'budget'

const TIME_RANGE_OPTIONS: { key: TimeRange; label: string }[] = [
  { key: 'week', label: '周' },
  { key: 'month', label: '月' },
  { key: 'year', label: '年' },
]

const CHART_TAB_OPTIONS: { key: ChartTab; label: string }[] = [
  { key: 'trend', label: '趋势' },
  { key: 'category', label: '分类' },
  { key: 'comparison', label: '对比' },
  { key: 'budget', label: '预算' },
]

export default function StatsScreen() {
  const [timeRange, setTimeRange] = useState<TimeRange>('month')
  const [chartTab, setChartTab] = useState<ChartTab>('trend')
  const [trendData, setTrendData] = useState<
    { date: string; income: number; expense: number }[]
  >([])
  const [categoryData, setCategoryData] = useState<CategoryBreakdown[]>([])
  const [loading, setLoading] = useState(false)

  const { currentYear, currentMonth, transactions } = useTransactionStore()
  const { budget, fetchBudget } = useBudgetStore()

  useEffect(() => {
    loadData()
  }, [currentYear, currentMonth, timeRange])

  const loadData = async () => {
    setLoading(true)
    try {
      const [trend, categories] = await Promise.all([
        getDailyTrend(currentYear, currentMonth),
        getCategoryBreakdown(currentYear, currentMonth, 'expense'),
      ])
      setTrendData(trend)
      setCategoryData(categories)
      await fetchBudget(currentYear, currentMonth)
    } catch (_e) {
      // Silently handle — charts will show empty state
    } finally {
      setLoading(false)
    }
  }

  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const budgetAmount = budget ? Number(budget.amount) : 0

  const filteredTrendData = (() => {
    if (timeRange === 'week') {
      return trendData.slice(-7)
    }
    if (timeRange === 'year') {
      // For yearly view, return all data (full month for now)
      return trendData
    }
    return trendData
  })()

  const renderChart = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      )
    }

    switch (chartTab) {
      case 'trend':
        return <ExpenseTrendChart data={filteredTrendData} />
      case 'category':
        return <CategoryPieChart data={categoryData} />
      case 'comparison':
        return <IncomeExpenseBarChart data={filteredTrendData} />
      case 'budget':
        return <BudgetProgressChart spent={totalExpense} budget={budgetAmount} />
      default:
        return null
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Text style={styles.header}>统计</Text>

      {/* Time range selector */}
      <View style={styles.segmentRow}>
        {TIME_RANGE_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.key}
            style={[
              styles.segmentButton,
              timeRange === opt.key && styles.segmentButtonActive,
            ]}
            onPress={() => setTimeRange(opt.key)}
          >
            <Text
              style={[
                styles.segmentText,
                timeRange === opt.key && styles.segmentTextActive,
              ]}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Chart tab selector */}
      <View style={styles.tabRow}>
        {CHART_TAB_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.key}
            style={[
              styles.tabButton,
              chartTab === opt.key && styles.tabButtonActive,
            ]}
            onPress={() => setChartTab(opt.key)}
          >
            <Text
              style={[
                styles.tabText,
                chartTab === opt.key && styles.tabTextActive,
              ]}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Chart content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderChart()}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1f2937',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  segmentRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 2,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  segmentButtonActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  segmentTextActive: {
    color: '#1f2937',
    fontWeight: '600',
  },
  tabRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  tabButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  tabText: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    padding: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
