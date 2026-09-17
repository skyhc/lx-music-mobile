import { useEffect, useState } from 'react'
import { setNavActiveId } from '@/core/common'

export type LibraryTab = 'downloads' | 'webdav' | 'backup'
export type LibrarySettingScreen = 'download' | 'webdav' | 'backup'

type LibraryPageRequest = {
  tab: LibraryTab
  screen: LibrarySettingScreen | null
  listId: string
  revision: number
}

let request: LibraryPageRequest = { tab: 'downloads', screen: null, listId: '', revision: 0 }
const listeners = new Set<() => void>()

const publish = (next: Omit<LibraryPageRequest, 'revision'>) => {
  request = { ...next, revision: request.revision + 1 }
  for (const listener of listeners) listener()
}

export function openLibrarySettings(screen: LibrarySettingScreen, listId = '') {
  publish({ tab: screen === 'download' ? 'downloads' : screen, screen, listId })
  global.lx.settingActiveId = screen
  setNavActiveId('nav_setting')
}

export function openLibraryPage(tab: LibraryTab, listId = '') {
  if (tab === 'downloads') {
    publish({ tab, screen: null, listId: '' })
    setNavActiveId('nav_library')
    return
  }
  openLibrarySettings(tab, listId)
}

export function useLibraryPage() {
  const [value, setValue] = useState(request)
  useEffect(() => {
    const update = () => { setValue(request) }
    listeners.add(update)
    update()
    return () => { listeners.delete(update) }
  }, [])
  return value
}
