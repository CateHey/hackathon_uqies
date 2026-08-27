/**
 * Free Me design tokens — shared by the web app (Tailwind theme + SVG) and the
 * mobile app (NativeWind + react-native-svg). Modern and energetic: a near-black
 * ground, an orange accent for momentum, a green second accent for progress, and
 * one hue per region type so the map reads as one world rather than a rainbow.
 *
 * The region hues were validated with the data-viz palette checker against the ink
 * surface: lightness band, chroma floor, contrast ≥ 3:1, and adjacent-pair separation
 * for colour-vision deficiency in the order regions appear on the map. Every region
 * also carries an emoji + title, so identity never rests on hue alone.
 */
export const colors = {
  ink: "#0B1014",
  inkSoft: "#141B22",
  inkMuted: "#1F2A33",
  parchment: "#F4F6F5",
  parchmentSoft: "#E6EBE8",
  /** Brand accent — momentum. */
  accent: "#FF7A1A",
  accentSoft: "#FFA25C",
  /** Second accent — progress, growth, "go". */
  accent2: "#3DDC84",
  accent2Soft: "#8CF0B6",
  mist: "#8B97A6",
  fog: "#070A0D",
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
  /** The destination — the brand accent, not a series colour. */
  freedom_city: "#FF7A1A",
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
  freedom_city: "🚀",
} as const;

export const fonts = {
  display: '"Space Grotesk", "Segoe UI Variable Display", "Segoe UI", system-ui, -apple-system, sans-serif',
  body: 'Inter, "Segoe UI", system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif',
  mono: '"JetBrains Mono", "SF Mono", Menlo, Consolas, monospace',
} as const;

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 40, xxl: 64 } as const;

export const radius = { sm: 8, md: 14, lg: 22, pill: 999 } as const;

export type RegionColorKey = keyof typeof regionColors;
