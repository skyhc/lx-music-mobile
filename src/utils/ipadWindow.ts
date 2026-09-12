import { Dimensions, Platform } from 'react-native'

const IPAD_WINDOW_SIZE_TOLERANCE = 24
const IPAD_WINDOW_CONTROLS_LEADING_INSET = 88

export const isIPadWindowed = (width: number, height: number): boolean => {
  if (Platform.OS != 'ios' || !Platform.isPad || !width || !height) return false

  const screen = Dimensions.get('screen')
  const windowLongEdge = Math.max(width, height)
  const windowShortEdge = Math.min(width, height)
  const screenLongEdge = Math.max(screen.width, screen.height)
  const screenShortEdge = Math.min(screen.width, screen.height)

  return windowLongEdge < screenLongEdge - IPAD_WINDOW_SIZE_TOLERANCE ||
    windowShortEdge < screenShortEdge - IPAD_WINDOW_SIZE_TOLERANCE
}

export const getIPadWindowControlsLeadingInset = (width: number, height: number): number => {
  return isIPadWindowed(width, height) ? IPAD_WINDOW_CONTROLS_LEADING_INSET : 0
}
