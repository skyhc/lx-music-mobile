import { onRemoteCommand } from '@/utils/nativeModules/utils'
import { pause, play, playNext, playPrev, togglePlay } from '@/core/player/player'
import { markTimeoutExitInteraction } from '@/core/player/timeoutExit'
import { setNavActiveId } from '@/core/common'

export default () => {
  onRemoteCommand((event) => {
    markTimeoutExitInteraction()

    switch (event.command) {
      case 'play':
        play()
        break
      case 'pause':
        void pause()
        break
      case 'toggle':
        togglePlay()
        break
      case 'next':
        void playNext()
        break
      case 'previous':
        void playPrev()
        break
      case 'seek':
        if (typeof event.position == 'number') {
          global.app_event.setProgress(event.position)
        }
        break
      case 'nav_search':
      case 'nav_songlist':
      case 'nav_top':
      case 'nav_love':
      case 'nav_setting':
        setNavActiveId(event.command)
        break
    }
  })
}
