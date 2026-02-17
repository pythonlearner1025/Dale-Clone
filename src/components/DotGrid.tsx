import { View, StyleSheet } from 'react-native'
import { useTheme } from '../context/ThemeContext'

interface DotGridProps {
  totalDots: number
  filledDots: number
  accentColor?: string
}

export function DotGrid({ totalDots, filledDots, accentColor }: DotGridProps) {
  const { colors } = useTheme()
  const filled = accentColor || colors.text

  const dots = []
  for (let i = 0; i < totalDots; i++) {
    const isFilled = i < filledDots
    dots.push(
      <View
        key={i}
        style={[
          styles.dot,
          { backgroundColor: isFilled ? filled : colors.border },
          isFilled && styles.dotFilled,
        ]}
      />
    )
  }

  return <View style={styles.grid}>{dots}</View>
}

const DOT_SIZE = 10
const DOT_GAP = 4.5

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DOT_GAP,
    justifyContent: 'flex-start',
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
  },
  dotFilled: {
    opacity: 1,
  },
})
