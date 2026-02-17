import { useState } from 'react'
import { View, StyleSheet } from 'react-native'
import { useAuth } from './hooks/useAuth'
import { Loading } from './components/ui'
import { TabBar, TabName } from './components/TabBar'
import { ThemeProvider, useTheme } from './context/ThemeContext'
import { LoginScreen } from './screens/LoginScreen'
import { SignupScreen } from './screens/SignupScreen'
import { YearScreen } from './screens/YearScreen'
import { EventsScreen, DaleEvent } from './screens/EventsScreen'
import { EventDetailScreen } from './screens/EventDetailScreen'
import { AddEventScreen } from './screens/AddEventScreen'
import { ProfileScreen } from './screens/ProfileScreen'
import { SettingsScreen } from './screens/SettingsScreen'

type AuthScreen = 'login' | 'signup' | null

function AppContent() {
  const { colors } = useTheme()
  const { user, isLoading, isActionLoading, isAuthenticated, login, signUp, logout } = useAuth()
  const [authScreen, setAuthScreen] = useState<AuthScreen>(null)
  const [activeTab, setActiveTab] = useState<TabName>('year')

  // Event-related state
  const [viewingEvent, setViewingEvent] = useState<DaleEvent | null>(null)
  const [editingEvent, setEditingEvent] = useState<DaleEvent | null>(null)
  const [isAddingEvent, setIsAddingEvent] = useState(false)

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Loading message="Loading..." />
      </View>
    )
  }

  // Auth screens
  if (authScreen === 'login') {
    return (
      <LoginScreen
        onLogin={async (email, password) => {
          await login(email, password)
          setAuthScreen(null)
        }}
        onNavigateToSignup={() => setAuthScreen('signup')}
        isLoading={isActionLoading}
        onGuestLogin={async () => {
          await login('guest@example.com', '12345678')
          setAuthScreen(null)
        }}
        onBack={() => setAuthScreen(null)}
      />
    )
  }

  if (authScreen === 'signup') {
    return (
      <SignupScreen
        onSignup={async (data) => {
          await signUp(data)
          setAuthScreen(null)
        }}
        onNavigateToLogin={() => setAuthScreen('login')}
        isLoading={isActionLoading}
        onBack={() => setAuthScreen(null)}
      />
    )
  }

  // Add/Edit event screen
  if (isAddingEvent) {
    return (
      <AddEventScreen
        event={editingEvent}
        onSave={() => {
          setEditingEvent(null)
          setIsAddingEvent(false)
          setViewingEvent(null)
        }}
        onCancel={() => {
          setEditingEvent(null)
          setIsAddingEvent(false)
        }}
      />
    )
  }

  // Event detail screen
  if (viewingEvent) {
    return (
      <EventDetailScreen
        event={viewingEvent}
        onBack={() => setViewingEvent(null)}
        onEdit={(event) => {
          setEditingEvent(event)
          setIsAddingEvent(true)
        }}
        onDeleted={() => setViewingEvent(null)}
      />
    )
  }

  const handleLogin = () => setAuthScreen('login')
  const handleSignup = () => setAuthScreen('signup')
  const handleGuestLogin = async () => {
    await login('guest@example.com', '12345678')
  }
  const handleLogout = async () => {
    await logout()
    setActiveTab('year')
  }

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'year':
        return <YearScreen />
      case 'events':
        return (
          <EventsScreen
            isAuthenticated={isAuthenticated}
            onCreateEvent={() => {
              setEditingEvent(null)
              setIsAddingEvent(true)
            }}
            onViewEvent={(event) => setViewingEvent(event)}
            onLogin={handleLogin}
          />
        )
      case 'profile':
        return (
          <ProfileScreen
            user={user}
            isAuthenticated={isAuthenticated}
            onLogout={handleLogout}
            onLogin={handleLogin}
            onSignup={handleSignup}
            onGuestLogin={handleGuestLogin}
          />
        )
      case 'settings':
        return <SettingsScreen />
      default:
        return null
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        {renderActiveTab()}
      </View>
      <TabBar activeTab={activeTab} onTabPress={setActiveTab} />
    </View>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
})
