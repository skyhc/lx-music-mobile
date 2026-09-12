// import { useEffect, useState } from 'react'
import { Platform, SafeAreaView, StyleSheet, View } from 'react-native'
import { useTheme } from '@/store/theme/hook'
import ImageBackground from '@/components/common/ImageBackground'
import { useWindowSize } from '@/utils/hooks'
import { useMemo } from 'react'
import { scaleSizeAbsHR } from '@/utils/pixelRatio'
import { defaultHeaders } from './common/Image'
import SizeView from './SizeView'
import { useBgPic } from '@/store/common/hook'
import { isIPadWindowed } from '@/utils/ipadWindow'

interface Props {
  children: React.ReactNode
  integrateWindowControls?: boolean
}

interface ContentContainerProps {
  children: React.ReactNode
  integratedWindowControls: boolean
}

const BLUR_RADIUS = Math.max(scaleSizeAbsHR(18), 10)

const ContentContainer = ({ children, integratedWindowControls }: ContentContainerProps) => {
  if (Platform.OS == 'ios') {
    // In iPad window mode, selected screens can opt into a macOS-like integrated
    // title bar. Those screens handle the leading window-control exclusion zone
    // themselves instead of pushing the whole UI below the system controls.
    if (integratedWindowControls) return <View style={{ flex: 1 }}>{children}</View>
    return <SafeAreaView style={{ flex: 1 }}>{children}</SafeAreaView>
  }
  return <>{children}</>
}

export default ({ children, integrateWindowControls = false }: Props) => {
  const theme = useTheme()
  const windowSize = useWindowSize()
  const pic = useBgPic()
  const integratedWindowControls = integrateWindowControls && isIPadWindowed(windowSize.width, windowSize.height)

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
      <ContentContainer integratedWindowControls={integratedWindowControls}>
        <View style={{ flex: 1, flexDirection: 'column' }}>
          {children}
        </View>
      </ContentContainer>
    </View>
  ), [children, integratedWindowControls, theme, windowSize.height, windowSize.width])
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
        <ContentContainer integratedWindowControls={integratedWindowControls}>
          <View style={{ flex: 1, flexDirection: 'column' }}>
            {children}
          </View>
        </ContentContainer>
      </View>
    )
  }, [children, integratedWindowControls, pic, theme, windowSize.height, windowSize.width])

  return (
    <>
      <SizeView />
      {pic ? picComponent : themeComponent}
    </>
  )
}
