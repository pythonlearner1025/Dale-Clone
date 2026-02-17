import { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Platform } from 'react-native'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import { useTheme, ThemeColors, FontSizes } from '../context/ThemeContext'
import { api, getCurrentUserId } from '../api'
import { DaleEvent } from './EventsScreen'

interface AddEventScreenProps {
  event?: DaleEvent | null
  onSave: () => void
  onCancel: () => void
}

function formatDateForInput(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function parseDateInput(str: string): Date | null {
  const parts = str.split('-')
  if (parts.length !== 3) return null
  const y = parseInt(parts[0], 10)
  const m = parseInt(parts[1], 10) - 1
  const d = parseInt(parts[2], 10)
  if (isNaN(y) || isNaN(m) || isNaN(d)) return null
  const date = new Date(y, m, d)
  if (date.getFullYear() !== y || date.getMonth() !== m || date.getDate() !== d) return null
  return date
}

export function AddEventScreen({ event, onSave, onCancel }: AddEventScreenProps) {
  const { colors, fonts } = useTheme()
  const styles = createStyles(colors, fonts)

  const isEditing = !!event

  const [title, setTitle] = useState(event?.title || '')
  const [targetDate, setTargetDate] = useState(
    event ? formatDateForInput(new Date(event.target_date)) : ''
  )
  const [startDate, setStartDate] = useState(
    event ? formatDateForInput(new Date(event.start_date)) : formatDateForInput(new Date())
  )
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Please enter an event name')
      return
    }
    const parsedTarget = parseDateInput(targetDate)
    if (!parsedTarget) {
      setError('Please enter a valid target date (YYYY-MM-DD)')
      return
    }
    const parsedStart = parseDateInput(startDate)
    if (!parsedStart) {
      setError('Please enter a valid start date (YYYY-MM-DD)')
      return
    }
    if (parsedTarget <= parsedStart) {
      setError('Target date must be after start date')
      return
    }

    setIsSaving(true)
    setError('')

    try {
      if (isEditing && event) {
        await api.request(`/table/events/edit/${event.id}?returning=id`, {
          method: 'POST',
          body: JSON.stringify({
            title: title.trim(),
            target_date: parsedTarget.toISOString(),
            start_date: parsedStart.toISOString(),
          }),
        })
      } else {
        const userId = getCurrentUserId()
        if (!userId) {
          setError('Not authenticated')
          setIsSaving(false)
          return
        }
        await api.request('/table/events/insert', {
          method: 'POST',
          body: JSON.stringify({
            values: {
              title: title.trim(),
              target_date: parsedTarget.toISOString(),
              start_date: parsedStart.toISOString(),
              owner_id: userId,
            },
            returning: '*',
          }),
        })
      }
      onSave()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save event')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <TouchableOpacity style={styles.backButton} onPress={onCancel}>
        <Icon name="chevron-left" size={28} color={colors.text} />
      </TouchableOpacity>

      <Text style={styles.screenTitle}>{isEditing ? 'Edit Event' : 'New Event'}</Text>

      <Text style={styles.label}>Event Name</Text>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholder="e.g. Trip to Paris"
        placeholderTextColor={colors.textMuted}
        autoFocus
      />

      <Text style={styles.label}>Start Date</Text>
      <TextInput
        style={styles.input}
        value={startDate}
        onChangeText={setStartDate}
        placeholder="YYYY-MM-DD"
        placeholderTextColor={colors.textMuted}
        keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'default'}
      />

      <Text style={styles.label}>Target Date</Text>
      <TextInput
        style={styles.input}
        value={targetDate}
        onChangeText={setTargetDate}
        placeholder="YYYY-MM-DD"
        placeholderTextColor={colors.textMuted}
        keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'default'}
      />

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <TouchableOpacity
        style={[styles.saveButton, isSaving && { opacity: 0.6 }]}
        onPress={handleSave}
        disabled={isSaving}
        activeOpacity={0.8}
      >
        <Text style={styles.saveButtonText}>{isSaving ? 'Saving...' : (isEditing ? 'Update Event' : 'Create Event')}</Text>
      </TouchableOpacity>
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
    screenTitle: {
      fontSize: 28,
      fontWeight: '800',
      color: colors.text,
      marginBottom: 32,
    },
    label: {
      fontSize: fonts.sm,
      color: colors.textSecondary,
      fontWeight: '600',
      marginBottom: 8,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    input: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      paddingVertical: 16,
      paddingHorizontal: 16,
      color: colors.text,
      fontSize: fonts.base,
      marginBottom: 24,
    },
    errorText: {
      color: colors.danger,
      fontSize: fonts.sm,
      marginBottom: 16,
      textAlign: 'center',
    },
    saveButton: {
      backgroundColor: colors.text,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      marginTop: 8,
    },
    saveButtonText: {
      color: colors.background,
      fontSize: fonts.base,
      fontWeight: '700',
    },
  })
