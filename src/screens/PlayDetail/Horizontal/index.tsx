import { memo, useEffect } from 'react'
import { View, AppState } from 'react-native'
import { screenkeepAwake, screenUnkeepAwake } from '@/utils/nativeModules/utils'
import StatusBar from '@/components/common/StatusBar'
import Header from './components/Header'
import { setComponentId } from '@/core/common'
import { COMPONENT_IDS } from '@/config/constant'
import PageContent from '@/components/PageContent'
import commonState, { type InitState as CommonState } from '@/store/common/state'
import Pic from './Pic'
import Lyric from './Lyric'
import Player from './Player'
import { createStyle } from '@/utils/tools'
import { marginLeftRaw } from './constant'
import { useStatusbarHeight } from '@/store/common/hook'
import { useWindowSize } from '@/utils/hooks'
import { isIPadWindowed } from '@/utils/ipadWindow'

export default memo(({ componentId }: { componentId: string }) => {
  const statusBarHeight = useStatusbarHeight()
  const windowSize = useWindowSize()
  const windowedIPad = isIPadWindowed(windowSize.width, windowSize.height)

  useEffect(() => {
    setComponentId(COMPONENT_IDS.playDetail, componentId)
    screenkeepAwake()
    let appstateListener = AppState.addEventListener('change', (state) => {
      switch (state) {
        case 'active':
          if (!commonState.componentIds.comment) screenkeepAwake()
          break
        case 'background':
          screenUnkeepAwake()
          break
      }
    })

    const handleComponentIdsChange = (ids: CommonState['componentIds']) => {
      if (ids.comment) screenUnkeepAwake()
      else if (AppState.currentState == 'active') screenkeepAwake()
    }

    global.state_event.on('componentIdsUpdated', handleComponentIdsChange)

    return () => {
      global.state_event.off('componentIdsUpdated', handleComponentIdsChange)
      appstateListener.remove()
      screenUnkeepAwake()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <PageContent integrateWindowControls>
      <StatusBar />
      <View style={{ ...styles.container, paddingTop: windowedIPad ? 0 : statusBarHeight }}>
        <View style={styles.left}>
          <Header />
          <View style={styles.leftContent}>
            <Pic componentId={componentId} />
          </View>
          <Player />
        </View>
        <View style={styles.right}>
          <Lyric />
        </View>
      </View>
    </PageContent>
  )
})

const styles = createStyle({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  left: {
    flex: 1,
    width: '45%',
    paddingBottom: 10,
  },
  leftContent: {
    flexShrink: 1,
    flexGrow: 0,
    marginLeft: marginLeftRaw,
  },
  right: {
    width: '55%',
    flexGrow: 0,
    flexShrink: 0,
  },
})
