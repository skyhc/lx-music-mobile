import { useState } from 'react'
import { View, StyleSheet } from 'react-native'
import Text from './Text'
import { useTheme } from '@/store/theme/hook'

export default ({ name, singer, album, source, interval, active = false, showAlbum = true, showInterval = true }: {
  name: string
  singer: string
  album?: string
  source?: string
  interval?: string | null
  active?: boolean
  showAlbum?: boolean
  showInterval?: boolean
}) => {
  const theme = useTheme()
  const [width, setWidth] = useState(0)
  const color = active ? theme['c-primary-font'] : theme['c-font']
  const secondary = active ? theme['c-primary-font'] : theme['c-font-label']
  return <View style={styles.row} onLayout={e => setWidth(e.nativeEvent.layout.width)}>
    <Text size={14} numberOfLines={1} color={color} style={styles.name}>{name}</Text>
    {source && width >= 480 ? <Text size={10} color={secondary} style={styles.source}>{source}</Text> : null}
    <Text size={12} numberOfLines={1} color={secondary} style={styles.singer}>{singer}</Text>
    {showAlbum && width >= 600 ? <Text size={12} numberOfLines={1} color={secondary} style={styles.album}>{album ?? ''}</Text> : null}
    {showInterval && width >= 320 ? <Text size={12} numberOfLines={1} color={secondary} style={styles.time}>{interval ?? ''}</Text> : null}
  </View>
}
const styles = StyleSheet.create({
  row: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 10 },
  name: { flex: 1.5, minWidth: 0 }, singer: { flex: 1, minWidth: 0 }, album: { flex: 1, minWidth: 0 },
  source: { width: 24, textAlign: 'center' }, time: { width: 46, textAlign: 'right' },
})
