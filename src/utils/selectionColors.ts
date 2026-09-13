// Selected/current states must remain visible even in monochrome/custom themes.
// Pair foreground with its own opaque surface, never with the page primary hue.
export const selectionColors = (theme: { isDark?: boolean }) => theme.isDark
  ? { background: '#243F58', text: '#FFFFFF', indicator: '#8ED1FF', border: '#8ED1FF' }
  : { background: '#D9EAF9', text: '#102F4A', indicator: '#125780', border: '#125780' }
