import { useSettingsStore } from '../stores/useSettingsStore'

export function useThemeColors() {
  const theme = useSettingsStore((s) => s.theme)
  const isDark = theme === 'dark'

  return {
    isDark,
    colors: {
      background: isDark ? '#111827' : '#ffffff',
      card: isDark ? '#1f2937' : '#ffffff',
      text: isDark ? '#f9fafb' : '#1f2937',
      textSecondary: isDark ? '#9ca3af' : '#6b7280',
      border: isDark ? '#374151' : '#e5e7eb',
      inputBackground: isDark ? '#1f2937' : '#f9fafb',
      primary: '#3b82f6',
      danger: '#ef4444',
      success: '#22c55e',
    },
  }
}
