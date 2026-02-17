import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useColorScheme } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'

// Dale dark theme - pure black with white/gray accents
const darkColors = {
  background: '#000000',
  surface: '#1a1a1a',
  surfaceHover: '#242424',
  border: '#2a2a2a',
  text: '#ffffff',
  textSecondary: '#999999',
  textMuted: '#555555',
  primary: '#ffffff',
  primaryHover: '#e0e0e0',
  danger: '#ef4444',
  dangerHover: '#dc2626',
  success: '#22c55e',
}

const lightColors = {
  background: '#f8f8f8',
  surface: '#ffffff',
  surfaceHover: '#f1f1f1',
  border: '#e0e0e0',
  text: '#000000',
  textSecondary: '#666666',
  textMuted: '#999999',
  primary: '#000000',
  primaryHover: '#333333',
  danger: '#ef4444',
  dangerHover: '#dc2626',
  success: '#22c55e',
}

export type ThemeColors = typeof darkColors

export type ThemeMode = 'light' | 'dark' | 'system'

export type FontSizeOption = 'small' | 'medium' | 'large'

const fontSizes = {
  small: {
    xs: 10,
    sm: 12,
    base: 14,
    lg: 16,
    xl: 18,
    '2xl': 22,
    '3xl': 26,
  },
  medium: {
    xs: 11,
    sm: 13,
    base: 15,
    lg: 17,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
  },
  large: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 22,
    '2xl': 28,
    '3xl': 34,
  },
}

export type FontSizes = typeof fontSizes.medium

interface Settings {
  themeMode: ThemeMode
  notificationsEnabled: boolean
  autoSave: boolean
  fontSize: FontSizeOption
}

interface ThemeContextType {
  colors: ThemeColors
  fonts: FontSizes
  isDark: boolean
  settings: Settings
  updateSettings: (updates: Partial<Settings>) => void
}

const defaultSettings: Settings = {
  themeMode: 'dark',
  notificationsEnabled: true,
  autoSave: true,
  fontSize: 'medium',
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const SETTINGS_KEY = '@app_settings'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useColorScheme()
  const [settings, setSettings] = useState<Settings>(defaultSettings)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(SETTINGS_KEY)
      if (stored) {
        setSettings({ ...defaultSettings, ...JSON.parse(stored) })
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
    } finally {
      setIsLoaded(true)
    }
  }

  const saveSettings = async (newSettings: Settings) => {
    try {
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings))
    } catch (error) {
      console.error('Failed to save settings:', error)
    }
  }

  const updateSettings = (updates: Partial<Settings>) => {
    const newSettings = { ...settings, ...updates }
    setSettings(newSettings)
    saveSettings(newSettings)
  }

  const isDark =
    settings.themeMode === 'dark' ||
    (settings.themeMode === 'system' && systemColorScheme === 'dark')

  const colors = isDark ? darkColors : lightColors
  const fonts = fontSizes[settings.fontSize]

  if (!isLoaded) {
    return null
  }

  return (
    <ThemeContext.Provider value={{ colors, fonts, isDark, settings, updateSettings }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

export function useColors() {
  const { colors } = useTheme()
  return colors
}
