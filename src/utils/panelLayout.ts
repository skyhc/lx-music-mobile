export type PanelPosition = 'top' | 'bottom' | 'left' | 'right' | 'center'
export const panelPosition = (ios: boolean, kind: 'list' | 'panel', requested: PanelPosition): PanelPosition =>
  ios ? kind == 'list' ? 'left' : 'center' : requested
export const panelBounds = (width: number, height: number, kind: 'list' | 'panel') => ({
  width: Math.max(0, Math.min(kind == 'list' ? 420 : 680, width - 24)),
  height: Math.max(0, Math.min(kind == 'list' ? 600 : 620, height - 24)),
})
export const listGridLayout = (width: number) => {
  const available = Math.max(0, width - 32)
  const columns = Math.max(1, Math.min(3, Math.floor((available + 12) / 188)))
  return { columns, itemWidth: Math.max(0, (available + 12) / columns) }
}
