import { View, Text, SectionList, StyleSheet } from 'react-native'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import type { Transaction } from '../types/database'
import { TransactionItem } from './TransactionItem'

dayjs.locale('zh-cn')

interface TransactionListProps {
  transactions: Transaction[]
  onPressTransaction: (id: string) => void
}

interface Section {
  title: string
  data: Transaction[]
}

function groupByDate(transactions: Transaction[]): Section[] {
  const map = new Map<string, Transaction[]>()
  for (const tx of transactions) {
    const dateKey = tx.date
    if (!map.has(dateKey)) map.set(dateKey, [])
    map.get(dateKey)!.push(tx)
  }

  const sections: Section[] = []
  for (const [dateKey, data] of map) {
    const d = dayjs(dateKey)
    const title = `${d.format('M月D日')} ${d.format('dddd')}`
    sections.push({ title, data })
  }

  sections.sort((a, b) => (a.data[0].date > b.data[0].date ? -1 : 1))
  return sections
}

export function TransactionList({ transactions, onPressTransaction }: TransactionListProps) {
  const sections = groupByDate(transactions)

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item) => item.id}
      renderSectionHeader={({ section }) => (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderText}>{section.title}</Text>
        </View>
      )}
      renderItem={({ item }) => (
        <TransactionItem transaction={item} onPress={onPressTransaction} />
      )}
      contentContainerStyle={styles.listContent}
      stickySectionHeadersEnabled={false}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={styles.emptyText}>暂无交易记录</Text>
        </View>
      }
    />
  )
}

const styles = StyleSheet.create({
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f3f4f6',
  },
  sectionHeaderText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
  },
  listContent: {
    paddingBottom: 120,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 15,
    color: '#9ca3af',
  },
})
