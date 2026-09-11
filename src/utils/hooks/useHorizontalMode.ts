import useWindowSize from './useWindowSize'
import { shouldUseHorizontalLayout } from '../layout'


export default () => {
  const windowSize = useWindowSize()

  return shouldUseHorizontalLayout(windowSize.width, windowSize.height)
}
