import SongTableHeader from '@/components/common/SongTableHeader'
import { useEffect, useRef, useState } from 'react'
import { FlatList, TouchableOpacity } from 'react-native'
import Popup, { type PopupType } from '@/components/common/Popup'
import Text from '@/components/common/Text'
import { getList } from '@/core/player/playInfo'
import { playListById } from '@/core/player/player'
import { markTimeoutExitInteraction } from '@/core/player/timeoutExit'
import { usePlayInfo, usePlayMusicInfo } from '@/store/player/hook'
import { toast } from '@/utils/tools'
import Btn from './Btn'
import PlaylistIcon from '@/components/common/PlaylistIcon'
import SongRowContent from '@/components/common/SongRowContent'

type Music = LX.Music.MusicInfo | LX.Download.ListItem

export default () => {
  const popupRef = useRef<PopupType>(null)
  const [list, setList] = useState<Music[]>([])
  const [listId, setListId] = useState<string | null>(null)
  const playInfo = usePlayInfo()
  const current = usePlayMusicInfo()

  useEffect(() => {
    const update = (ids: string[]) => { if (listId && ids.includes(listId)) setList([...getList(listId)]) }
    global.app_event.on('myListMusicUpdate', update)
    return () => { global.app_event.off('myListMusicUpdate', update) }
  }, [listId])
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
      <Btn label="播放列表" onPress={show}><PlaylistIcon /></Btn>
      <Popup ref={popupRef} position="left" kind="list" title="播放列表">
        <SongTableHeader numbered={false} actions={false} />
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
              <TouchableOpacity accessibilityRole="button" onPress={() => { select(item) }} style={{ height: 54, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' }}>
                <SongRowContent name={info.name} singer={info.singer} album={info.meta.albumName} interval={info.interval} active={active} />
              </TouchableOpacity>
            )
          }}
        />
      </Popup>
    </>
  )
}
