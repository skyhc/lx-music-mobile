import { memo } from 'react'
import { StyleSheet, TouchableOpacity, View } from 'react-native'
import { Icon } from '@/components/common/Icon'
import { pop } from '@/navigation'
import { scaleSizeH } from '@/utils/pixelRatio'
import { HEADER_HEIGHT as _HEADER_HEIGHT, NAV_SHEAR_NATIVE_IDS } from '@/config/constant'
import commonState from '@/store/common/state'
import { useWindowSize } from '@/utils/hooks'
import { getIPadWindowControlsLeadingInset } from '@/utils/ipadWindow'

export const HEADER_HEIGHT = scaleSizeH(_HEADER_HEIGHT)

export default memo(() => {
  const windowSize = useWindowSize()
  const leadingInset = getIPadWindowControlsLeadingInset(windowSize.width, windowSize.height)

  const back = () => {
    void pop(commonState.componentIds.playDetail!)
  }

  return (
    <View style={{ height: HEADER_HEIGHT }} nativeID={NAV_SHEAR_NATIVE_IDS.playDetail_header}>
      <View style={{ ...styles.container, paddingLeft: leadingInset }}>
        <TouchableOpacity onPress={back} style={{ ...styles.button, width: HEADER_HEIGHT }} activeOpacity={0.55}>
          <Icon name="chevron-left" size={18} style={styles.collapseIcon} />
        </TouchableOpacity>
      </View>
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
  },
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    flex: 0,
  },
  collapseIcon: {
    transform: [{ rotate: '-90deg' }],
  },
})
