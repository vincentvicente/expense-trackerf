import { useEffect } from 'react'
import { View, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { MonthSelector } from '../../components/MonthSelector'
import { BudgetProgressBar } from '../../components/BudgetProgressBar'
import { DueBillCard } from '../../components/DueBillCard'
import { TransactionList } from '../../components/TransactionList'
import { FloatingAddButton } from '../../components/FloatingAddButton'
import { useTransactionStore } from '../../stores/useTransactionStore'
import { useBudgetStore } from '../../stores/useBudgetStore'
import { useThemeColors } from '../../hooks/useThemeColors'

export default function HomeScreen() {
  const router = useRouter()
  const { colors, isDark } = useThemeColors()
  const { currentYear, currentMonth, setMonth, fetchTransactions, transactions } =
    useTransactionStore()
  const { fetchBudget, budget } = useBudgetStore()

  useEffect(() => {
    fetchTransactions()
    fetchBudget(currentYear, currentMonth)
  }, [currentYear, currentMonth])

  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#111827' : '#f3f4f6' }]}>
      <MonthSelector
        year={currentYear}
        month={currentMonth}
        totalExpense={totalExpense}
        totalIncome={totalIncome}
        onChangeMonth={setMonth}
      />
      <BudgetProgressBar spent={totalExpense} budget={budget?.amount ? Number(budget.amount) : 0} />
      <DueBillCard />
      <TransactionList
        transactions={transactions}
        onPressTransaction={(id) => router.push(`/transaction/${id}`)}
      />
      <FloatingAddButton onPress={() => router.push('/add')} />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
})
