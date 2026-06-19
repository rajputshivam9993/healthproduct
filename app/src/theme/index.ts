// Design system tokens (Req 18.2/18.7): healthcare palette, spacing (8-pt grid),
// radii, and typography scale. Light and dark palettes share the same token keys
// so components can theme without branching.

export interface Palette {
  primary: string;
  primaryMuted: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textMuted: string;
  border: string;
  danger: string;
  success: string;
}

export const lightPalette: Palette = {
  primary: '#1E6FE8',
  primaryMuted: '#E8F1FE',
  accent: '#20B486',
  background: '#FFFFFF',
  surface: '#F7F9FC',
  text: '#0F1B2D',
  textMuted: '#5B6B82',
  border: '#E2E8F0',
  danger: '#E5484D',
  success: '#20B486',
};

export const darkPalette: Palette = {
  primary: '#4D92FF',
  primaryMuted: '#15233B',
  accent: '#33C99B',
  background: '#0B1220',
  surface: '#131C2E',
  text: '#F4F7FB',
  textMuted: '#9AAAC2',
  border: '#243049',
  danger: '#FF6166',
  success: '#33C99B',
};

// WCAG contrast note (Req 18.8): dark text (#0F1B2D) on light bg and light text
// (#F4F7FB) on dark bg (#0B1220) both exceed 4.5:1 for body text.

// 8-point spacing grid (Req 18.7).
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 20,
  pill: 999,
} as const;

export const typography = {
  h1: { fontSize: 28, fontWeight: '700' as const },
  h2: { fontSize: 22, fontWeight: '700' as const },
  h3: { fontSize: 18, fontWeight: '600' as const },
  body: { fontSize: 15, fontWeight: '400' as const },
  caption: { fontSize: 13, fontWeight: '400' as const },
} as const;
