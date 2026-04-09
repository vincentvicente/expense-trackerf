import { useState, useEffect, useCallback } from 'react'
import { View, Text, TouchableOpacity, FlatList, TextInput, Modal, StyleSheet, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { getTemplates, createTemplate, deleteTemplate } from '../../lib/api/templates'
import { useCategoryStore } from '../../stores/useCategoryStore'
import { useSettingsStore } from '../../stores/useSettingsStore'
import type { QuickTemplate, TransactionType } from '../../types/database'

export default function TemplatesScreen() {
  const router = useRouter()
  const isDark = useSettingsStore((s) => s.theme === 'dark')
  const { expenseCategories, incomeCategories, fetchCategories } = useCategoryStore()

  const [templates, setTemplates] = useState<QuickTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)

  // Form state
  const [name, setName] = useState('')
  const [type, setType] = useState<TransactionType>('expense')
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined)

  const loadTemplates = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getTemplates()
      setTemplates(data)
    } catch {
      Alert.alert('错误', '加载失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTemplates()
    fetchCategories()
  }, [])

  const currentCategories = type === 'expense' ? expenseCategories : incomeCategories

  const handleAdd = () => {
    setName('')
    setType('expense')
    setAmount('')
    setNotes('')
    setCategoryId(expenseCategories[0]?.id)
    setModalVisible(true)
  }

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('错误', '请输入模板名称')
      return
    }
    const value = amount ? parseFloat(amount) : undefined
    if (amount && (isNaN(value!) || value! <= 0)) {
      Alert.alert('错误', '请输入有效金额')
      return
    }
    try {
      await createTemplate({
        name: name.trim(),
        type,
        category_id: categoryId,
        amount: value,
        notes: notes.trim() || undefined,
      })
      setModalVisible(false)
      loadTemplates()
    } catch {
      Alert.alert('错误', '添加失败，请重试')
    }
  }

  const handleDelete = (tpl: QuickTemplate) => {
    Alert.alert('确认删除', `确定要删除"${tpl.name}"吗？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteTemplate(tpl.id)
            loadTemplates()
          } catch {
            Alert.alert('错误', '删除失败')
          }
        },
      },
    ])
  }

  const renderItem = ({ item }: { item: QuickTemplate }) => (
    <View style={[styles.card, isDark && styles.cardDark]}>
      <View style={styles.cardLeft}>
        <Text style={styles.cardIcon}>{item.category?.icon || '📋'}</Text>
        <View>
          <Text style={[styles.cardName, isDark && styles.textDark]}>{item.name}</Text>
          {item.amount != null && (
            <Text style={[styles.cardAmount, isDark && styles.textMutedDark]}>
              ¥{item.amount.toFixed(2)}
            </Text>
          )}
        </View>
      </View>
      <TouchableOpacity onPress={() => handleDelete(item)}>
        <Ionicons name="trash-outline" size={18} color="#ef4444" />
      </TouchableOpacity>
    </View>
  )

  return (
    <SafeAreaView style={[styles.safeArea, isDark && styles.safeAreaDark]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={isDark ? '#f9fafb' : '#111827'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isDark && styles.textDark]}>快捷模板</Text>
        <View style={styles.backButton} />
      </View>

      <FlatList
        data={templates}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          !loading ? (
            <Text style={[styles.emptyText, isDark && styles.textMutedDark]}>暂无快捷模板</Text>
          ) : null
        }
      />

      <View style={styles.footer}>
        <TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
          <Ionicons name="add" size={20} color="#ffffff" />
          <Text style={styles.addBtnText}>添加模板</Text>
        </TouchableOpacity>
      </View>

      {/* Add modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isDark && styles.modalContentDark]}>
            <Text style={[styles.modalTitle, isDark && styles.textDark]}>添加模板</Text>

            <TextInput
              style={[styles.input, isDark && styles.inputDark]}
              placeholder="模板名称"
              placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
              value={name}
              onChangeText={setName}
            />

            {/* Type picker */}
            <Text style={[styles.fieldLabel, isDark && styles.textMutedDark]}>类型</Text>
            <View style={styles.pickerRow}>
              {(['expense', 'income'] as const).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.pickerChip, type === t && styles.pickerChipActive]}
                  onPress={() => {
                    setType(t)
                    setCategoryId(
                      (t === 'expense' ? expenseCategories : incomeCategories)[0]?.id
                    )
                  }}
                >
                  <Text style={[styles.pickerChipText, type === t && styles.pickerChipTextActive]}>
                    {t === 'expense' ? '支出' : '收入'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Category picker */}
            <Text style={[styles.fieldLabel, isDark && styles.textMutedDark]}>分类</Text>
            <View style={styles.pickerRow}>
              {currentCategories.slice(0, 6).map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.pickerChip, categoryId === cat.id && styles.pickerChipActive]}
                  onPress={() => setCategoryId(cat.id)}
                >
                  <Text
                    style={[
                      styles.pickerChipText,
                      categoryId === cat.id && styles.pickerChipTextActive,
                    ]}
                  >
                    {cat.icon || ''} {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={[styles.input, isDark && styles.inputDark]}
              placeholder="金额 (可选)"
              placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />

            <TextInput
              style={[styles.input, isDark && styles.inputDark]}
              placeholder="备注 (可选)"
              placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
              value={notes}
              onChangeText={setNotes}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  cardDark: {
    backgroundColor: '#1f2937',
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardIcon: {
    fontSize: 24,
  },
  cardName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  cardAmount: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
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
