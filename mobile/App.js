import { StatusBar } from 'expo-status-bar';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import WelcomeScreen from './src/screens/WelcomeScreen';
import { theme } from './src/theme';

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <StatusBar style="dark" />
        <WelcomeScreen />
      </PaperProvider>
    </SafeAreaProvider>
  );
}
