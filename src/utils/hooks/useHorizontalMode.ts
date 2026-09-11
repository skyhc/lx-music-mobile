import { useWindowSize } from '@/utils/hooks'
import { shouldUseHorizontalLayout } from '../layout'


export default () => {
  const windowSize = useWindowSize()

  return shouldUseHorizontalLayout(windowSize.width, windowSize.height)
}
