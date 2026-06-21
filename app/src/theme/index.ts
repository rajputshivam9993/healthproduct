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
  primary: '#6C3FE8',
  primaryMuted: '#F0EAFF',
  accent: '#6C3FE8',
  background: '#FFFFFF',
  surface: '#FAF8FF',
  text: '#1A1A2E',
  textMuted: '#888888',
  border: '#E0D7FC',
  danger: '#E5484D',
  success: '#22C55E',
};

export const darkPalette: Palette = {
  primary: '#9B7BF2',
  primaryMuted: '#251A40',
  accent: '#9B7BF2',
  background: '#0B1220',
  surface: '#161226',
  text: '#F4F7FB',
  textMuted: '#9AAAC2',
  border: '#2E2447',
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
