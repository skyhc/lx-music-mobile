import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react'
import { View, TouchableOpacity, Platform } from 'react-native'
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
  const modalRef = useRef<ModalType>(null)
  const useWindowContent = Platform.OS == 'ios' && (position == 'left' || position == 'right')

  useImperativeHandle(ref, () => ({
    setVisible(visible: boolean) { modalRef.current?.setVisible(visible) },
  }))

  const [centeredViewStyle, modalViewStyle] = useMemo(() => {
    const fill = { position: 'absolute', left: 0, right: 0, bottom: 0, top: 0 } as const
    switch (position) {
      case 'top':
        return [
          { ...fill, justifyContent: 'flex-start' },
          { width: '100%', maxHeight: '78%', minHeight: '20%' },
        ] as const
      case 'left':
      case 'right':
        return [
          { ...fill, flexDirection: 'row', justifyContent: position == 'left' ? 'flex-start' : 'flex-end' },
          { minWidth: '45%', maxWidth: '78%', height: '100%', paddingTop: useWindowContent ? 0 : statusBarHeight },
        ] as const
      default:
        return [
          { ...fill, justifyContent: 'flex-end' },
          { width: '100%', maxHeight: '78%', minHeight: '20%', borderTopLeftRadius: 8, borderTopRightRadius: 8 },
        ] as const
    }
  }, [position, statusBarHeight, useWindowContent])

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
    <Modal onHide={onHide} keyHide={keyHide} bgHide={bgHide} bgColor="rgba(50,50,50,.2)" ref={modalRef}>
      <View style={{ ...styles.centeredView, ...centeredViewStyle, paddingBottom: keyboardShown ? keyboardHeight : 0 }}>
        <View style={{ ...styles.modalView, ...modalViewStyle, backgroundColor: theme['c-content-background'] }} onStartShouldSetResponder={() => true}>
          {useWindowContent ? <WindowContent>{content}</WindowContent> : content}
        </View>
      </View>
    </Modal>
  )
})
