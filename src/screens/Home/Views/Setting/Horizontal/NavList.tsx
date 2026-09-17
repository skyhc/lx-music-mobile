import { memo, useEffect, useRef, useState } from 'react'
import { View, TouchableOpacity, FlatList, type FlatListProps } from 'react-native'

import { Icon } from '@/components/common/Icon'
import { useTheme } from '@/store/theme/hook'
import { createStyle } from '@/utils/tools'
import Text from '@/components/common/Text'
import { scaleSizeH } from '@/utils/pixelRatio'
import { SETTING_SCREENS, type SettingScreenIds } from '../Main'
import { useI18n } from '@/lang'
import { useLibraryPage } from '@/core/library/page'

type FlatListType = FlatListProps<SettingScreenIds>
const ITEM_HEIGHT = scaleSizeH(40)

const ListItem = memo(({ id, activeId, onPress }: { onPress: (item: SettingScreenIds) => void, activeId: string, id: SettingScreenIds }) => {
  const theme = useTheme()
  const t = useI18n()
  const active = activeId == id
  const label = id === 'webdav' ? 'WebDAV' : t(`setting_${id}`)
  return (
    <View style={{ ...styles.listItem, height: ITEM_HEIGHT }}>
      {active ? <Icon style={styles.listActiveIcon} name="chevron-right" size={12} color={theme['c-primary-font']} /> : null}
      <TouchableOpacity style={styles.listName} onPress={() => { onPress(id) }}>
        <Text numberOfLines={1} size={16} color={active ? theme['c-primary-font'] : theme['c-font']}>{label}</Text>
      </TouchableOpacity>
    </View>
  )
}, (prevProps, nextProps) => !!(prevProps.id === nextProps.id && prevProps.activeId != nextProps.id && nextProps.activeId != nextProps.id))

export default ({ onChangeId }: { onChangeId: (id: SettingScreenIds) => void }) => {
  const flatListRef = useRef<FlatList>(null)
  const [activeId, setActiveId] = useState(global.lx.settingActiveId)
  const requested = useLibraryPage()

  useEffect(() => {
    if (!requested.screen) return
    setActiveId(requested.screen)
    global.lx.settingActiveId = requested.screen
  }, [requested.revision, requested.screen])

  const handleChangeId = (id: SettingScreenIds) => {
    onChangeId(id)
    setActiveId(id)
    global.lx.settingActiveId = id
  }
  const renderItem: FlatListType['renderItem'] = ({ item }) => <ListItem key={item} id={item} activeId={activeId} onPress={handleChangeId} />
  const getkey: FlatListType['keyExtractor'] = item => item
  const getItemLayout: FlatListType['getItemLayout'] = (data, index) => ({ length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index })

  return <FlatList ref={flatListRef} style={styles.container} data={SETTING_SCREENS} maxToRenderPerBatch={9} windowSize={9} removeClippedSubviews={true}
    initialNumToRender={18} renderItem={renderItem} keyExtractor={getkey} getItemLayout={getItemLayout} />
}

const styles = createStyle({
  container: { flexShrink: 1, flexGrow: 0 },
  listItem: { height: 'auto', flexDirection: 'row', alignItems: 'center', paddingRight: 10, paddingLeft: 10 },
  listActiveIcon: { marginLeft: 3, textAlign: 'center' },
  listName: { height: '100%', justifyContent: 'center', flexGrow: 1, flexShrink: 1, paddingLeft: 5 },
})
