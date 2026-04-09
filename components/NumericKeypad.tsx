import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useThemeColors } from '../hooks/useThemeColors'

interface NumericKeypadProps {
  value: string
  onValueChange: (value: string) => void
  onConfirm: () => void
}

type KeyDef = {
  label: string
  type: 'digit' | 'op' | 'backspace' | 'confirm'
  span?: number
}

const KEYS: KeyDef[][] = [
  [
    { label: '7', type: 'digit' },
    { label: '8', type: 'digit' },
    { label: '9', type: 'digit' },
    { label: '⌫', type: 'backspace' },
  ],
  [
    { label: '4', type: 'digit' },
    { label: '5', type: 'digit' },
    { label: '6', type: 'digit' },
    { label: '+', type: 'op' },
  ],
  [
    { label: '1', type: 'digit' },
    { label: '2', type: 'digit' },
    { label: '3', type: 'digit' },
    { label: '-', type: 'op' },
  ],
  [
    { label: '.', type: 'digit' },
    { label: '0', type: 'digit' },
    { label: '', type: 'digit' }, // empty spacer
    { label: '✓', type: 'confirm' },
  ],
]

export function NumericKeypad({ value, onValueChange, onConfirm }: NumericKeypadProps) {
  const { colors, isDark } = useThemeColors()

  const handlePress = (key: KeyDef) => {
    if (key.type === 'confirm') {
      onConfirm()
      return
    }

    if (key.type === 'backspace') {
      onValueChange(value.slice(0, -1))
      return
    }

    if (key.type === 'op') {
      // v1: treat +/- as no-op
      return
    }

    // Empty spacer key
    if (key.label === '') return

    // Digit / dot
    const char = key.label

    if (char === '.') {
      // Only allow one dot
      if (value.includes('.')) return
      // If empty, start with "0."
      if (value === '') {
        onValueChange('0.')
        return
      }
    }

    // Max 2 decimal places
    const dotIndex = value.indexOf('.')
    if (dotIndex !== -1 && value.length - dotIndex > 2) return

    // Prevent leading zeros like "00"
    if (char === '0' && value === '0') return
    if (value === '0' && char !== '.') {
      onValueChange(char)
      return
    }

    onValueChange(value + char)
  }

  const displayAmount = value || '0'

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#1f2937' : '#f3f4f6' }]}>
      {/* Amount display */}
      <View style={[styles.amountRow, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <Text style={[styles.currencySign, { color: colors.textSecondary }]}>¥</Text>
        <Text style={[styles.amountText, { color: colors.text }]} numberOfLines={1}>
          {displayAmount}
        </Text>
      </View>

      {/* Keypad */}
      {KEYS.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((key, colIndex) => {
            if (key.label === '' && key.type === 'digit') {
              return <View key={colIndex} style={[styles.key, { backgroundColor: colors.card }]} />
            }

            const isConfirm = key.type === 'confirm'
            const isOp = key.type === 'op'
            const isBackspace = key.type === 'backspace'

            return (
              <TouchableOpacity
                key={colIndex}
                style={[
                  styles.key,
                  { backgroundColor: colors.card },
                  isConfirm && styles.confirmKey,
                  isOp && { backgroundColor: isDark ? '#111827' : '#f9fafb' },
                ]}
                activeOpacity={0.6}
                onPress={() => handlePress(key)}
              >
                <Text
                  style={[
                    styles.keyText,
                    { color: colors.text },
                    isConfirm && styles.confirmKeyText,
                    isOp && { color: colors.textSecondary },
                    isBackspace && styles.backspaceText,
                  ]}
                >
                  {key.label}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f3f4f6',
    paddingBottom: 4,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e5e7eb',
  },
  currencySign: {
    fontSize: 20,
    color: '#6b7280',
    marginRight: 4,
  },
  amountText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1f2937',
  },
  row: {
    flexDirection: 'row',
  },
  key: {
    flex: 1,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    margin: 1,
  },
  keyText: {
    fontSize: 22,
    color: '#1f2937',
  },
  confirmKey: {
    backgroundColor: '#3b82f6',
  },
  confirmKeyText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  opKey: {
    backgroundColor: '#f9fafb',
  },
  opKeyText: {
    color: '#9ca3af',
  },
  backspaceText: {
    fontSize: 20,
  },
})
