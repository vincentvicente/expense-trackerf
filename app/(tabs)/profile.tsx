import { View, Text, TouchableOpacity, Switch, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useAuthStore } from '../../stores/useAuthStore'
import { useSettingsStore } from '../../stores/useSettingsStore'

const menuItems = [
  { icon: 'wallet-outline' as const, label: '预算设置', route: '/settings/budget' },
  { icon: 'folder-outline' as const, label: '分类管理', route: '/settings/categories' },
  { icon: 'repeat-outline' as const, label: '周期性账单', route: '/settings/recurring' },
  { icon: 'flash-outline' as const, label: '快捷模板', route: '/settings/templates' },
]

export default function ProfileScreen() {
  const router = useRouter()
  const { session, signOut } = useAuthStore()
  const { theme, toggleTheme } = useSettingsStore()
  const isDark = theme === 'dark'

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <SafeAreaView style={[styles.safeArea, isDark && styles.safeAreaDark]}>
      <View style={styles.container}>
        <Text style={[styles.header, isDark && styles.textDark]}>我的</Text>

        {/* User info card */}
        <View style={[styles.userCard, isDark && styles.cardDark]}>
          <View style={[styles.avatar, isDark && styles.avatarDark]}>
            <Ionicons name="person" size={28} color={isDark ? '#93c5fd' : '#3b82f6'} />
          </View>
          <Text style={[styles.email, isDark && styles.textDark]} numberOfLines={1}>
            {session?.user?.email ?? '未登录'}
          </Text>
        </View>

        {/* Menu items */}
        <View style={[styles.menuSection, isDark && styles.cardDark]}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={item.route}
              style={[
                styles.menuItem,
                index < menuItems.length - 1 && styles.menuItemBorder,
                isDark && index < menuItems.length - 1 && styles.menuItemBorderDark,
              ]}
              onPress={() => router.push(item.route as any)}
            >
              <View style={styles.menuLeft}>
                <Ionicons name={item.icon} size={22} color={isDark ? '#93c5fd' : '#3b82f6'} />
                <Text style={[styles.menuLabel, isDark && styles.textDark]}>{item.label}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={isDark ? '#6b7280' : '#9ca3af'} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Dark mode toggle */}
        <View style={[styles.menuSection, isDark && styles.cardDark]}>
          <View style={styles.menuItem}>
            <View style={styles.menuLeft}>
              <Ionicons name="moon-outline" size={22} color={isDark ? '#93c5fd' : '#3b82f6'} />
              <Text style={[styles.menuLabel, isDark && styles.textDark]}>深色模式</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: '#d1d5db', true: '#60a5fa' }}
              thumbColor="#ffffff"
            />
          </View>
        </View>

        {/* Logout button */}
        <TouchableOpacity style={[styles.logoutButton, isDark && styles.cardDark]} onPress={handleSignOut}>
          <Text style={styles.logoutText}>退出登录</Text>
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
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    paddingVertical: 16,
  },
  textDark: {
    color: '#f9fafb',
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cardDark: {
    backgroundColor: '#1f2937',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarDark: {
    backgroundColor: '#1e3a5f',
  },
  email: {
    fontSize: 16,
    color: '#374151',
    flex: 1,
  },
  menuSection: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  menuItemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
  },
  menuItemBorderDark: {
    borderBottomColor: '#374151',
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuLabel: {
    fontSize: 16,
    color: '#374151',
  },
  logoutButton: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  logoutText: {
    fontSize: 16,
    color: '#ef4444',
    fontWeight: '600',
  },
})
