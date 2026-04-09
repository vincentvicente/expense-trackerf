import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native'
import type { QuickTemplate } from '../types/database'

interface TemplateListProps {
  templates: QuickTemplate[]
  onSelect: (template: QuickTemplate) => void
}

export function TemplateList({ templates, onSelect }: TemplateListProps) {
  if (templates.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>暂无常用模板</Text>
      </View>
    )
  }

  return (
    <FlatList
      data={templates}
      keyExtractor={(item) => item.id}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.7}
          onPress={() => onSelect(item)}
        >
          <View style={styles.iconCircle}>
            <Text style={styles.iconText}>{item.category?.icon || '📁'}</Text>
          </View>
          <Text style={styles.name} numberOfLines={1}>
            {item.name}
          </Text>
          {item.amount != null && (
            <Text style={styles.amount}>¥{item.amount}</Text>
          )}
        </TouchableOpacity>
      )}
    />
  )
}

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
  },
  list: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  card: {
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginRight: 10,
    minWidth: 90,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  iconText: {
    fontSize: 18,
  },
  name: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
    marginBottom: 2,
  },
  amount: {
    fontSize: 12,
    color: '#6b7280',
  },
})
