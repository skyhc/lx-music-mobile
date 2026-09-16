import { playingColor } from '@/utils/playingColor'
import { SONG_ROW_HEIGHT, SONG_ACTION_WIDTH, SONG_NUMBER_WIDTH } from '@/utils/songLayout'
import SongRowContent from '@/components/common/SongRowContent'
import { memo, useRef } from 'react'
import { selectionColors } from '@/utils/selectionColors'
import { View, TouchableOpacity, Platform } from 'react-native'
import { LIST_ITEM_HEIGHT } from '@/config/constant'
// import { BorderWidths } from '@/theme'
import { Icon } from '@/components/common/Icon'
import { createStyle, type RowInfo } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import { useAssertApiSupport } from '@/store/common/hook'
import { scaleSizeH } from '@/utils/pixelRatio'
import Text from '@/components/common/Text'
import Badge from '@/components/common/Badge'

export const ITEM_HEIGHT = Platform.OS == 'ios' ? SONG_ROW_HEIGHT : scaleSizeH(LIST_ITEM_HEIGHT)


export default memo(({ item, index, activeIndex, onPress, onShowMenu, onLongPress, selectedList, focused = false, rowInfo, isShowAlbumName, isShowInterval }: {
  item: LX.Music.MusicInfo
  index: number
  activeIndex: number
  onPress: (item: LX.Music.MusicInfo, index: number) => void
  onLongPress: (item: LX.Music.MusicInfo, index: number) => void
  onShowMenu: (item: LX.Music.MusicInfo, index: number, position: { x: number, y: number, w: number, h: number }) => void
  focused?: boolean
  selectedList: LX.Music.MusicInfo[]
  rowInfo: RowInfo
  isShowAlbumName: boolean
  isShowInterval: boolean
}) => {
  const theme = useTheme()
  const selection = selectionColors(theme)
  const multiSelected = selectedList.includes(item)
  const playing = playingColor(theme, multiSelected ? selection.background : undefined)

  const isSelected = selectedList.includes(item)
  // console.log(item.name, selectedList, selectedList.includes(item))
  const isSupported = useAssertApiSupport(item.source)
  const moreButtonRef = useRef<TouchableOpacity>(null)
  const handleShowMenu = () => {
    if (moreButtonRef.current?.measure) {
      moreButtonRef.current.measure((fx, fy, width, height, px, py) => {
        // console.log(fx, fy, width, height, px, py)
        onShowMenu(item, index, { x: Math.ceil(px), y: Math.ceil(py), w: Math.ceil(width), h: Math.ceil(height) })
      })
    }
  }
  const active = activeIndex == index

  const singer = `${item.singer}${isShowAlbumName && item.meta.albumName ? ` · ${item.meta.albumName}` : ''}`

  return (
    <View style={{ ...styles.listItem, width: rowInfo.rowWidth, height: ITEM_HEIGHT, backgroundColor: isSelected ? selection.background : 'transparent', opacity: Platform.OS == 'ios' || isSupported ? 1 : 0.5 }}>
      {focused ? <View pointerEvents="none" style={{ position: 'absolute', left: 1, right: 1, top: 1, bottom: 1, borderWidth: 1, borderRadius: 4, borderColor: playing }} /> : null}
      <TouchableOpacity accessibilityHint={isSupported ? undefined : '当前音源可能不可用'} style={styles.listItemLeft} onPress={() => { onPress(item, index) }} onLongPress={() => { onLongPress(item, index) }}>
        {
          active
            ? <Icon style={styles.sn} name="play-outline" size={16} color={playing} />
            : <Text style={styles.sn} size={13} color={isSelected ? selection.text : theme['c-font-label']}>{index + 1}</Text>
        }
        {Platform.OS == 'ios' ? <SongRowContent name={item.name} singer={item.singer} album={item.meta.albumName}
          interval={item.interval} showAlbum={isShowAlbumName} showInterval={isShowInterval} source={item.source} active={active} selected={isSelected} surface={isSelected ? selection.background : undefined} /> : <>
        <View style={styles.itemInfo}>
          {/* <View style={styles.listItemTitle}> */}
          <Text color={active ? theme['c-primary-font'] : theme['c-font']} numberOfLines={1}>{item.name}</Text>
          {/* </View> */}
          <View style={styles.listItemSingle}>
            <Badge>{item.source.toUpperCase()}</Badge>
            <Text style={styles.listItemSingleText} size={11} color={active ? theme['c-primary-alpha-200'] : theme['c-500']} numberOfLines={1}>
              {singer}
            </Text>
          </View>
        </View>
        {
          isShowInterval ? (
            <Text size={12} color={active ? theme['c-primary-alpha-400'] : theme['c-250']} numberOfLines={1}>{item.interval}</Text>
          ) : null
        }
        </>}
      </TouchableOpacity>
      {/* <View style={styles.listItemRight}> */}
      <TouchableOpacity onPress={handleShowMenu} ref={moreButtonRef} style={[styles.moreButton, Platform.OS == 'ios' ? { width: SONG_ACTION_WIDTH, paddingLeft: 0, paddingRight: 0, alignItems: 'center' } : null]}>
        <Icon name="dots-vertical" style={{ color: active ? playing : isSelected ? selection.text : theme['c-font-label'] }} size={12} />
      </TouchableOpacity>
      {/* </View> */}
    </View>
  )
}, (prevProps, nextProps) => {
  return !!(prevProps.focused === nextProps.focused && prevProps.rowInfo.rowWidth === nextProps.rowInfo.rowWidth && prevProps.item === nextProps.item &&
    prevProps.index === nextProps.index &&
    prevProps.isShowAlbumName === nextProps.isShowAlbumName &&
    prevProps.isShowInterval === nextProps.isShowInterval &&
    prevProps.activeIndex != nextProps.index &&
    nextProps.activeIndex != nextProps.index &&
    nextProps.selectedList.includes(nextProps.item) == prevProps.selectedList.includes(nextProps.item)
  )
})


const styles = createStyle({
  listItem: {
    // width: '50%',
    flexDirection: 'row',
    flexWrap: 'nowrap',
    // paddingLeft: 10,
    paddingRight: 2,
    alignItems: 'center',
    // borderBottomWidth: BorderWidths.normal,
  },
  listItemLeft: {
    height: '100%',
    flex: 1,
    flexGrow: 1,
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sn: {
    width: SONG_NUMBER_WIDTH,
    // fontSize: 12,
    textAlign: 'center',
    // backgroundColor: 'rgba(0,0,0,0.2)',
    paddingLeft: 3,
    paddingRight: 3,
  },
  itemInfo: {
    flexGrow: 1,
    flexShrink: 1,
    // paddingTop: 10,
    // paddingBottom: 10,
    paddingRight: 2,
  },
  // listItemTitle: {
  //   flexGrow: 0,
  //   flexShrink: 1,
  // },
  listItemSingle: {
    paddingTop: 3,
    flexDirection: 'row',
    // alignItems: 'flex-end',
  },
  listItemSingleText: {
    // backgroundColor: 'rgba(0,0,0,0.2)',
    flexGrow: 0,
    flexShrink: 1,
    fontWeight: '300',
    // fontSize: 15,
  },
  // listItemBadge: {
  //   // fontSize: 10,
  //   paddingLeft: 5,
  //   paddingTop: 2,
  //   alignSelf: 'flex-start',
  // },
  listItemRight: {
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: 'auto',
    justifyContent: 'center',
  },

  moreButton: {
    height: '80%',
    paddingLeft: 16,
    paddingRight: 16,
    // paddingTop: 10,
    // paddingBottom: 10,
    // backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
  },
})
