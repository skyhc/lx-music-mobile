import { useRef } from 'react'
import { Platform } from 'react-native'
import useWindowSize from './useWindowSize'
import { shouldUseHorizontalLayout } from '../layout'

const IPAD_HORIZONTAL_ENTER_WIDTH = 640
const IPAD_HORIZONTAL_EXIT_WIDTH = 560

export default () => {
  const windowSize = useWindowSize()
  const isIPad = Platform.OS == 'ios' && Platform.isPad
  const modeRef = useRef(
    isIPad
      ? windowSize.width >= 600
      : shouldUseHorizontalLayout(windowSize.width, windowSize.height),
  )

  if (isIPad) {
    // iPad windowing/Stage Manager can continuously change the aspect ratio while
    // the usable width is still tablet-sized. Keep the tablet UI based on width
    // and use hysteresis so the phone and tablet layouts do not fight each other
    // while the user drags a window edge around the breakpoint.
    if (modeRef.current) {
      if (windowSize.width < IPAD_HORIZONTAL_EXIT_WIDTH) modeRef.current = false
    } else if (windowSize.width >= IPAD_HORIZONTAL_ENTER_WIDTH) {
      modeRef.current = true
    }
    return modeRef.current
  }

  return shouldUseHorizontalLayout(windowSize.width, windowSize.height)
}
