import { memo, useEffect, useRef } from 'react'
import { FlatList, type FlatListProps } from 'react-native'

import DownloadSettings from '../settings/Download'
import WebDAV from '../settings/WebDAV'
import Basic from '../settings/Basic'
import Player from '../settings/Player'
import LyricDesktop from '../settings/LyricDesktop'
import Search from '../settings/Search'
import List from '../settings/List'
import Sync from '../settings/Sync'
import Backup from '../settings/Backup'
import Other from '../settings/Other'
import Version from '../settings/Version'
import About from '../settings/About'
import { createStyle } from '@/utils/tools'
import { SETTING_SCREENS, type SettingScreenIds } from '../Main'
import { useLibraryPage } from '@/core/library/page'

type FlatListType = FlatListProps<SettingScreenIds>

const styles = createStyle({
  content: {
    paddingLeft: 15,
    paddingRight: 15,
    paddingTop: 15,
    paddingBottom: 15,
    flex: 0,
  },
})

const ListItem = memo(({ id }: { id: SettingScreenIds }) => {
  switch (id) {
    case 'player': return <Player />
    case 'download': return <DownloadSettings />
    case 'webdav': return <WebDAV />
    case 'lyric_desktop': return <LyricDesktop />
    case 'search': return <Search />
    case 'list': return <List />
    case 'sync': return <Sync />
    case 'backup': return <Backup />
    case 'other': return <Other />
    case 'version': return <Version />
    case 'about': return <About />
    case 'basic': return <Basic />
  }
}, () => true)

export default () => {
  const listRef = useRef<FlatList<SettingScreenIds>>(null)
  const requested = useLibraryPage()
  const renderItem: FlatListType['renderItem'] = ({ item }) => <ListItem id={item} />
  const getkey: FlatListType['keyExtractor'] = item => item

  useEffect(() => {
    if (!requested.screen) return
    const index = SETTING_SCREENS.indexOf(requested.screen)
    if (index < 0) return
    requestAnimationFrame(() => {
      listRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0 })
    })
  }, [requested.revision, requested.screen])

  return (
    <FlatList
      ref={listRef}
      data={SETTING_SCREENS}
      keyboardShouldPersistTaps={'always'}
      renderItem={renderItem}
      keyExtractor={getkey}
      contentContainerStyle={styles.content}
      maxToRenderPerBatch={2}
      windowSize={2}
      initialNumToRender={4}
      onScrollToIndexFailed={({ index, averageItemLength }) => {
        listRef.current?.scrollToOffset({ offset: Math.max(0, averageItemLength * index), animated: true })
      }}
    />
  )
}
