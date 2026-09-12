import React from 'react'
import { NativeModules, View, Text } from 'react-native'
import { Navigation } from 'react-native-navigation'
import RNFS from 'react-native-fs'
import { onAppLaunched } from '@/navigation/regLaunchedEvent'
import { initial } from '@/plugins/player'
import { getPosition, setPause, setPlay, setStop, setCurrentTime } from '@/plugins/player/utils'
import { loadPlaybackResource } from '@/plugins/player/engine/resourceLoader'
import { initUnifiedPlayerEngine, onUnifiedPlayerEvent } from '@/plugins/player/engine'
import { lookupAudioCache, configureAudioCache, clearAudioCache, getAudioCacheSize } from '@/plugins/player/cache'
import settingState from '@/store/setting/state'

const support = NativeModules.LXPlaybackTestSupport
const sleep = async(ms: number) => new Promise(resolve => setTimeout(resolve, ms))
const bounded = async<T,>(task: Promise<T>, label: string, ms = 15000): Promise<T> => {
  let timer: ReturnType<typeof setTimeout>
  try { return await Promise.race([task, new Promise<never>((resolve, reject) => { timer = setTimeout(() => reject(new Error(`${label} exceeded ${ms}ms`)), ms) })]) }
  finally { clearTimeout(timer!) }
}
const music = (kind: string): LX.Music.MusicInfoOnline => ({
  id: `ci-sine-${kind}`, name: `Generated ${kind} test tone`, singer: 'CI synthetic signal', source: 'kw', interval: '00:12',
  meta: { songId: `ci-${kind}`, albumName: 'CI', picUrl: '', qualitys: [], _qualitys: {} },
} as LX.Music.MusicInfoOnline)
export const run = async() => {
  const checks: Array<{ name: string, ok: boolean, detail?: unknown }> = []
  const events: unknown[] = []
  let stage = 'launch'
  const record = async(done = false, error?: unknown) => {
    await support.record({ done, success: done && !error, phase: support.offline ? 'offline' : 'online', stage, checks, events: events.slice(-30), error: error ? String(error) : undefined })
  }
  const check = async(name: string, fn: () => Promise<unknown>) => {
    stage = name; await record()
    const detail = await bounded(fn(), name, 20000)
    checks.push({ name, ok: true, detail: detail ?? null }); await record()
  }
  const assert = (value: unknown, message: string) => { if (!value) throw new Error(message) }
  const until = async(fn: () => Promise<boolean>, name: string, ms = 14000) => {
    const start = Date.now()
    while (Date.now() - start < ms) { if (await fn()) return; await sleep(250) }
    throw new Error(name)
  }
  const audibleTimeline = async(label: string) => {
    const initial = await bounded(getPosition(), 'getPosition', 3000)
    await until(async() => (await bounded(getPosition(), 'getPosition', 3000)) > initial + 0.25, `${label}: rendered position did not advance`)
    return getPosition()
  }
  try {
    await new Promise<void>(resolve => onAppLaunched(resolve))
    Navigation.registerComponent('LXPlaybackSmoke', () => () => <View><Text>Native playback regression test</Text></View>)
    await Navigation.setRoot({ root: { component: { name: 'LXPlaybackSmoke' } } })
    initUnifiedPlayerEngine()
    onUnifiedPlayerEvent(event => { events.push(event) })
    settingState.setting['player.cacheSize'] = '32'
    settingState.setting['player.volume'] = 0.4
    await check('real native player setup with persistent cache enabled', async() => {
      await initial({ volume: 0.4, playRate: 1, cacheSize: 32, isHandleAudioFocus: true, isEnableAudioOffload: false })
      await configureAudioCache(32)
    })
    const formats = [['mp3', '128k'], ['flac', 'flac']] as const
    if (!support.offline) {
      await clearAudioCache()
      for (const [format, quality] of formats) {
        const info = music(format)
        const url = `http://127.0.0.1:18779/tone.${format}`
        await check(`${format}: cold remote stream actually advances`, async() => {
          await loadPlaybackResource({ musicInfo: info, url, time: 0, quality })
          return audibleTimeline(format)
        })
        await check(`${format}: pause and resume`, async() => {
          await setPause(); await sleep(250)
          const before = await getPosition(); await sleep(450)
          assert(Math.abs((await getPosition()) - before) < 0.18, 'Position advanced while paused')
          await setPlay(); return audibleTimeline(`${format} resume`)
        })
        await check(`${format}: real RNFS complete cache published without stopping playback`, async() => {
          await until(async() => !!await lookupAudioCache(info, quality), 'Complete cache was never published', 16000)
          return getAudioCacheSize()
        })
        await check(`${format}: local cache playback and seek`, async() => {
          const local = await lookupAudioCache(info, quality)
          assert(local?.startsWith('file://'), 'No complete local URL')
          await loadPlaybackResource({ musicInfo: info, url: local!, time: 0, quality })
          await audibleTimeline(`${format} local`)
          await setCurrentTime(3)
          await until(async() => (await getPosition()) > 3.25, 'Seek/resume position did not advance')
          return getPosition()
        })
      }
      await check('switch FLAC to MP3 without a zero-seek deadlock', async() => {
        await loadPlaybackResource({ musicInfo: music('mp3'), url: (await lookupAudioCache(music('mp3'), '128k'))!, time: 0, quality: '128k' })
        return audibleTimeline('switch')
      })
    } else {
      for (const [format, quality] of formats) {
        await check(`${format}: second app process offline cache playback`, async() => {
          const local = await lookupAudioCache(music(format), quality)
          assert(local?.startsWith('file://'), 'Restart lost the completed file')
          assert(await RNFS.exists(decodeURIComponent(local!.slice(7))), 'Local cache file missing')
          await loadPlaybackResource({ musicInfo: music(format), url: local!, time: 0, quality })
          return audibleTimeline(`${format} offline restart`)
        })
      }
      await check('clear cache preserves the active FLAC playback lease', async() => {
        await clearAudioCache()
        assert((await getAudioCacheSize()) == 0, 'Cache not cleared')
        return audibleTimeline('playing during clear')
      })
    }
    await setStop()
    await record(true)
  } catch (error) {
    checks.push({ name: stage, ok: false, detail: String(error) })
    await record(true, error)
  }
}
