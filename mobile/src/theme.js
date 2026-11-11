import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';

export const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#46685A',
    primaryContainer: '#DAEADF',
    background: '#F7F9F6',
    surface: '#FFFFFF',
    onSurface: '#23362D',
    onSurfaceVariant: '#526159',
  },
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#AFD2BC',
    primaryContainer: '#304D3C',
    background: '#131B16',
    surface: '#1C261F',
    onSurface: '#E0ECE2',
    onSurfaceVariant: '#BCCBBF',
  },
};
