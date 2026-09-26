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

// Semantic status scales keep feedback colors consistent across the app.
const successLight = {
  color1: '#F0FDF7',
  color2: '#DCFCEB',
  color3: '#C4F4D8',
  color4: '#A7EFC6',
  color5: '#7DE4AC',
  color6: '#4FD293',
  color7: '#2DB97A',
  color8: '#149B63',
  color9: '#087F5B',
  color10: '#066B4C',
  color11: '#05563E',
  color12: '#033D2D',
};

const successDark = {
  color1: '#0A1E16',
  color2: '#0D2B20',
  color3: '#103B2B',
  color4: '#144B36',
  color5: '#196244',
  color6: '#207B54',
  color7: '#2A9A6B',
  color8: '#35C994',
  color9: '#49D7A1',
  color10: '#6AE1B1',
  color11: '#9AEDD0',
  color12: '#D5F8E9',
};

const warningLight = {
  color1: '#FFFBEB',
  color2: '#FFF3C4',
  color3: '#FDE7A0',
  color4: '#F9D978',
  color5: '#F3C64D',
  color6: '#E8B332',
  color7: '#D99C16',
  color8: '#C78300',
  color9: '#A66B00',
  color10: '#875600',
  color11: '#684200',
  color12: '#472E00',
};

const warningDark = {
  color1: '#211700',
  color2: '#2E2100',
  color3: '#3D2C00',
  color4: '#513A00',
  color5: '#684A00',
  color6: '#805B00',
  color7: '#9A6E00',
  color8: '#B98100',
  color9: '#D49A18',
  color10: '#E3A93B',
  color11: '#F0C66A',
  color12: '#FFE5A3',
};

const errorLight = {
  color1: '#FFF5F5',
  color2: '#FFE5E5',
  color3: '#FFD0D0',
  color4: '#FFB7B7',
  color5: '#FF9999',
  color6: '#F97D7D',
  color7: '#E96464',
  color8: '#D94D4D',
  color9: '#C83B3B',
  color10: '#A72F2F',
  color11: '#842525',
  color12: '#5C1919',
};

const errorDark = {
  color1: '#261010',
  color2: '#351515',
  color3: '#471B1B',
  color4: '#5A2222',
  color5: '#702B2B',
  color6: '#893535',
  color7: '#A54141',
  color8: '#C25353',
  color9: '#F06A6A',
  color10: '#FF8585',
  color11: '#FFAAAA',
  color12: '#FFD0D0',
};

const infoLight = {
  color1: '#F4F9FF',
  color2: '#E5F1FF',
  color3: '#D1E5FA',
  color4: '#B9D7F2',
  color5: '#9CC5EA',
  color6: '#7DB2DF',
  color7: '#5D9DD0',
  color8: '#4689C2',
  color9: '#3578B8',
  color10: '#2B6198',
  color11: '#214C78',
  color12: '#173757',
};

const infoDark = {
  color1: '#0D1824',
  color2: '#102235',
  color3: '#142D46',
  color4: '#193A58',
  color5: '#214A6D',
  color6: '#2B5D86',
  color7: '#3975A4',
  color8: '#4B8FC3',
  color9: '#69A8E0',
  color10: '#86BCE9',
  color11: '#ADD3F2',
  color12: '#D2E9FA',
};

const themes = createV5Theme({
  lightPalette,
  darkPalette,
  childrenThemes: {
    emerald: {
      light: emeraldLight,
      dark: emeraldDark,
    },
    success: {
      light: successLight,
      dark: successDark,
    },
    warning: {
      light: warningLight,
      dark: warningDark,
    },
    error: {
      light: errorLight,
      dark: errorDark,
    },
    info: {
      light: infoLight,
      dark: infoDark,
    },
  },
  getTheme: ({ scheme }) => ({
    // XAPP semantic aliases. Tamagui still supplies its built-in
    // opacity, shadow, highlight, accent, and 12-step tokens.
    brandBackground: scheme === 'dark' ? '#35C994' : '#087F5B',
    brandBackgroundHover: scheme === 'dark' ? '#49D7A1' : '#066B4C',
    brandBackgroundPress: scheme === 'dark' ? '#249E72' : '#05563E',
    brandColor: scheme === 'dark' ? '#0D1410' : '#FFFFFF',
    brandSoft: scheme === 'dark' ? '#163D2E' : '#DDF5EA',
    success: scheme === 'dark' ? '#35C994' : '#087F5B',
    warning: scheme === 'dark' ? '#E3A93B' : '#C78300',
    error: scheme === 'dark' ? '#F06A6A' : '#C83B3B',
    info: scheme === 'dark' ? '#69A8E0' : '#3578B8',
    focusRing: scheme === 'dark' ? '#49D7A1' : '#087F5B',
    overlay: scheme === 'dark' ? 'rgba(0, 0, 0, 0.56)' : 'rgba(23, 32, 27, 0.32)',
    scrim: scheme === 'dark' ? 'rgba(0, 0, 0, 0.72)' : 'rgba(23, 32, 27, 0.48)',
  }),
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
