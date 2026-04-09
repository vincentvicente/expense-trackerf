import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

// Lazy-load AsyncStorage to avoid SSR "window is not defined" error
const asyncStorageAdapter = {
  getItem: async (name: string) => {
    if (typeof window === 'undefined') return null
    const AsyncStorage =
      require('@react-native-async-storage/async-storage').default
    return AsyncStorage.getItem(name)
  },
  setItem: async (name: string, value: string) => {
    if (typeof window === 'undefined') return
    const AsyncStorage =
      require('@react-native-async-storage/async-storage').default
    return AsyncStorage.setItem(name, value)
  },
  removeItem: async (name: string) => {
    if (typeof window === 'undefined') return
    const AsyncStorage =
      require('@react-native-async-storage/async-storage').default
    return AsyncStorage.removeItem(name)
  },
}

interface SettingsState {
  theme: 'light' | 'dark'
  toggleTheme: () => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      toggleTheme: () => set({ theme: get().theme === 'light' ? 'dark' : 'light' }),
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => asyncStorageAdapter),
    }
  )
)
