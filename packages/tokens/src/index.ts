/**
 * Free Me design tokens — shared by the web app (Tailwind theme + SVG) and the
 * mobile app (NativeWind + react-native-svg). Elegant, minimal, premium: a deep
 * ink ground, warm parchment surfaces, one gold accent, and one hue per region
 * type so the map reads as one world rather than a rainbow.
 *
 * The region hues were validated with the data-viz palette checker against the ink
 * surface (#0f1720): lightness band, chroma floor, contrast ≥ 3:1, and adjacent-pair
 * separation for colour-vision deficiency in the order regions appear on the map.
 * Every region also carries an emoji + title, so identity never rests on hue alone.
 */
export const colors = {
  ink: "#0F1720",
  inkSoft: "#1B2430",
  inkMuted: "#2A3542",
  parchment: "#F6F1E7",
  parchmentSoft: "#EFE7D8",
  gold: "#C9A227",
  goldSoft: "#E4CB6E",
  mist: "#94A3B8",
  fog: "#0B1118",
  white: "#FFFFFF",
  /** Status colours are reserved for state and always ship with an icon or label. */
  success: "#0CA30C",
  warning: "#FAB219",
  danger: "#D03B3B",
} as const;

/** One colour per region type; keys mirror `RegionType` in @free-me/core. Order = map order. */
export const regionColors = {
  foundation: "#C98500",
  security: "#3987E5",
  growth: "#008300",
  personal_goal: "#D45B95",
  markets: "#9085E9",
  property: "#D95926",
  business: "#199E70",
  digital_assets: "#E05C5C",
  /** The destination — the gold accent, not a series colour. */
  freedom_city: "#C9A227",
} as const;

export const regionEmoji = {
  foundation: "🏡",
  security: "🛡️",
  growth: "🌱",
  markets: "📈",
  property: "🏠",
  business: "💼",
  digital_assets: "₿",
  personal_goal: "🌍",
  freedom_city: "🕊️",
} as const;

export const fonts = {
  display: '"Iowan Old Style", "Palatino Linotype", Palatino, Georgia, "Times New Roman", serif',
  body: 'Inter, "Segoe UI", system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif',
  mono: '"JetBrains Mono", "SF Mono", Menlo, Consolas, monospace',
} as const;

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 40, xxl: 64 } as const;

export const radius = { sm: 6, md: 12, lg: 20, pill: 999 } as const;

export type RegionColorKey = keyof typeof regionColors;
