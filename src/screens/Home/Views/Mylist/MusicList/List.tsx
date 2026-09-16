import { LIST_IDS } from '@/config/constant'
import useSongKeyboard from '@/utils/hooks/useSongKeyboard'
import SongTableHeader from '@/components/common/SongTableHeader'
import { playList } from '@/core/player/player'
import { useMemo, useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react'
import { Platform, View, FlatList, type NativeScrollEvent, type NativeSyntheticEvent, type FlatListProps } from 'react-native'

import { findMusicIndex, resolveLibraryLocation, type LibraryLocation } from '@/core/listLocation'
import listState from '@/store/list/state'
import playerState from '@/store/player/state'
import { getListPosition, getListPrevSelectId, saveListPosition } from '@/utils/data'
// import { useMusicList } from '@/store/list/hook'
import { getListMusics, setActiveList } from '@/core/list'
import ListItem, { ITEM_HEIGHT } from './ListItem'
import { createStyle, getRowInfo, toast } from '@/utils/tools'
import { usePlayInfo, usePlayMusicInfo } from '@/store/player/hook'
import type { Position } from './ListMenu'
import type { SelectMode } from './MultipleModeBar'
import { useActiveListId } from '@/store/list/hook'
import { useSettingValue } from '@/store/setting/hook'

type FlatListType = FlatListProps<LX.Music.MusicInfo>

export interface ListProps {
  onShowMenu: (musicInfo: LX.Music.MusicInfo, index: number, position: Position) => void
  onMuiltSelectMode: () => void
  onSelectAll: (isAll: boolean) => void
}
export interface ListType {
  setIsMultiSelectMode: (isMultiSelectMode: boolean) => void
  setSelectMode: (mode: SelectMode) => void
  selectAll: (isAll: boolean) => void
  getSelectedList: () => LX.List.ListMusics
  scrollToInfo: (info: LX.Music.MusicInfo) => void
  scrollToTop: () => void
}

const usePlayIndex = (musics: LX.List.ListMusics) => {
  const activeListId = useActiveListId()
  const playMusicInfo = usePlayMusicInfo()
  const playInfo = usePlayInfo()

  const playIndex = useMemo(() => {
    return playMusicInfo.listId == activeListId ? findMusicIndex(musics, playMusicInfo.musicInfo?.id ?? '') : -1
  }, [activeListId, playInfo.playIndex, playMusicInfo.listId, playMusicInfo.musicInfo?.id, musics])

  return playIndex
}


const List = forwardRef<ListType, ListProps>(({ onShowMenu, onMuiltSelectMode, onSelectAll }, ref) => {
  // const t = useI18n()
  const flatListRef = useRef<FlatList>(null)
  const [currentList, setList] = useState<LX.List.ListMusics>([])
  const listFirstScrollRef = useRef(false)
  const isMultiSelectModeRef = useRef(false)
  const selectModeRef = useRef<SelectMode>('single')
  const prevSelectIndexRef = useRef(-1)
  const [selectedList, setSelectedList] = useState<LX.List.ListMusics>([])
  const selectedListRef = useRef<LX.List.ListMusics>([])
  const currentListIdRef = useRef('')
  const waitJumpListPositionRef = useRef<LibraryLocation | null>(null)
  const displayedListRef = useRef<LX.List.ListMusics>([])
  const locateGenerationRef = useRef(0)
  const rowInfo = useRef(getRowInfo())
  const showAlbumPreference = useSettingValue('list.isShowAlbumName')
  const isShowAlbumName = Platform.OS == 'ios' || showAlbumPreference
  const isShowInterval = useSettingValue('list.isShowInterval')
  // console.log('render music list')

  useImperativeHandle(ref, () => ({
    setIsMultiSelectMode(isMultiSelectMode) {
      isMultiSelectModeRef.current = isMultiSelectMode
      if (!isMultiSelectMode) {
        prevSelectIndexRef.current = -1
        handleUpdateSelectedList([])
      }
    },
    setSelectMode(mode) {
      selectModeRef.current = mode
    },
    selectAll(isAll) {
      let list: LX.List.ListMusics
      if (isAll) {
        list = [...currentList]
      } else {
        list = []
      }
      selectedListRef.current = list
      setSelectedList(list)
    },
    getSelectedList() {
      return selectedListRef.current
    },
    scrollToInfo(info) {
      const id = listState.activeListId
      void getListMusics(id).then((list) => {
        if (currentListIdRef.current != id) return
        const index = list.findIndex(m => m.id == info.id)
        if (index < 0) return
        flatListRef.current?.scrollToIndex({ index: Math.floor(index / (rowInfo.current.rowNum ?? 1)), viewPosition: 0.3, animated: true })
      })
    },
    scrollToTop() {
      flatListRef.current?.scrollToOffset({
        offset: 0,
        animated: true,
      })
    },
  }))

  useEffect(() => {
    let mounted = true
    let isUpdateingList = true
    let loadGeneration = 0
    let jumpAfterLoad = global.lx.jumpMyListPosition
    global.lx.jumpMyListPosition = false
    const scrollToMusic = (musicId: string, list: LX.List.ListMusics, animated: boolean) => {
      const index = findMusicIndex(list, musicId)
      if (index < 0) return false
      const row = Math.floor(index / (rowInfo.current.rowNum ?? 1))
      // Every row has a fixed measured height (also used by getItemLayout).
      flatListRef.current?.scrollToIndex({ index: row, viewPosition: 0.3, animated })
      return true
    }
    const updateList = (id: string) => {
      if (!mounted) return
      if (id != LIST_IDS.TEMP && !listState.allList.some(list => list.id == id)) id = LIST_IDS.DEFAULT
      if (currentListIdRef.current == id) return
      if (waitJumpListPositionRef.current?.listId != id) waitJumpListPositionRef.current = null
      const generation = ++loadGeneration
      isUpdateingList = true
      setList([])
      displayedListRef.current = []
      currentListIdRef.current = id
      void Promise.all([getListMusics(id), getListPosition(id)]).then(([list, position]) => {
        requestAnimationFrame(() => {
          if (!mounted || currentListIdRef.current != id || generation != loadGeneration) return
          selectedListRef.current = []
          setSelectedList([])
          displayedListRef.current = [...list]
          setList(displayedListRef.current)
          requestAnimationFrame(() => {
            if (!mounted || currentListIdRef.current != id || generation != loadGeneration) return
            isUpdateingList = false
            listFirstScrollRef.current = true
            const pending = waitJumpListPositionRef.current
            waitJumpListPositionRef.current = null
            if (pending?.listId == id && pending.musicId == playerState.playMusicInfo.musicInfo?.id) {
              if (scrollToMusic(pending.musicId, displayedListRef.current, false)) return
            }
            flatListRef.current?.scrollToOffset({ offset: position, animated: false })
            if (jumpAfterLoad) handleJumpPosition()
          })
        })
      }).catch(() => {
        if (!mounted || currentListIdRef.current != id || generation != loadGeneration) return
        isUpdateingList = false
        waitJumpListPositionRef.current = null
        toast('读取列表失败，请重试')
      })
    }
    const handleChange = (ids: string[]) => {
      if (!ids.includes(listState.activeListId)) return
      const id = listState.activeListId
      const generation = ++loadGeneration
      void getListMusics(id).then((list) => {
        if (!mounted || currentListIdRef.current != id || generation != loadGeneration) return
        selectedListRef.current = []
        setSelectedList([])
        displayedListRef.current = [...list]
        setList(displayedListRef.current)
        requestAnimationFrame(() => {
          if (!mounted || currentListIdRef.current != id || generation != loadGeneration) return
          isUpdateingList = false
          const pending = waitJumpListPositionRef.current
          waitJumpListPositionRef.current = null
          if (pending?.listId == id && pending.musicId == playerState.playMusicInfo.musicInfo?.id) {
            scrollToMusic(pending.musicId, displayedListRef.current, true)
          }
          if (jumpAfterLoad) handleJumpPosition()
        })
      }).catch(() => {
        if (!mounted || currentListIdRef.current != id || generation != loadGeneration) return
        isUpdateingList = false
        waitJumpListPositionRef.current = null
        toast('读取列表失败，请重试')
      })
    }

    const handleJumpPosition = () => {
      jumpAfterLoad = false
      const musicId = playerState.playMusicInfo.musicInfo?.id
      const generation = ++locateGenerationRef.current
      const activeAtRequest = listState.activeListId
      if (!musicId) { toast('当前没有正在播放的歌曲'); return }
      const isCurrent = () => mounted && generation == locateGenerationRef.current &&
        musicId == playerState.playMusicInfo.musicInfo?.id && listState.activeListId == activeAtRequest
      void resolveLibraryLocation({ musicId, activeListId: activeAtRequest,
        playingListId: playerState.playMusicInfo.listId,
        listIds: listState.allList.map(list => list.id), readList: getListMusics, isCurrent,
      }).then(location => {
        if (!isCurrent()) return
        if (!location) { toast('正在播放的歌曲不在我的列表中'); return }
        if (location.listId == currentListIdRef.current && !isUpdateingList) {
          if (!scrollToMusic(location.musicId, displayedListRef.current, true)) {
            waitJumpListPositionRef.current = location
            handleChange([location.listId])
          }
        } else {
          // Set pending before emitting mylistToggled; event delivery is synchronous.
          waitJumpListPositionRef.current = location
          if (location.listId != listState.activeListId) setActiveList(location.listId)
          else if (currentListIdRef.current != location.listId) updateList(location.listId)
        }
      }).catch(() => { if (isCurrent()) toast('定位失败，请重试') })
    }
    const initialize = (savedId: string) => {
      if (!mounted) return
      if (!currentListIdRef.current) {
        const requested = listState.activeListId || savedId
        const id = requested == LIST_IDS.TEMP || listState.allList.some(list => list.id == requested)
          ? requested : LIST_IDS.DEFAULT
        if (listState.activeListId != id) setActiveList(id)
        updateList(id)
      } else if (jumpAfterLoad && !isUpdateingList) handleJumpPosition()
    }
    void getListPrevSelectId().then(initialize).catch(() => initialize(LIST_IDS.DEFAULT))

    global.state_event.on('mylistToggled', updateList)
    global.app_event.on('myListMusicUpdate', handleChange)
    global.app_event.on('jumpListPosition', handleJumpPosition)

    return () => {
      mounted = false
      ++locateGenerationRef.current
      waitJumpListPositionRef.current = null
      global.state_event.off('mylistToggled', updateList)
      global.app_event.off('myListMusicUpdate', handleChange)
      global.app_event.off('jumpListPosition', handleJumpPosition)
    }
  }, [])

  const activeIndex = usePlayIndex(currentList)
  const handlePlay = (index: number) => {
    void playList(listState.activeListId, index)
  }

  const handleUpdateSelectedList = (newList: LX.List.ListMusics) => {
    if (selectedListRef.current.length && newList.length == currentList.length) onSelectAll(true)
    else if (selectedListRef.current.length == currentList.length) onSelectAll(false)
    selectedListRef.current = newList
    setSelectedList(newList)
  }
  const handleSelect = (item: LX.Music.MusicInfo, pressIndex: number) => {
    let newList: LX.List.ListMusics
    if (selectModeRef.current == 'single') {
      prevSelectIndexRef.current = pressIndex
      const index = selectedListRef.current.indexOf(item)
      if (index < 0) {
        newList = [...selectedListRef.current, item]
      } else {
        newList = [...selectedListRef.current]
        newList.splice(index, 1)
      }
    } else {
      if (selectedListRef.current.length) {
        const prevIndex = prevSelectIndexRef.current
        const currentIndex = pressIndex
        if (prevIndex == currentIndex) {
          newList = []
        } else if (currentIndex > prevIndex) {
          newList = currentList.slice(prevIndex, currentIndex + 1)
        } else {
          newList = currentList.slice(currentIndex, prevIndex + 1)
          newList.reverse()
        }
      } else {
        newList = [item]
        prevSelectIndexRef.current = pressIndex
      }
    }

    handleUpdateSelectedList(newList)
  }

  const handlePress = (item: LX.Music.MusicInfo, index: number) => {
    // console.log(global.lx.homePagerIdle)
    requestAnimationFrame(() => {
      // console.log(global.lx.homePagerIdle)
      if (!global.lx.homePagerIdle) return
      if (isMultiSelectModeRef.current) {
        handleSelect(item, index)
      } else {
        handlePlay(index)
      }
    })
  }

  const handleLongPress = (item: LX.Music.MusicInfo, index: number) => {
    if (isMultiSelectModeRef.current) return
    prevSelectIndexRef.current = index
    handleUpdateSelectedList([item])
    onMuiltSelectMode()
  }

  const handleScroll = ({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (listFirstScrollRef.current) {
      listFirstScrollRef.current = false
      return
    }
    void saveListPosition(listState.activeListId, nativeEvent.contentOffset.y)
  }


  const keyboardId = useSongKeyboard(currentList, handlePress, index => {
    flatListRef.current?.scrollToIndex({ index: Math.floor(index / (rowInfo.current.rowNum ?? 1)), viewPosition: 0.4, animated: false })
  }, playerState.playMusicInfo.musicInfo?.id)

  const renderItem: FlatListType['renderItem'] = ({ item, index }) => (
    <ListItem
      item={item}
      index={index}
      activeIndex={activeIndex}
      onPress={handlePress}
      onLongPress={handleLongPress}
      onShowMenu={onShowMenu}
      selectedList={selectedList}
      focused={item.id == keyboardId}
      rowInfo={rowInfo.current}
      isShowAlbumName={isShowAlbumName}
      isShowInterval={isShowInterval}
    />
  )
  const getkey: FlatListType['keyExtractor'] = item => item.id
  const getItemLayout: FlatListType['getItemLayout'] = (data, index) => {
    return { length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index }
  }

  return (
    <View style={{ flex: 1, minWidth: 0, minHeight: 0 }}>
    {Platform.OS == 'ios' ? <SongTableHeader showAlbum={isShowAlbumName} showInterval={isShowInterval} /> : null}
    <FlatList
      ref={flatListRef}
      onScroll={handleScroll}
      style={styles.list}
      data={currentList}
      maxToRenderPerBatch={4}
      numColumns={rowInfo.current.rowNum}
      horizontal={false}
      // updateCellsBatchingPeriod={80}
      windowSize={8}
      removeClippedSubviews={true}
      initialNumToRender={12}
      renderItem={renderItem}
      keyExtractor={getkey}
      extraData={[activeIndex, keyboardId, selectedList]}
      getItemLayout={getItemLayout}
    />
    </View>
  )
})

const styles = createStyle({
  container: {
    flex: 1,
  },
  list: {
    flexGrow: 1,
    flexShrink: 1,
  },
})

export default List
