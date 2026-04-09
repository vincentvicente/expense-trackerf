import { View, Text, TouchableOpacity, ScrollView, StyleSheet, useWindowDimensions } from 'react-native'
import { useThemeColors } from '../hooks/useThemeColors'
import type { Category } from '../types/database'

interface CategoryGridProps {
  categories: Category[]
  selectedId: string | null
  onSelect: (id: string) => void
}

const COLUMNS = 4

export function CategoryGrid({ categories, selectedId, onSelect }: CategoryGridProps) {
  const { width } = useWindowDimensions()
  const { colors } = useThemeColors()
  const itemWidth = (width - 24) / COLUMNS // 24 = paddingHorizontal * 2

  const items = [
    ...categories,
    { id: '__add__', name: '+ 自定义', icon: '➕', color: '#e5e7eb', type: 'expense' as const },
  ]

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.grid}>
      {items.map((cat) => {
        const isSelected = cat.id === selectedId
        const isAddButton = cat.id === '__add__'

        return (
          <TouchableOpacity
            key={cat.id}
            style={[styles.item, { width: itemWidth }]}
            activeOpacity={0.7}
            onPress={() => {
              if (isAddButton) {
                // Placeholder: will navigate to category management later
                return
              }
              onSelect(cat.id)
            }}
          >
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: cat.color || '#e5e7eb' },
                isSelected && styles.iconCircleSelected,
              ]}
            >
              <Text style={styles.iconText}>{cat.icon || '📁'}</Text>
            </View>
            <Text style={[styles.name, { color: colors.textSecondary }, isSelected && styles.nameSelected]} numberOfLines={1}>
              {cat.name}
            </Text>
          </TouchableOpacity>
        )
      })}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  item: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleSelected: {
    borderWidth: 2.5,
    borderColor: '#3b82f6',
  },
  iconText: {
    fontSize: 22,
  },
  name: {
    marginTop: 4,
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  nameSelected: {
    color: '#3b82f6',
    fontWeight: '600',
  },
})
