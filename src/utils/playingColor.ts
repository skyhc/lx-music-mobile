import { compositeColor, contrastRatio, readableColor } from './readability'
type Theme = { isDark?: boolean } & Partial<Record<'c-primary' | 'c-primary-font' | 'c-theme' | 'c-badge-secondary' | 'c-font' | 'c-content-background' | 'c-main-background', string>>
type RGB = [number, number, number]
const rgb = (value: string): RGB => (value.match(/[\d.]+/g)?.slice(0, 3).map(Number) ?? [0, 0, 0]) as RGB
const hsl = ([red, green, blue]: RGB) => {
  const r = red / 255, g = green / 255, b = blue / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min, l = (max + min) / 2
  const s = d == 0 ? 0 : d / (1 - Math.abs(2 * l - 1))
  const h = d == 0 ? 0 : max == r ? ((g - b) / d + 6) % 6 : max == g ? (b - r) / d + 2 : (r - g) / d + 4
  return { h: h / 6, s, l }
}
const fromHSL = (h: number, s: number, l: number) => {
  const a = s * Math.min(l, 1 - l)
  const channel = (n: number) => {
    const k = (n + h * 12) % 12
    return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))))
  }
  return `rgb(${channel(0)}, ${channel(8)}, ${channel(4)})`
}
const cache = new Map<string, string>()
export const songSurface = (theme: Theme, surface?: string) => {
  const base = compositeColor(theme['c-content-background'] || 'transparent', theme.isDark ? '#121212' : '#ffffff')
  return compositeColor(surface || theme['c-main-background'] || base, base)
}
// Playing is NOT a selection surface. Retain the active theme's hue, restrain
// saturation, and choose a readable luminance rather than a fixed blue/white.
export const playingColor = (theme: Theme, surface?: string): string => {
  const bg = songSurface(theme, surface)
  const accents = [theme['c-primary'], theme['c-primary-font'], theme['c-theme'], theme['c-badge-secondary']].filter(Boolean) as string[]
  const palettes = accents.map(c => hsl(rgb(compositeColor(c, bg))))
  const accent = palettes.find(c => c.s >= 0.12) ?? palettes[0] ?? hsl(rgb(compositeColor(theme['c-font'] || '#808080', bg)))
  const key = `${bg}|${accent.h}|${accent.s}|${theme['c-font']}`
  const previous = cache.get(key)
  if (previous) return previous
  // Saturated source themes remain recognizable without neon colours. Neutral
  // themes remain neutral unless they already provide another coloured accent.
  const saturation = accent.s < 0.12 ? 0 : Math.min(0.64, Math.max(0.38, accent.s * 0.85))
  const darkSurface = contrastRatio('#ffffff', bg) > contrastRatio('#000000', bg)
  const target = accent.s < 0.12 ? (darkSurface ? 10 : 9) : 6
  let best = '', score = Infinity
  for (let step = 2; step <= 98; step++) {
    const c = fromHSL(accent.h, saturation, step / 100)
    const contrast = contrastRatio(c, bg)
    if (contrast < 4.8) continue
    // Prefer 6:1, not maximum luminosity. Avoid merging with normal text.
    const normal = hsl(rgb(compositeColor(theme['c-font'] || (darkSurface ? '#aaa' : '#444'), bg)))
    const separation = Math.abs(step / 100 - normal.l) + saturation * 0.3
    const cost = Math.abs(contrast - target) + (separation < 0.13 ? 1.5 : 0)
    if (cost < score) { score = cost; best = c }
  }
  const result = best || readableColor(fromHSL(accent.h, saturation, 0.5), bg, 4.8)
  if (cache.size > 256) cache.clear()
  cache.set(key, result)
  return result
}
