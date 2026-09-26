import { createTamagui } from 'tamagui';
import { createV5Theme, defaultConfig } from '@tamagui/config/v5';
import { animations } from '@tamagui/config/v5-rn';

const lightPalette = [
  '#FFFFFF',
  '#F8F8F6',
  '#F1F1EE',
  '#E8E8E4',
  '#DCDCD6',
  '#C9C9C2',
  '#A9AAA2',
  '#7C7E76',
  '#5C5F57',
  '#3E413B',
  '#20231F',
  '#11140F',
];

const darkPalette = [
  '#11140F',
  '#171A15',
  '#1E211C',
  '#292C26',
  '#363A33',
  '#484C45',
  '#666A62',
  '#858981',
  '#A7AAA3',
  '#C9CBC5',
  '#E7E9E4',
  '#F7F8F5',
];

const themes = createV5Theme({
  lightPalette,
  darkPalette,
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
