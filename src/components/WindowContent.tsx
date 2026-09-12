import { useState, type ReactNode } from 'react'
import { Platform, SafeAreaView, View, type LayoutChangeEvent } from 'react-native'

// A vertical-only fallback for the iPad window-control strip. UIKit still owns
// the real safe-area insets; do not sum this strip with an existing top inset.
export const IPAD_CONTROL_STRIP_HEIGHT = 36
export const getWindowControlTopPadding = (safeTop: number): number => (
  Math.max(0, IPAD_CONTROL_STRIP_HEIGHT - Math.max(0, safeTop))
)

export default ({ children }: { children: ReactNode }) => {
  const [safeTop, setSafeTop] = useState(0)
  if (Platform.OS != 'ios') return <>{children}</>

  const handleLayout = ({ nativeEvent }: LayoutChangeEvent) => {
    // The child origin includes SafeAreaView's native top padding. Its own
    // padding does not change that origin, so this cannot accumulate offsets.
    const nextTop = Math.max(0, nativeEvent.layout.y)
    setSafeTop(previous => Math.abs(previous - nextTop) < 0.5 ? previous : nextTop)
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View onLayout={handleLayout} style={{
        flex: 1,
        minHeight: 0,
        paddingTop: Platform.isPad ? getWindowControlTopPadding(safeTop) : 0,
      }}>
        {children}
      </View>
    </SafeAreaView>
  )
}
