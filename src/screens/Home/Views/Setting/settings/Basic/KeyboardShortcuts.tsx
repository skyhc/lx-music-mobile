import { Platform, View } from 'react-native'
import { useSettingValue } from '@/store/setting/hook'
import { updateSetting } from '@/core/common'
import CheckBoxItem from '../../components/CheckBoxItem'
import Text from '@/components/common/Text'
const KEYS = ['keyboard.enabled', 'keyboard.playback', 'keyboard.seek', 'keyboard.selection', 'keyboard.navigation'] as const
const LABELS = ['启用外接键盘快捷键', '播放控制：空格播放/暂停，⌘←/→上一首/下一首', '进度控制：←/→快退/快进 5 秒', '列表选择：↑/↓选择，回车播放，⌘L定位当前歌曲', '页面导航：⌘1–5切换页面，Esc关闭菜单']
const Option = ({ index }: { index: number }) => {
  const key = KEYS[index]
  const enabled = useSettingValue('keyboard.enabled')
  const value = useSettingValue(key)
  return <CheckBoxItem disabled={index > 0 && !enabled} check={value} label={LABELS[index]} onChange={value => updateSetting({ [key]: value })} />
}
export default () => Platform.OS != 'ios' ? null : <View style={{ paddingVertical: 12 }}>
  <Text size={16} style={{ paddingLeft: 14, fontWeight: '600' }}>键盘控制</Text>
  {KEYS.map((key, index) => <Option key={key} index={index} />)}
  <Text size={12} style={{ paddingHorizontal: 14 }}>输入文字时不拦截空格、方向键和回车。列表方向键只选择，不自动播放；回车确认播放。快捷键设置会保留。</Text>
</View>
