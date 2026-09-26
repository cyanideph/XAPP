import { createTamagui } from 'tamagui';
import { createV5Theme, defaultConfig } from '@tamagui/config/v5';
import { animations } from '@tamagui/config/v5-rn';

// XAPP Emerald + Ink base palettes.
// The base theme stays mostly neutral; Emerald is exposed as the brand child theme.
const lightPalette = [
  '#F7F8F6',
  '#FFFFFF',
  '#FDFEFC',
  '#F1F4F1',
  '#E2E8E3',
  '#D2DBD5',
  '#B8C4BC',
  '#98A69D',
  '#66736B',
  '#46534B',
  '#2B372F',
  '#17201B',
];

const darkPalette = [
  '#0D1410',
  '#141C17',
  '#1B251F',
  '#202C25',
  '#29352E',
  '#3A473F',
  '#5D6B63',
  '#7F8D85',
  '#AAB8AF',
  '#C5D0C9',
  '#DDE7E0',
  '#F2F7F3',
];

const emeraldLight = {
  color1: '#E8F8F1',
  color2: '#DDF5EA',
  color3: '#C8EEDD',
  color4: '#AFE4CC',
  color5: '#8ED9B8',
  color6: '#69CDA2',
  color7: '#49BE8E',
  color8: '#2EAB7A',
  color9: '#087F5B',
  color10: '#066B4C',
  color11: '#05563E',
  color12: '#033D2D',
};

const emeraldDark = {
  color1: '#0D2119',
  color2: '#102C21',
  color3: '#123A2A',
  color4: '#164A35',
  color5: '#1B6044',
  color6: '#237D59',
  color7: '#2E9D70',
  color8: '#35C994',
  color9: '#49D7A1',
  color10: '#6AE1B1',
  color11: '#9AEDD0',
  color12: '#D5F8E9',
};

const themes = createV5Theme({
  lightPalette,
  darkPalette,
  childrenThemes: {
    emerald: {
      light: emeraldLight,
      dark: emeraldDark,
    },
  },
});

export const tamaguiConfig = createTamagui({
  ...defaultConfig,
  themes,
  animations,
  settings: {
    ...defaultConfig.settings,
    styleCompat: 'react-native',
  },
});

export default tamaguiConfig;

export type AppTamaguiConfig = typeof tamaguiConfig;

declare module 'tamagui' {
  interface TamaguiCustomConfig extends AppTamaguiConfig {}
}
