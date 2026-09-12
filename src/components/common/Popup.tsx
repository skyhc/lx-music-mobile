import { shouldUseIPadLayout } from '@/utils/layout'
import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react'
import { View, Animated, TouchableOpacity, Platform, useWindowDimensions } from 'react-native'
import Modal, { type ModalType } from './Modal'
import { Icon } from '@/components/common/Icon'
import { useKeyboard } from '@/utils/hooks'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import Text from './Text'
import { useStatusbarHeight } from '@/store/common/hook'
import WindowContent from '@/components/WindowContent'

const styles = createStyle({
  centeredView: { flex: 1 },
  modalView: { elevation: 6, flexGrow: 0, flexShrink: 1 },
  header: { flexShrink: 0, minHeight: 44, flexDirection: 'row', alignItems: 'center', borderTopLeftRadius: 8, borderTopRightRadius: 8 },
  title: { flex: 1, paddingLeft: 12, paddingRight: 48, paddingVertical: 10 },
  closeBtn: { position: 'absolute', right: 0, top: 0, height: 44, width: 44, justifyContent: 'center', alignItems: 'center' },
})

export interface PopupProps {
  onHide?: () => void
  keyHide?: boolean
  bgHide?: boolean
  closeBtn?: boolean
  position?: 'top' | 'left' | 'right' | 'bottom'
  title?: string
  children: React.ReactNode
}
export interface PopupType {
  setVisible: (visible: boolean) => void
}

export default forwardRef<PopupType, PopupProps>(({
  onHide = () => {}, keyHide = true, bgHide = true, closeBtn = true,
  position = 'bottom', title = '', children,
}: PopupProps, ref) => {
  const theme = useTheme()
  const { keyboardShown, keyboardHeight } = useKeyboard()
  const statusBarHeight = useStatusbarHeight()
  const { width, height } = useWindowDimensions()
  const modalRef = useRef<ModalType>(null)
  const entrance = useRef(new Animated.Value(1)).current
  // Central policy also covers player sheets whose callers still request bottom.
  const actualPosition = Platform.OS == 'ios' && Platform.isPad && shouldUseIPadLayout(width, height) ? 'left' : position
  const useWindowContent = Platform.OS == 'ios' && (actualPosition == 'left' || actualPosition == 'right')

  useImperativeHandle(ref, () => ({
    setVisible(visible: boolean) {
      entrance.stopAnimation()
      entrance.setValue(visible && actualPosition == 'left' ? 0 : 1)
      modalRef.current?.setVisible(visible)
    },
  }))

  const [centeredViewStyle, modalViewStyle] = useMemo(() => {
    const fill = { flex: 1, minWidth: 0, minHeight: 0 } as const
    switch (actualPosition) {
      case 'top':
        return [
          { ...fill, justifyContent: 'flex-start' },
          { width: '100%', maxHeight: '78%', minHeight: '20%' },
        ] as const
      case 'left':
      case 'right':
        return [
          { ...fill, flexDirection: 'row', justifyContent: actualPosition == 'left' ? 'flex-start' : 'flex-end' },
          { minWidth: '45%', maxWidth: '78%', height: '100%', paddingTop: useWindowContent ? 0 : statusBarHeight },
        ] as const
      default:
        return [
          { ...fill, justifyContent: 'flex-end' },
          { width: '100%', maxHeight: '78%', minHeight: '20%', borderTopLeftRadius: 8, borderTopRightRadius: 8 },
        ] as const
    }
  }, [actualPosition, statusBarHeight, useWindowContent])

  const content = (
    <>
      <View style={styles.header}>
        <Text size={13} style={styles.title} numberOfLines={1}>{title}</Text>
        {closeBtn ? (
          <TouchableOpacity style={styles.closeBtn} accessibilityRole="button" accessibilityLabel="关闭" onPress={() => modalRef.current?.setVisible(false)}>
            <Icon name="close" style={{ color: theme['c-font-label'] }} size={12} />
          </TouchableOpacity>
        ) : null}
      </View>
      {children}
    </>
  )

  return (
    <Modal animationType={actualPosition == 'left' ? 'none' : 'fade'} onShow={() => {
      if (actualPosition == 'left') Animated.timing(entrance, { toValue: 1, duration: 220, useNativeDriver: true }).start()
    }} onHide={onHide} keyHide={keyHide} bgHide={bgHide} bgColor="rgba(50,50,50,.2)" ref={modalRef}>
      <View style={{ ...styles.centeredView, ...centeredViewStyle, paddingBottom: keyboardShown ? keyboardHeight : 0 }}>
        <Animated.View style={{ ...styles.modalView, ...modalViewStyle, transform: actualPosition == 'left' ? [{ translateX: entrance.interpolate({ inputRange: [0, 1], outputRange: [-width, 0] }) }] : undefined, backgroundColor: theme['c-content-background'] }} onStartShouldSetResponder={() => true}>
          {useWindowContent ? <WindowContent>{content}</WindowContent> : content}
        </Animated.View>
      </View>
    </Modal>
  )
})
