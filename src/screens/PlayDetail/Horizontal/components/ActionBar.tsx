import { useRef } from 'react'
import { View } from 'react-native'
import { useSetting } from '@/store/setting/hook'
import { useTheme } from '@/store/theme/hook'
import { isSoundEffectActive } from '@/plugins/player/soundEffect'
import SettingPopup, { type SettingPopupType } from '../../components/SettingPopup'
import SoundEffectPopup, { type SoundEffectPopupType } from '../../components/SoundEffectPopup'
import CommentBtn from './CommentBtn'
import Btn from './Btn'
import MoreBtn from '../MoreBtn'
import { createStyle } from '@/utils/tools'

export default () => {
  const popupRef = useRef<SettingPopupType>(null)
  const soundEffectPopupRef = useRef<SoundEffectPopupType>(null)
  const setting = useSetting()
  const theme = useTheme()

  return (
    <>
      <View style={styles.container}>
        <CommentBtn />
        <Btn
          icon="slider"
          color={isSoundEffectActive(setting) ? theme['c-primary-font-active'] : undefined}
          onPress={() => { soundEffectPopupRef.current?.show() }}
        />
        <MoreBtn />
        <Btn icon="setting" size={18} onPress={() => { popupRef.current?.show() }} />
      </View>
      <SoundEffectPopup ref={soundEffectPopupRef} position="bottom" layoutMode="split" />
      <SettingPopup ref={popupRef} position="left" direction="horizontal" />
    </>
  )
}

const styles = createStyle({
  container: {
    flexShrink: 0,
    flexGrow: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 2,
    paddingBottom: 2,
  },
})
