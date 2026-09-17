import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from 'react'

import DownloadSettings from './settings/Download'
import WebDAV from './settings/WebDAV'
import Basic from './settings/Basic'
import Player from './settings/Player'
import LyricDesktop from './settings/LyricDesktop'
import Search from './settings/Search'
import List from './settings/List'
import Sync from './settings/Sync'
import Backup from './settings/Backup'
import Other from './settings/Other'
import Version from './settings/Version'
import About from './settings/About'
import { useLibraryPage } from '@/core/library/page'

export const SETTING_SCREENS = [
  'basic',
  'player',
  'download',
  'webdav',
  'lyric_desktop',
  'search',
  'list',
  'sync',
  'backup',
  'other',
  'version',
  'about',
] as const

export type SettingScreenIds = typeof SETTING_SCREENS[number]

export interface MainType {
  setActiveId: (id: SettingScreenIds) => void
}

const Main = forwardRef<MainType, {}>((props, ref) => {
  const [id, setId] = useState(global.lx.settingActiveId)
  const requested = useLibraryPage()

  useEffect(() => {
    if (!requested.screen) return
    requestAnimationFrame(() => { setId(requested.screen as SettingScreenIds) })
  }, [requested.revision, requested.screen])

  useImperativeHandle(ref, () => ({
    setActiveId(id) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setId(id)
        })
      })
    },
  }))

  const component = useMemo(() => {
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
      case 'basic':
      default: return <Basic />
    }
  }, [id])

  return component
})

export default Main
