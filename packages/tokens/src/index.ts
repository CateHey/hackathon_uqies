/**
 * Free Me design tokens — shared by the web app (Tailwind theme + SVG) and the
 * mobile app (NativeWind + react-native-svg). Elegant, minimal, premium: a deep
 * ink ground, warm parchment surfaces, one gold accent, and a muted colour per
 * region type so the map reads as one world rather than a rainbow.
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
  success: "#6B8F71",
  warning: "#D08C3C",
  danger: "#B5533C",
} as const;

/** One colour per region type; keys mirror `RegionType` in @free-me/core. */
export const regionColors = {
  foundation: "#B08968",
  security: "#5B8DEF",
  growth: "#6B8F71",
  markets: "#7C5CBF",
  property: "#C96A3D",
  business: "#D9A441",
  digital_assets: "#3FA7A0",
  personal_goal: "#E07A9A",
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
