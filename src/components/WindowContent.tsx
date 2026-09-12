import { useState, type ReactNode } from 'react'
import { Platform, SafeAreaView, StyleSheet, View, type LayoutChangeEvent } from 'react-native'

// iPadOS owns the traffic lights. App controls only reserve vertical room.
export const IPAD_CONTROL_STRIP_HEIGHT = 36
export const IPAD_CONTROL_STRIP_GAP = 4
export const getWindowControlTopPadding = (safeTop: number): number => (
  Math.max(0, IPAD_CONTROL_STRIP_HEIGHT - Math.max(0, safeTop)) + IPAD_CONTROL_STRIP_GAP
)

export default ({ children }: { children: ReactNode }) => {
  const [outerHeight, setOuterHeight] = useState(0)
  const [safeFrame, setSafeFrame] = useState({ y: 0, height: 0 })
  if (Platform.OS != 'ios') return <>{children}</>
  if (!Platform.isPad) return <SafeAreaView style={styles.fill}>{children}</SafeAreaView>

  const handleSafeLayout = ({ nativeEvent }: LayoutChangeEvent) => {
    const { y, height } = nativeEvent.layout
    const nextTop = Math.max(0, y)
    setSafeFrame(previous => Math.abs(previous.y - nextTop) < 0.5 && Math.abs(previous.height - height) < 0.5
      ? previous
      : { y: nextTop, height })
  }
  const top = safeFrame.y + getWindowControlTopPadding(safeFrame.y)
  const bottom = safeFrame.height > 0 ? Math.max(0, outerHeight - safeFrame.y - safeFrame.height) : 0

  return (
    <View style={styles.fill} onLayout={event => setOuterHeight(event.nativeEvent.layout.height)}>
      {/* Read native vertical insets without passing native horizontal padding
          into the visible content. Full-screen transitions cannot shift x. */}
      <SafeAreaView pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.probe}>
        <View style={styles.fill} onLayout={handleSafeLayout} />
      </SafeAreaView>
      <View style={[styles.fill, { paddingTop: top, paddingBottom: bottom }]}>{children}</View>
    </View>
  )
}

const styles = StyleSheet.create({
  fill: { flex: 1, minWidth: 0, minHeight: 0 },
  probe: { ...StyleSheet.absoluteFillObject, opacity: 0 },
})
