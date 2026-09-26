export const xAppColors = {
  light: {
    background: '#F6F7F9',
    surface: '#FFFFFF',
    surfaceSubtle: '#EEF1F5',
    text: '#111318',
    textSecondary: '#69707D',
    border: '#E2E6EC',
    accent: '#7C3AED',
    accentSoft: '#EDE9FE',
    success: '#16A34A',
    danger: '#DC2626',
  },
  dark: {
    background: '#0B0D10',
    surface: '#15181D',
    surfaceSubtle: '#1D2128',
    text: '#F5F7FA',
    textSecondary: '#969DA8',
    border: '#292E36',
    accent: '#A78BFA',
    accentSoft: '#2E1B4E',
    success: '#4ADE80',
    danger: '#F87171',
  },
} as const;

export type XAppColorScheme = keyof typeof xAppColors;
