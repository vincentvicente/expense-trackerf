import { useState, useEffect } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useBudgetStore } from '../../stores/useBudgetStore'
import { useThemeColors } from '../../hooks/useThemeColors'

export default function BudgetSettingScreen() {
  const router = useRouter()
  const { budget, fetchBudget, setBudget, loading } = useBudgetStore()
  const { colors, isDark } = useThemeColors()

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1

  const [amount, setAmount] = useState('')

  useEffect(() => {
    fetchBudget(year, month)
  }, [])

  useEffect(() => {
    if (budget) {
      setAmount(String(budget.amount))
    }
  }, [budget])

  const handleSave = async () => {
    const value = parseFloat(amount)
    if (isNaN(value) || value <= 0) {
      Alert.alert('错误', '请输入有效的预算金额')
      return
    }
    try {
      await setBudget(year, month, value)
      Alert.alert('成功', '预算已保存', [{ text: '确定', onPress: () => router.back() }])
    } catch {
      Alert.alert('错误', '保存失败，请重试')
    }
  }

  return (
    <SafeAreaView style={[styles.safeArea, isDark && styles.safeAreaDark]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={isDark ? '#f9fafb' : '#111827'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isDark && styles.textDark]}>预算设置</Text>
        <View style={styles.backButton} />
      </View>

      <View style={styles.content}>
        <Text style={[styles.label, isDark && styles.labelDark]}>
          {year}年{month}月 月度预算
        </Text>

        {budget && (
          <Text style={[styles.currentBudget, isDark && styles.textMutedDark]}>
            当前预算: ¥{budget.amount.toFixed(2)}
          </Text>
        )}

        <TextInput
          style={[styles.input, isDark && styles.inputDark]}
          placeholder="输入预算金额"
          placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
        />

        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>{loading ? '保存中...' : '保存'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  safeAreaDark: {
    backgroundColor: '#111827',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  textDark: {
    color: '#f9fafb',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  labelDark: {
    color: '#d1d5db',
  },
  currentBudget: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  textMutedDark: {
    color: '#9ca3af',
  },
  input: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#111827',
    marginBottom: 24,
  },
  inputDark: {
    backgroundColor: '#1f2937',
    color: '#f9fafb',
  },
  saveButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
})
