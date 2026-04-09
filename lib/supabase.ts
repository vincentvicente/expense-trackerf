import 'react-native-url-polyfill/auto'
import { createClient } from '@supabase/supabase-js'
import { Platform } from 'react-native'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

// AsyncStorage doesn't work during SSR (window is undefined).
// Use a lazy import so the module is only loaded on the client side.
const storage =
  typeof window !== 'undefined'
    ? (() => {
        const AsyncStorage =
          require('@react-native-async-storage/async-storage').default
        return AsyncStorage
      })()
    : {
        // In-memory fallback for SSR
        _store: {} as Record<string, string>,
        getItem(key: string) {
          return this._store[key] ?? null
        },
        setItem(key: string, value: string) {
          this._store[key] = value
        },
        removeItem(key: string) {
          delete this._store[key]
        },
      }

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
