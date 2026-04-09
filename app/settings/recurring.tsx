import { useState, useEffect, useCallback } from 'react'
import { View, Text, TouchableOpacity, FlatList, TextInput, Modal, StyleSheet, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { getRecurringBills, createRecurringBill, deleteRecurringBill } from '../../lib/api/recurring'
import { useCategoryStore } from '../../stores/useCategoryStore'
import { useThemeColors } from '../../hooks/useThemeColors'
import type { RecurringBill, RecurrenceCycle } from '../../types/database'

const CYCLE_OPTIONS: { label: string; value: RecurrenceCycle }[] = [
  { label: '每周', value: 'weekly' },
  { label: '每月', value: 'monthly' },
  { label: '每年', value: 'yearly' },
]

const cycleLabel = (cycle: RecurrenceCycle) =>
  CYCLE_OPTIONS.find((o) => o.value === cycle)?.label ?? cycle

export default function RecurringScreen() {
  const router = useRouter()
  const { isDark } = useThemeColors()
  const { expenseCategories, fetchCategories } = useCategoryStore()

  const [bills, setBills] = useState<RecurringBill[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)

  // Form state
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [cycle, setCycle] = useState<RecurrenceCycle>('monthly')
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined)
  const [nextDueDate, setNextDueDate] = useState('')

  const loadBills = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getRecurringBills()
      setBills(data)
    } catch {
      Alert.alert('错误', '加载失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadBills()
    fetchCategories()
  }, [])

  const handleAdd = () => {
    setName('')
    setAmount('')
    setCycle('monthly')
    setCategoryId(expenseCategories[0]?.id)
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    setNextDueDate(tomorrow.toISOString().split('T')[0])
    setModalVisible(true)
  }

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('错误', '请输入名称')
      return
    }
    const value = parseFloat(amount)
    if (isNaN(value) || value <= 0) {
      Alert.alert('错误', '请输入有效金额')
      return
    }
    if (!nextDueDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      Alert.alert('错误', '日期格式应为 YYYY-MM-DD')
      return
    }
    try {
      await createRecurringBill({
        name: name.trim(),
        amount: value,
        cycle,
        category_id: categoryId,
        next_due_date: nextDueDate,
      })
      setModalVisible(false)
      loadBills()
    } catch {
      Alert.alert('错误', '添加失败，请重试')
    }
  }

  const handleDelete = (bill: RecurringBill) => {
    Alert.alert('确认删除', `确定要删除"${bill.name}"吗？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteRecurringBill(bill.id)
            loadBills()
          } catch {
            Alert.alert('错误', '删除失败')
          }
        },
      },
    ])
  }

  const renderItem = ({ item }: { item: RecurringBill }) => (
    <View style={[styles.card, isDark && styles.cardDark]}>
      <View style={styles.cardTop}>
        <Text style={[styles.cardName, isDark && styles.textDark]}>{item.name}</Text>
        <TouchableOpacity onPress={() => handleDelete(item)}>
          <Ionicons name="trash-outline" size={18} color="#ef4444" />
        </TouchableOpacity>
      </View>
      <View style={styles.cardDetails}>
        <Text style={[styles.cardAmount, isDark && styles.textDark]}>¥{item.amount.toFixed(2)}</Text>
        <Text style={[styles.cardMeta, isDark && styles.textMutedDark]}>
          {cycleLabel(item.cycle)} | 下次: {item.next_due_date}
        </Text>
      </View>
    </View>
  )

  return (
    <SafeAreaView style={[styles.safeArea, isDark && styles.safeAreaDark]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={isDark ? '#f9fafb' : '#111827'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isDark && styles.textDark]}>周期性账单</Text>
        <View style={styles.backButton} />
      </View>

      <FlatList
        data={bills}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          !loading ? (
            <Text style={[styles.emptyText, isDark && styles.textMutedDark]}>暂无周期性账单</Text>
          ) : null
        }
      />

      <View style={styles.footer}>
        <TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
          <Ionicons name="add" size={20} color="#ffffff" />
          <Text style={styles.addBtnText}>添加周期账单</Text>
        </TouchableOpacity>
      </View>

      {/* Add modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isDark && styles.modalContentDark]}>
            <Text style={[styles.modalTitle, isDark && styles.textDark]}>添加周期账单</Text>

            <TextInput
              style={[styles.input, isDark && styles.inputDark]}
              placeholder="名称"
              placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
              value={name}
              onChangeText={setName}
            />
            <TextInput
              style={[styles.input, isDark && styles.inputDark]}
              placeholder="金额"
              placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />

            {/* Cycle picker */}
            <Text style={[styles.fieldLabel, isDark && styles.textMutedDark]}>周期</Text>
            <View style={styles.pickerRow}>
              {CYCLE_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.pickerChip, cycle === opt.value && styles.pickerChipActive]}
                  onPress={() => setCycle(opt.value)}
                >
                  <Text
                    style={[styles.pickerChipText, cycle === opt.value && styles.pickerChipTextActive]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Category picker */}
            <Text style={[styles.fieldLabel, isDark && styles.textMutedDark]}>分类</Text>
            <View style={styles.pickerRow}>
              {expenseCategories.slice(0, 6).map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.pickerChip, categoryId === cat.id && styles.pickerChipActive]}
                  onPress={() => setCategoryId(cat.id)}
                >
                  <Text
                    style={[styles.pickerChipText, categoryId === cat.id && styles.pickerChipTextActive]}
                  >
                    {cat.icon || ''} {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={[styles.input, isDark && styles.inputDark]}
              placeholder="下次日期 (YYYY-MM-DD)"
              placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
              value={nextDueDate}
              onChangeText={setNextDueDate}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.confirmBtn]} onPress={handleSave}>
                <Text style={styles.confirmBtnText}>确定</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  textMutedDark: {
    color: '#9ca3af',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  cardDark: {
    backgroundColor: '#1f2937',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  cardDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardAmount: {
    fontSize: 15,
    fontWeight: '500',
    color: '#374151',
  },
  cardMeta: {
    fontSize: 13,
    color: '#6b7280',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 60,
    fontSize: 15,
    color: '#9ca3af',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 16,
    right: 16,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#3b82f6',
    borderRadius: 10,
    paddingVertical: 14,
  },
  addBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 24,
    width: '90%',
    maxHeight: '80%',
  },
  modalContentDark: {
    backgroundColor: '#1f2937',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  fieldLabel: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 6,
    marginTop: 4,
  },
  input: {
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
    marginBottom: 12,
  },
  inputDark: {
    backgroundColor: '#374151',
    color: '#f9fafb',
  },
  pickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  pickerChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#e5e7eb',
  },
  pickerChipActive: {
    backgroundColor: '#3b82f6',
  },
  pickerChipText: {
    fontSize: 13,
    color: '#374151',
  },
  pickerChipTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: '#e5e7eb',
  },
  cancelBtnText: {
    color: '#374151',
    fontSize: 15,
    fontWeight: '500',
  },
  confirmBtn: {
    backgroundColor: '#3b82f6',
  },
  confirmBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
})
