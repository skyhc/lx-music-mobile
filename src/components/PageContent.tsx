// import { useEffect, useState } from 'react'
import { Dimensions, Platform, SafeAreaView, StyleSheet, View } from 'react-native'
import { useTheme } from '@/store/theme/hook'
import ImageBackground from '@/components/common/ImageBackground'
import { useWindowSize } from '@/utils/hooks'
import { useMemo } from 'react'
import { scaleSizeAbsHR } from '@/utils/pixelRatio'
import { defaultHeaders } from './common/Image'
import SizeView from './SizeView'
import { useBgPic } from '@/store/common/hook'

interface Props {
  children: React.ReactNode
}

interface ContentContainerProps extends Props {
  windowChromeTopInset: number
}

const BLUR_RADIUS = Math.max(scaleSizeAbsHR(18), 10)
const IPAD_WINDOW_CHROME_TOP_INSET = 48
const IPAD_WINDOW_SIZE_TOLERANCE = 24

const ContentContainer = ({ children, windowChromeTopInset }: ContentContainerProps) => {
  if (Platform.OS == 'ios') {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ flex: 1, paddingTop: windowChromeTopInset }}>
          {children}
        </View>
      </SafeAreaView>
    )
  }
  return <>{children}</>
}

const getIPadWindowChromeTopInset = (width: number, height: number) => {
  if (Platform.OS != 'ios' || !Platform.isPad || !width || !height) return 0

  // iPadOS 26 window controls live inside the app window and are not always
  // represented by React Native's SafeAreaView. Detect a non-fullscreen scene
  // from the usable window size and reserve the window-control strip ourselves.
  const screen = Dimensions.get('screen')
  const windowLongEdge = Math.max(width, height)
  const windowShortEdge = Math.min(width, height)
  const screenLongEdge = Math.max(screen.width, screen.height)
  const screenShortEdge = Math.min(screen.width, screen.height)
  const isWindowed = windowLongEdge < screenLongEdge - IPAD_WINDOW_SIZE_TOLERANCE ||
    windowShortEdge < screenShortEdge - IPAD_WINDOW_SIZE_TOLERANCE

  return isWindowed ? IPAD_WINDOW_CHROME_TOP_INSET : 0
}

export default ({ children }: Props) => {
  const theme = useTheme()
  const windowSize = useWindowSize()
  const pic = useBgPic()
  const windowChromeTopInset = getIPadWindowChromeTopInset(windowSize.width, windowSize.height)
  // const [wh, setWH] = useState<{ width: number | string, height: number | string }>({ width: '100%', height: Dimensions.get('screen').height })

  // 固定宽高度 防止弹窗键盘时大小改变导致背景被缩放
  // useEffect(() => {
  //   const onChange = () => {
  //     setWH({ width: '100%', height: '100%' })
  //   }

  //   const changeEvent = Dimensions.addEventListener('change', onChange)
  //   return () => {
  //     changeEvent.remove()
  //   }
  // }, [])
  // const handleLayout = (e: LayoutChangeEvent) => {
  //   // console.log('handleLayout', e.nativeEvent)
  //   // console.log(Dimensions.get('screen'))
  //   setWH({ width: e.nativeEvent.layout.width, height: Dimensions.get('screen').height })
  // }
  // console.log('render page content')

  const themeComponent = useMemo(() => (
    <View style={{ flex: 1, overflow: 'hidden' }}>
      <ImageBackground
        style={{ position: 'absolute', left: 0, top: 0, height: windowSize.height, width: windowSize.width, backgroundColor: theme['c-content-background'] }}
        source={theme['bg-image']}
        resizeMode="cover"
      />
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: theme['c-main-background'],
          },
        ]}
      />
      <ContentContainer windowChromeTopInset={windowChromeTopInset}>
        <View style={{ flex: 1, flexDirection: 'column' }}>
          {children}
        </View>
      </ContentContainer>
    </View>
  ), [children, theme, windowChromeTopInset, windowSize.height, windowSize.width])
  const picComponent = useMemo(() => {
    return (
      <View style={{ flex: 1, overflow: 'hidden' }}>
        <ImageBackground
          style={{ position: 'absolute', left: 0, top: 0, height: windowSize.height, width: windowSize.width, backgroundColor: theme['c-content-background'] }}
          source={{ uri: pic!, headers: defaultHeaders }}
          resizeMode="cover"
          blurRadius={BLUR_RADIUS}
        />
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: theme['c-content-background'],
              opacity: 0.76,
            },
          ]}
        />
        <ContentContainer windowChromeTopInset={windowChromeTopInset}>
          <View style={{ flex: 1, flexDirection: 'column' }}>
            {children}
          </View>
        </ContentContainer>
      </View>
    )
  }, [children, pic, theme, windowChromeTopInset, windowSize.height, windowSize.width])

  return (
    <>
      <SizeView />
      {pic ? picComponent : themeComponent}
    </>
  )
}
