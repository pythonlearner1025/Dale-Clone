import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { useTheme, ThemeColors, FontSizes } from '../context/ThemeContext'
import { DotGrid } from '../components/DotGrid'

function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0)
  const diff = date.getTime() - start.getTime()
  const oneDay = 1000 * 60 * 60 * 24
  return Math.floor(diff / oneDay)
}

function getDaysInYear(year: number): number {
  return ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0) ? 366 : 365
}

export function YearScreen() {
  const { colors, fonts } = useTheme()
  const styles = createStyles(colors, fonts)

  const now = new Date()
  const year = now.getFullYear()
  const totalDays = getDaysInYear(year)
  const dayOfYear = getDayOfYear(now)
  const daysLeft = totalDays - dayOfYear
  const percentage = Math.round((dayOfYear / totalDays) * 100)

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerSection}>
        <Text style={styles.yearText}>{year}</Text>
        <Text style={styles.subtitleText}>Day {dayOfYear} · {percentage}%</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{daysLeft}</Text>
          <Text style={styles.statLabel}>days left</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{dayOfYear}</Text>
          <Text style={styles.statLabel}>days passed</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{percentage}%</Text>
          <Text style={styles.statLabel}>complete</Text>
        </View>
      </View>

      <View style={styles.gridCard}>
        <DotGrid totalDots={totalDays} filledDots={dayOfYear} accentColor={colors.text} />
      </View>

      <Text style={styles.motivationalText}>
        Make every remaining dot count.
      </Text>
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
      paddingTop: 70,
      paddingHorizontal: 20,
      paddingBottom: 40,
    },
    headerSection: {
      marginBottom: 24,
    },
    yearText: {
      fontSize: 48,
      fontWeight: '800',
      color: colors.text,
      letterSpacing: -1,
    },
    subtitleText: {
      fontSize: fonts.base,
      color: colors.textSecondary,
      marginTop: 4,
    },
    statsRow: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 24,
      alignItems: 'center',
    },
    statItem: {
      flex: 1,
      alignItems: 'center',
    },
    statNumber: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.text,
    },
    statLabel: {
      fontSize: fonts.xs,
      color: colors.textSecondary,
      marginTop: 4,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    statDivider: {
      width: 1,
      height: 40,
      backgroundColor: colors.border,
    },
    gridCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 24,
    },
    motivationalText: {
      fontSize: fonts.sm,
      color: colors.textMuted,
      textAlign: 'center',
      fontStyle: 'italic',
    },
  })
