import { useRef, useState } from 'react'
import { FlatList, TouchableOpacity, View } from 'react-native'
import Popup, { type PopupType } from '@/components/common/Popup'
import Text from '@/components/common/Text'
import { getList } from '@/core/player/playInfo'
import { playListById } from '@/core/player/player'
import { markTimeoutExitInteraction } from '@/core/player/timeoutExit'
import { usePlayInfo, usePlayMusicInfo } from '@/store/player/hook'
import { useTheme } from '@/store/theme/hook'
import { toast } from '@/utils/tools'
import Btn from './Btn'

type Music = LX.Music.MusicInfo | LX.Download.ListItem

export default () => {
  const popupRef = useRef<PopupType>(null)
  const [list, setList] = useState<Music[]>([])
  const [listId, setListId] = useState<string | null>(null)
  const playInfo = usePlayInfo()
  const current = usePlayMusicInfo()
  const theme = useTheme()

  const show = () => {
    const id = playInfo.playerListId ?? current.listId
    setListId(id)
    setList([...getList(id)])
    popupRef.current?.setVisible(true)
  }
  const select = (item: Music) => {
    if (!listId) return
    markTimeoutExitInteraction()
    void playListById(listId, item.id).then(() => {
      popupRef.current?.setVisible(false)
    }).catch(() => { toast('播放失败，请重试') })
  }

  return (
    <>
      <Btn icon="list-order" onPress={show} />
      <Popup ref={popupRef} position="left" title="播放列表">
        <FlatList<Music>
          style={{ flex: 1 }}
          data={list}
          extraData={current.musicInfo?.id}
          keyExtractor={item => item.id}
          ListEmptyComponent={<Text style={{ padding: 20 }}>当前播放列表为空</Text>}
          renderItem={({ item }) => {
            const info = 'progress' in item ? item.metadata.musicInfo : item
            const active = item.id == current.musicInfo?.id
            return (
              <TouchableOpacity accessibilityRole="button" onPress={() => { select(item) }} style={{ minHeight: 56, paddingHorizontal: 20, paddingVertical: 10 }}>
                <View>
                  <Text numberOfLines={1} color={active ? theme['c-primary-font-active'] : undefined}>{info.name}</Text>
                  <Text numberOfLines={1} size={12} color={theme['c-font-label']}>{info.singer}</Text>
                </View>
              </TouchableOpacity>
            )
          }}
        />
      </Popup>
    </>
  )
}
