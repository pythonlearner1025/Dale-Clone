import { NativeModules, Platform } from 'react-native'

const { WidgetDataModule } = NativeModules

interface WidgetEvent {
  id: string
  title: string
  target_date: string
  start_date: string
}

export function updateWidgetEvents(events: WidgetEvent[]) {
  if (Platform.OS !== 'ios' || !WidgetDataModule) return
  try {
    const json = JSON.stringify(events)
    WidgetDataModule.updateEvents(json)
  } catch (e) {
    console.log('Failed to update widget:', e)
  }
}
