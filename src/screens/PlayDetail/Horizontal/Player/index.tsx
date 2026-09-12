import { memo } from 'react'
import { View } from 'react-native'
import { createStyle } from '@/utils/tools'
import { NAV_SHEAR_NATIVE_IDS } from '@/config/constant'
import PlayInfo from './PlayInfo'
import ControlBtn from './ControlBtn'
import { marginLeftRaw } from '../constant'
import SongInfo from '../components/SongInfo'
import ActionBar from '../components/ActionBar'

export default memo(() => {
  return (
    <View style={styles.container} nativeID={NAV_SHEAR_NATIVE_IDS.playDetail_player}>
      <SongInfo />
      <ActionBar />
      <PlayInfo />
      <ControlBtn />
    </View>
  )
})

const styles = createStyle({
  container: {
    flexShrink: 0,
    flexGrow: 1,
    marginLeft: marginLeftRaw,
  },
})
