// Deterministic, simulator-only rendering evidence. Uses real production views;
// fixture content is synthetic and does not contact music services.
import React, { useEffect, useRef } from 'react'
import { Dimensions, NativeModules, ScrollView, View } from 'react-native'
import { Navigation } from 'react-native-navigation'
import { createI18n } from '@/lang'
import { windowSizeTools } from '@/utils/windowSizeTools'
import PageContent from '@/components/PageContent'
import Text from '@/components/common/Text'
import OnlineList, { type OnlineListType } from '@/components/OnlineList'
import MusicAddModal, { type MusicAddModalType } from '@/components/MusicAddModal'
import Popup, { type PopupType } from '@/components/common/Popup'
import SongTableHeader from '@/components/common/SongTableHeader'
import SongRowContent from '@/components/common/SongRowContent'
import SettingPopup, { type SettingPopupType } from '@/screens/PlayDetail/components/SettingPopup'
import Aside from '@/screens/Home/Horizontal/Aside'
import { useHorizontalMode } from '@/utils/hooks'
import { useTheme } from '@/store/theme/hook'
import { createList, getUserLists, setUserList } from '@/core/list'
import { initial } from '@/plugins/player'

const support = NativeModules.LXPlaybackTestSupport
const songs = Array.from({ length: 14 }, (_, i) => ({
  id: `ci-ui-${i}`, name: ['一路生花', '天空之外', '风吹麦浪', '远方的声音'][i % 4],
  singer: ['测试歌手', '纯音乐作品', '艺术家示例'][i % 3], interval: '04:32', source: 'kw',
  meta: { songId: `ci-ui-${i}`, albumName: '专辑名称 · 阅读与列对齐验证', picUrl: '', qualitys: [], _qualitys: {} },
} as LX.Music.MusicInfoOnline))

const Fixture = () => {
  const wide = useHorizontalMode()
  const theme = useTheme()
  const list = useRef<OnlineListType>(null)
  const favorite = useRef<MusicAddModalType>(null)
  const popup = useRef<PopupType>(null)
  const settings = useRef<SettingPopupType>(null)
  useEffect(() => {
    list.current?.setList(songs, false, true)
    list.current?.setStatus('end')
    const timer = setTimeout(() => {
      if (support.uiPhase == 'favorites') favorite.current?.show({ musicInfo: songs[0], listId: '', isMove: false })
      if (support.uiPhase == 'list') popup.current?.setVisible(true)
      if (support.uiPhase == 'settings') settings.current?.show()
    }, 600)
    const report = setTimeout(() => {
      void support.record({ done: true, success: true, phase: support.uiPhase, width: Dimensions.get('window').width,
        height: Dimensions.get('window').height, fixture: 'production views with synthetic data', wide })
    }, 2800)
    return () => { clearTimeout(timer); clearTimeout(report) }
  }, [wide])
  return <PageContent>
    <View style={{ flex: 1, flexDirection: 'row' }}>
      {wide ? <Aside /> : null}
      {wide ? <View style={{ width: 208, borderRightWidth: .5, borderColor: theme['c-border-background'], padding: 16 }}>
        <Text size={17} style={{ fontWeight: '600', marginBottom: 24 }}>排行榜</Text>
        {['飙升榜', '新歌榜', '热歌榜', '我的收藏'].map(name => <Text key={name} size={14} style={{ marginBottom: 24 }}>{name}</Text>)}
      </View> : null}
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ minHeight: 76, padding: 16, flexDirection: 'row', alignItems: 'center' }}>
          <Text size={18} style={{ flex: 1, fontWeight: '600' }}>热歌榜 · 单行歌曲列表</Text>
          {wide ? <Text size={14} color={theme['c-primary-font']}>播放　 收藏　 返回</Text> : null}
        </View>
        <OnlineList ref={list} onRefresh={() => {}} onLoadMore={() => {}} />
      </View>
    </View>
    <MusicAddModal ref={favorite} />
    <Popup ref={popup} kind="list" title="播放列表">
      <SongTableHeader numbered={false} actions={false} />
      <ScrollView>{songs.map(song => <View key={song.id} style={{ height: 54, paddingHorizontal: 16 }}>
        <SongRowContent name={song.name} singer={song.singer} album={song.meta.albumName} interval={song.interval} />
      </View>)}</ScrollView>
    </Popup>
    <SettingPopup ref={settings} direction={wide ? 'horizontal' : 'vertical'} />
  </PageContent>
}

export const runUI = async() => {
  global.i18n = createI18n('zh_cn')
  await windowSizeTools.init()
  setUserList(await getUserLists())
  await createList({ id: 'ci-ui-favorite-a', name: '本地音乐' })
  await createList({ id: 'ci-ui-favorite-b', name: '通勤音乐' })
  await initial({ volume: 1, playRate: 1, cacheSize: 0, isHandleAudioFocus: true, isEnableAudioOffload: false })
  Navigation.registerComponent('LXUIReview', () => Fixture)
  const landscape = support.uiOrientation == 'landscape'
  await Navigation.setRoot({ root: { component: { name: 'LXUIReview', options: {
    layout: { orientation: [landscape ? 'landscape' : 'portrait'] },
  } } } })
}
