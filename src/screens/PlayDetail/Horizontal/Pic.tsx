import { memo, useEffect, useState } from 'react'
import { View } from 'react-native'
import { usePlayerMusicInfo } from '@/store/player/hook'
import { useWindowSize } from '@/utils/hooks'
import { useNavigationComponentDidAppear } from '@/navigation'
import { NAV_SHEAR_NATIVE_IDS } from '@/config/constant'
import { createStyle } from '@/utils/tools'
import { HEADER_HEIGHT } from './components/Header'
import { marginLeft } from './constant'
import Image from '@/components/common/Image'
import { useStatusbarHeight } from '@/store/common/hook'
import commonState from '@/store/common/state'
import { isIPadWindowed } from '@/utils/ipadWindow'

const MAX_IPAD_PIC_WIDTH = 420

export default memo(({ componentId }: { componentId: string }) => {
  const musicInfo = usePlayerMusicInfo()
  const { width: winWidth, height: winHeight } = useWindowSize()
  const statusBarHeight = useStatusbarHeight()
  const effectiveStatusBarHeight = isIPadWindowed(winWidth, winHeight) ? 0 : statusBarHeight

  const [animated, setAnimated] = useState(!!commonState.componentIds.playDetail)
  const [pic, setPic] = useState(musicInfo.pic)
  useEffect(() => {
    if (animated) setPic(musicInfo.pic)
  }, [musicInfo.pic, animated])

  useNavigationComponentDidAppear(componentId, () => {
    setAnimated(true)
  })

  let imgWidth = Math.min(
    (winWidth * 0.45 - marginLeft * 2) * 0.78,
    (winHeight - effectiveStatusBarHeight - HEADER_HEIGHT) * 0.58,
    winWidth >= 900 ? MAX_IPAD_PIC_WIDTH : Number.POSITIVE_INFINITY,
  )
  imgWidth -= imgWidth * (global.lx.fontSize - 1) * 0.3
  let contentHeight = (winHeight - effectiveStatusBarHeight - HEADER_HEIGHT) * 0.6
  contentHeight -= contentHeight * (global.lx.fontSize - 1) * 0.2

  return (
    <View style={{ ...styles.container, height: contentHeight }}>
      <View style={{ ...styles.content, elevation: animated ? 3 : 0 }}>
        <Image url={pic} nativeID={NAV_SHEAR_NATIVE_IDS.playDetail_pic} style={{
          width: imgWidth,
          height: imgWidth,
          borderRadius: 2,
        }} />
      </View>
    </View>
  )
})

const styles = createStyle({
  container: {
    flexShrink: 1,
    flexGrow: 0,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  content: {
    backgroundColor: 'rgba(0,0,0,0)',
    borderRadius: 4,
  },
})
