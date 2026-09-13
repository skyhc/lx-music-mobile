import { useState } from 'react'
import { View, StyleSheet } from 'react-native'
import Text from './Text'
import { useTheme } from '@/store/theme/hook'
import { useHorizontalMode } from '@/utils/hooks'
import { songColumns, SONG_COLUMN_GAP, SONG_TIME_WIDTH } from '@/utils/songLayout'

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
export default ({ name, singer, album, source, interval, active = false, showAlbum = true, showInterval = true, header = false }: SongRowProps) => {
  const theme = useTheme()
  const horizontal = useHorizontalMode()
  const [width, setWidth] = useState(0)
  const columns = songColumns(width, horizontal, showAlbum, showInterval)
  const color = active ? theme['c-primary-font'] : theme['c-font']
  const secondary = header ? color : active ? theme['c-primary-font'] : theme['c-font-label']
  const weight = header ? '600' : '400'
  if (header && columns.compact) return null
  return <View style={styles.row} onLayout={e => setWidth(e.nativeEvent.layout.width)}>
    {columns.compact ? <View style={styles.metadata}>
      <Text size={16} numberOfLines={1} color={color}>{name}</Text>
      <Text size={12} numberOfLines={1} color={secondary} style={styles.subtitle}>
        {source ? <Text size={12} color={theme['c-primary-font']}>{source.toUpperCase()}  </Text> : null}{singer}
      </Text>
    </View> : <>
      <Text size={14} numberOfLines={1} color={color} style={[styles.column, { fontWeight: weight }]}>{name}</Text>
      <Text size={13} numberOfLines={1} color={secondary} style={[styles.column, { fontWeight: weight }]}>{singer}</Text>
      {columns.album ? <Text size={13} numberOfLines={1} color={secondary} style={[styles.column, { fontWeight: weight }]}>{album ?? ''}</Text> : null}
    </>}
    {columns.time ? <Text size={13} numberOfLines={1} color={secondary} style={[styles.time, { fontWeight: weight }]}>{interval ?? ''}</Text> : null}
  </View>
}
const styles = StyleSheet.create({
  row: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: SONG_COLUMN_GAP, paddingRight: 14 },
  column: { flex: 1, minWidth: 0 },
  metadata: { flex: 1, minWidth: 0, justifyContent: 'center' },
  subtitle: { paddingTop: 3 },
  time: { width: SONG_TIME_WIDTH, flexShrink: 0, textAlign: 'right', fontVariant: ['tabular-nums'] },
})
