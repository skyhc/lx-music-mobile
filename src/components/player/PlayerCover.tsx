import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { AccessibilityInfo, Animated, AppState, Easing, View } from 'react-native'
import Image from '@/components/common/Image'
import { useTheme } from '@/store/theme/hook'
import { useSettingValue } from '@/store/setting/hook'
import { useIsPlay } from '@/store/player/hook'
import { useNavigationComponentDidAppear, useNavigationComponentDidDisappear } from '@/navigation'
import { startCoverRotation } from './coverAnimation'

/** Native iOS/iPadOS counterpart of the selectable CD/square cover behaviour.
 * No Svelte renderer or upstream artwork is embedded in the mobile application.
 */
export default memo(({ url, size, nativeID, componentId, active = true }: {
  url: string | number | null | undefined
  size: number
  nativeID?: string
  componentId: string
  active?: boolean
}) => {
  const theme = useTheme()
  const style = useSettingValue('playDetail.coverStyle')
  const playing = useIsPlay()
  const rotation = useRef(new Animated.Value(0)).current
  const [foreground, setForeground] = useState(AppState.currentState == 'active')
  const [visible, setVisible] = useState(true)
  // Do not animate until the accessibility preference is known.
  const [reduceMotion, setReduceMotion] = useState(true)
  useNavigationComponentDidAppear(componentId, useCallback(() => { setVisible(true) }, []))
  useNavigationComponentDidDisappear(componentId, useCallback(() => { setVisible(false) }, []))
  useEffect(() => {
    let mounted = true
    let motionEventSeen = false
    const app = AppState.addEventListener('change', state => { if (mounted) setForeground(state == 'active') })
    const motion = AccessibilityInfo.addEventListener('reduceMotionChanged', value => {
      if (!mounted) return
      motionEventSeen = true
      setReduceMotion(value)
    })
    void AccessibilityInfo.isReduceMotionEnabled().then(value => {
      if (mounted && !motionEventSeen) setReduceMotion(value)
    }).catch(() => {})
    return () => { mounted = false; app.remove(); motion.remove() }
  }, [])
  const enabled = style == 'cd' && playing && foreground && visible && active && !reduceMotion
  useEffect(() => startCoverRotation({
    stop: read => rotation.stopAnimation(read),
    set: value => rotation.setValue(value),
    run: (duration, complete) => {
      Animated.timing(rotation, { toValue: 1, duration, easing: Easing.linear, useNativeDriver: true })
        .start(({ finished }) => complete(finished))
    },
  }, enabled), [rotation, enabled])

  const width = Math.max(0, Number.isFinite(size) ? size : 0)
  if (style != 'cd') return <Image url={url} nativeID={nativeID} style={{ width, height: width, borderRadius: 2 }} />

  const disc = width * 0.88
  const hub = disc * 0.24
  const hole = disc * 0.13
  return <View testID="player-cover-cd" style={{ width, height: width, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center', backgroundColor: theme['c-primary-alpha-100'],
    borderWidth: 1, borderColor: theme['c-primary-alpha-300'] }}>
    <Animated.View style={{ width: disc, height: disc, borderRadius: disc / 2, overflow: 'hidden',
      transform: [{ rotate: rotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] }}>
      <Image url={url} nativeID={nativeID} style={{ width: disc, height: disc, borderRadius: disc / 2 }} />
      <View pointerEvents="none" style={{ position: 'absolute', width: hub, height: hub, borderRadius: hub / 2,
        left: (disc - hub) / 2, top: (disc - hub) / 2, borderWidth: 1, borderColor: theme['c-primary-alpha-600'],
        backgroundColor: theme['c-primary-alpha-300'], alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: hole, height: hole, borderRadius: hole / 2, backgroundColor: theme['c-main-background'] }} />
      </View>
    </Animated.View>
  </View>
})
