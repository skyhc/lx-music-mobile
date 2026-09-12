import { useState } from 'react'
import { View, StyleSheet } from 'react-native'
import Text from './Text'
import { useTheme } from '@/store/theme/hook'

export interface SongRowProps {
  name: string
  singer: string
  album?: string
  source?: string
  interval?: string | null
  active?: boolean
  showAlbum?: boolean
  showInterval?: boolean
  header?: boolean
}
// Shared by the header and each song: breakpoints measure the row, not the screen.
export default ({ name, singer, album, source, interval, active = false, showAlbum = true, showInterval = true, header = false }: SongRowProps) => {
  const theme = useTheme()
  const [width, setWidth] = useState(0)
  const color = active ? theme['c-primary-font'] : theme['c-font']
  const secondary = header ? color : active ? theme['c-primary-font'] : theme['c-font-label']
  const weight = header ? '600' : '400'
  return <View style={styles.row} onLayout={e => setWidth(e.nativeEvent.layout.width)}>
    <Text size={14} numberOfLines={1} color={color} style={[styles.name, { fontWeight: weight }]}>
      {name}{source && width >= 480 ? <Text size={10} color={secondary}>  {source}</Text> : null}
    </Text>
    <Text size={13} numberOfLines={1} color={secondary} style={[styles.singer, { fontWeight: weight }]}>{singer}</Text>
    {showAlbum && width >= 540 ? <Text size={13} numberOfLines={1} color={secondary} style={[styles.album, { fontWeight: weight }]}>{album ?? ''}</Text> : null}
    {showInterval && width >= 320 ? <Text size={13} numberOfLines={1} color={secondary} style={[styles.time, { fontWeight: weight }]}>{interval ?? ''}</Text> : null}
  </View>
}
const styles = StyleSheet.create({
  row: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 10 },
  name: { flex: 1.5, minWidth: 0 }, singer: { flex: 1, minWidth: 0 }, album: { flex: 1, minWidth: 0 },
  time: { width: 52, textAlign: 'right', fontVariant: ['tabular-nums'] },
})
