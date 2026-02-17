import { useState, useEffect, useCallback } from 'react'
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import { useTheme, ThemeColors, FontSizes } from '../context/ThemeContext'
import { api, getCurrentUserId } from '../api'
import { Loading } from '../components/ui'
import { updateWidgetEvents } from '../services/WidgetService'

export interface DaleEvent {
  id: string
  owner_id: string
  title: string
  target_date: string
  start_date: string
  created: string
  updated: string
}

interface EventsScreenProps {
  isAuthenticated: boolean
  onCreateEvent: () => void
  onViewEvent: (event: DaleEvent) => void
  onLogin: () => void
}

export function EventsScreen({ isAuthenticated, onCreateEvent, onViewEvent, onLogin }: EventsScreenProps) {
  const { colors, fonts } = useTheme()
  const styles = createStyles(colors, fonts)

  const [events, setEvents] = useState<DaleEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchEvents = useCallback(async () => {
    if (!isAuthenticated) {
      setEvents([])
      setIsLoading(false)
      return
    }
    try {
      const result = await api.request<{ items: DaleEvent[]; total: number }>(
        '/table/events/list?order=-created'
      )
      setEvents(result.items)
      updateWidgetEvents(result.items.map(e => ({
        id: e.id, title: e.title, target_date: e.target_date, start_date: e.start_date
      })))
    } catch (err) {
      console.log('Failed to load events:', err)
    } finally {
      setIsLoading(false)
      setRefreshing(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  const onRefresh = () => {
    setRefreshing(true)
    fetchEvents()
  }

  const deleteEvent = async (event: DaleEvent) => {
    Alert.alert('Delete Event', `Delete "${event.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.request('/table/events/delete', {
              method: 'POST',
              body: JSON.stringify({ where: `id = '${event.id}'` }),
            })
            const updated = events.filter(e => e.id !== event.id)
            setEvents(updated)
            updateWidgetEvents(updated.map(e => ({
              id: e.id, title: e.title, target_date: e.target_date, start_date: e.start_date
            })))
          } catch (err) {
            console.log('Failed to delete event:', err)
          }
        },
      },
    ])
  }

  const getEventProgress = (event: DaleEvent) => {
    const now = new Date()
    const start = new Date(event.start_date)
    const target = new Date(event.target_date)
    const totalMs = target.getTime() - start.getTime()
    const elapsedMs = now.getTime() - start.getTime()
    const totalDays = Math.max(1, Math.ceil(totalMs / (1000 * 60 * 60 * 24)))
    const elapsedDays = Math.max(0, Math.min(totalDays, Math.ceil(elapsedMs / (1000 * 60 * 60 * 24))))
    const daysLeft = Math.max(0, totalDays - elapsedDays)
    const progress = totalDays > 0 ? Math.min(100, Math.round((elapsedDays / totalDays) * 100)) : 0
    return { totalDays, elapsedDays, daysLeft, progress }
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Events</Text>
        </View>
        <View style={styles.centered}>
          <Icon name="calendar-clock" size={48} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>Track your events</Text>
          <Text style={styles.emptyMessage}>Sign in to create and track countdowns to your important dates.</Text>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.text }]} onPress={onLogin}>
            <Text style={[styles.actionButtonText, { color: colors.background }]}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Events</Text>
        </View>
        <Loading message="Loading events..." />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Events</Text>
      </View>

      <TouchableOpacity style={styles.newEventButton} onPress={onCreateEvent}>
        <Icon name="plus-circle-outline" size={20} color={colors.textSecondary} />
        <Text style={styles.newEventText}>New Event</Text>
      </TouchableOpacity>

      {events.length === 0 ? (
        <View style={styles.centered}>
          <Icon name="calendar-plus" size={48} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>No events yet</Text>
          <Text style={styles.emptyMessage}>Create your first event to start tracking days.</Text>
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.textMuted} />}
          renderItem={({ item }) => {
            const { totalDays, daysLeft, progress } = getEventProgress(item)
            return (
              <TouchableOpacity style={styles.eventCard} onPress={() => onViewEvent(item)} activeOpacity={0.7}>
                <View style={styles.eventHeader}>
                  <Text style={styles.eventTitle} numberOfLines={1}>{item.title}</Text>
                  <TouchableOpacity onPress={() => deleteEvent(item)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                    <Icon name="trash-can-outline" size={20} color={colors.danger} />
                  </TouchableOpacity>
                </View>

                <View style={styles.eventStatsRow}>
                  <View style={styles.eventStat}>
                    <Text style={styles.eventStatNumber}>{daysLeft}</Text>
                    <Text style={styles.eventStatLabel}>Days Left</Text>
                  </View>
                  <View style={styles.eventStat}>
                    <Text style={styles.eventStatNumber}>{totalDays}</Text>
                    <Text style={styles.eventStatLabel}>Total Days</Text>
                  </View>
                  <View style={styles.eventStat}>
                    <Text style={styles.eventStatNumber}>{progress}%</Text>
                    <Text style={styles.eventStatLabel}>Progress</Text>
                  </View>
                </View>

                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `${progress}%`, backgroundColor: colors.text }]} />
                </View>

                <Text style={styles.targetDate}>Target: {formatDate(item.target_date)}</Text>
              </TouchableOpacity>
            )
          }}
        />
      )}
    </View>
  )
}

const createStyles = (colors: ThemeColors, fonts: FontSizes) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingTop: 70,
      paddingHorizontal: 20,
      paddingBottom: 12,
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: '800',
      color: colors.text,
    },
    newEventButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
      marginHorizontal: 20,
      paddingVertical: 14,
      borderRadius: 12,
      gap: 8,
      marginBottom: 16,
    },
    newEventText: {
      fontSize: fonts.base,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    list: {
      paddingHorizontal: 20,
      paddingBottom: 20,
    },
    eventCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 12,
    },
    eventHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    eventTitle: {
      fontSize: fonts.lg,
      fontWeight: '700',
      color: colors.text,
      flex: 1,
      marginRight: 12,
    },
    eventStatsRow: {
      flexDirection: 'row',
      marginBottom: 16,
    },
    eventStat: {
      flex: 1,
    },
    eventStatNumber: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.text,
    },
    eventStatLabel: {
      fontSize: fonts.xs,
      color: colors.textSecondary,
      marginTop: 2,
    },
    progressBarBg: {
      height: 3,
      backgroundColor: colors.border,
      borderRadius: 2,
      marginBottom: 12,
      overflow: 'hidden',
    },
    progressBarFill: {
      height: 3,
      borderRadius: 2,
    },
    targetDate: {
      fontSize: fonts.xs,
      color: colors.textMuted,
    },
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 40,
    },
    emptyTitle: {
      fontSize: fonts.xl,
      fontWeight: '700',
      color: colors.text,
      marginTop: 16,
    },
    emptyMessage: {
      fontSize: fonts.sm,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 8,
      lineHeight: 20,
    },
    actionButton: {
      paddingVertical: 14,
      paddingHorizontal: 32,
      borderRadius: 12,
      marginTop: 24,
    },
    actionButtonText: {
      fontSize: fonts.base,
      fontWeight: '600',
    },
  })
