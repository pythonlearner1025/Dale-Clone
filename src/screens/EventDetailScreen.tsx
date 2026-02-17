import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import { useTheme, ThemeColors, FontSizes } from '../context/ThemeContext'
import { DotGrid } from '../components/DotGrid'
import { api } from '../api'
import { DaleEvent } from './EventsScreen'

interface EventDetailScreenProps {
  event: DaleEvent
  onBack: () => void
  onEdit: (event: DaleEvent) => void
  onDeleted: () => void
}

export function EventDetailScreen({ event, onBack, onEdit, onDeleted }: EventDetailScreenProps) {
  const { colors, fonts } = useTheme()
  const styles = createStyles(colors, fonts)

  const now = new Date()
  const start = new Date(event.start_date)
  const target = new Date(event.target_date)
  const totalMs = target.getTime() - start.getTime()
  const elapsedMs = now.getTime() - start.getTime()
  const totalDays = Math.max(1, Math.ceil(totalMs / (1000 * 60 * 60 * 24)))
  const elapsedDays = Math.max(0, Math.min(totalDays, Math.ceil(elapsedMs / (1000 * 60 * 60 * 24))))
  const daysLeft = Math.max(0, totalDays - elapsedDays)

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const handleDelete = () => {
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
            onDeleted()
          } catch (err) {
            console.log('Failed to delete event:', err)
          }
        },
      },
    ])
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Icon name="chevron-left" size={28} color={colors.text} />
      </TouchableOpacity>

      <Text style={styles.title}>{event.title}</Text>
      <Text style={styles.dateRange}>
        {formatDate(event.start_date)} → {formatDate(event.target_date)}
      </Text>

      <View style={styles.actionsRow}>
        <TouchableOpacity style={[styles.actionCircle, { backgroundColor: '#3b82f6' }]} onPress={() => onEdit(event)}>
          <Icon name="pencil-outline" size={20} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionCircle, { backgroundColor: colors.danger }]} onPress={handleDelete}>
          <Icon name="trash-can-outline" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Progress</Text>

      <View style={styles.gridCard}>
        <DotGrid totalDots={totalDays} filledDots={elapsedDays} accentColor={colors.text} />
      </View>

      <View style={styles.bottomStats}>
        <View style={styles.bottomStat}>
          <Text style={styles.bottomStatNumber}>{elapsedDays}</Text>
          <Text style={styles.bottomStatLabel}>Days Completed</Text>
        </View>
        <View style={styles.bottomDivider} />
        <View style={styles.bottomStat}>
          <Text style={styles.bottomStatNumber}>{daysLeft}</Text>
          <Text style={styles.bottomStatLabel}>Days Remaining</Text>
        </View>
      </View>
    </ScrollView>
  )
}

const createStyles = (colors: ThemeColors, fonts: FontSizes) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      paddingTop: 60,
      paddingHorizontal: 20,
      paddingBottom: 40,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    title: {
      fontSize: 28,
      fontWeight: '800',
      color: colors.text,
      textAlign: 'center',
    },
    dateRange: {
      fontSize: fonts.sm,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 8,
      marginBottom: 20,
    },
    actionsRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 12,
      marginBottom: 32,
    },
    actionCircle: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sectionTitle: {
      fontSize: fonts.base,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: 16,
    },
    gridCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 24,
    },
    bottomStats: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 24,
      alignItems: 'center',
    },
    bottomStat: {
      flex: 1,
      alignItems: 'center',
    },
    bottomStatNumber: {
      fontSize: 32,
      fontWeight: '700',
      color: colors.text,
    },
    bottomStatLabel: {
      fontSize: fonts.xs,
      color: colors.textSecondary,
      marginTop: 4,
    },
    bottomDivider: {
      width: 1,
      height: 48,
      backgroundColor: colors.border,
    },
  })
