import { StatusBar } from 'expo-status-bar';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View } from 'react-native';
import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider, useAppTheme } from './src/context/ThemeContext';
import RootNavigator from './src/navigation/RootNavigator';
import ScreenState from './src/components/ScreenState';

function Application() {
  const { theme, dark, ready } = useAppTheme();
  return (
    <PaperProvider theme={theme}>
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <StatusBar style={dark ? 'light' : 'dark'} />
        {ready ? <AuthProvider><RootNavigator /></AuthProvider> : <ScreenState loading message="Preparando o aplicativo…" />}
      </View>
    </PaperProvider>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider><Application /></ThemeProvider>
    </SafeAreaProvider>
  );
}
