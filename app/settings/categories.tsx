import { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, FlatList, TextInput, Modal, StyleSheet, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useCategoryStore } from '../../stores/useCategoryStore'
import { useThemeColors } from '../../hooks/useThemeColors'
import type { TransactionType, Category } from '../../types/database'

export default function CategoriesScreen() {
  const router = useRouter()
  const { expenseCategories, incomeCategories, loading, fetchCategories, addCategory, removeCategory } = useCategoryStore()
  const { isDark } = useThemeColors()

  const [modalVisible, setModalVisible] = useState(false)
  const [newName, setNewName] = useState('')
  const [newIcon, setNewIcon] = useState('')
  const [addType, setAddType] = useState<TransactionType>('expense')

  useEffect(() => {
    fetchCategories()
  }, [])

  const handleAdd = (type: TransactionType) => {
    setAddType(type)
    setNewName('')
    setNewIcon('')
    setModalVisible(true)
  }

  const handleSaveCategory = async () => {
    if (!newName.trim()) {
      Alert.alert('错误', '请输入分类名称')
      return
    }
    try {
      await addCategory({ name: newName.trim(), type: addType, icon: newIcon.trim() || undefined })
      setModalVisible(false)
    } catch {
      Alert.alert('错误', '添加失败，请重试')
    }
  }

  const handleDelete = (item: Category) => {
    if (item.is_default) {
      Alert.alert('提示', '默认分类不可删除')
      return
    }
    Alert.alert('确认删除', `确定要删除"${item.name}"吗？`, [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: () => removeCategory(item.id) },
    ])
  }

  const renderItem = ({ item }: { item: Category }) => (
    <View style={[styles.categoryItem, isDark && styles.categoryItemDark]}>
      <View style={styles.categoryLeft}>
        <Text style={styles.categoryIcon}>{item.icon || '📁'}</Text>
        <Text style={[styles.categoryName, isDark && styles.textDark]}>{item.name}</Text>
      </View>
      <View style={styles.categoryRight}>
        <TouchableOpacity onPress={() => handleDelete(item)} style={styles.deleteBtn}>
          <Ionicons name="trash-outline" size={18} color="#ef4444" />
        </TouchableOpacity>
        <Ionicons name="reorder-three" size={22} color={isDark ? '#6b7280' : '#9ca3af'} />
      </View>
    </View>
  )

  const renderSection = (title: string, data: Category[], type: TransactionType) => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, isDark && styles.textDark]}>{title}</Text>
      {data.map((item) => (
        <View key={item.id}>{renderItem({ item })}</View>
      ))}
      <TouchableOpacity style={[styles.addButton, isDark && styles.addButtonDark]} onPress={() => handleAdd(type)}>
        <Ionicons name="add-circle-outline" size={20} color="#3b82f6" />
        <Text style={styles.addButtonText}>添加分类</Text>
      </TouchableOpacity>
    </View>
  )

  return (
    <SafeAreaView style={[styles.safeArea, isDark && styles.safeAreaDark]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={isDark ? '#f9fafb' : '#111827'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isDark && styles.textDark]}>分类管理</Text>
        <View style={styles.backButton} />
      </View>

      <FlatList
        data={[]}
        renderItem={() => null}
        ListHeaderComponent={
          <>
            {renderSection('支出分类', expenseCategories, 'expense')}
            {renderSection('收入分类', incomeCategories, 'income')}
          </>
        }
        contentContainerStyle={styles.listContent}
      />

      {/* Add category modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isDark && styles.modalContentDark]}>
            <Text style={[styles.modalTitle, isDark && styles.textDark]}>
              添加{addType === 'expense' ? '支出' : '收入'}分类
            </Text>

            <TextInput
              style={[styles.input, isDark && styles.inputDark]}
              placeholder="分类名称"
              placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
              value={newName}
              onChangeText={setNewName}
            />

            <TextInput
              style={[styles.input, isDark && styles.inputDark]}
              placeholder="图标 (emoji，可选)"
              placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
              value={newIcon}
              onChangeText={setNewIcon}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.confirmBtn]} onPress={handleSaveCategory}>
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
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
  },
  categoryItemDark: {
    backgroundColor: '#1f2937',
    borderBottomColor: '#374151',
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  categoryIcon: {
    fontSize: 20,
  },
  categoryName: {
    fontSize: 15,
    color: '#374151',
  },
  categoryRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  deleteBtn: {
    padding: 4,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  addButtonDark: {
    backgroundColor: '#1f2937',
  },
  addButtonText: {
    fontSize: 15,
    color: '#3b82f6',
    fontWeight: '500',
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
    width: '85%',
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
