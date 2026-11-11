import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Button, Icon, Text } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import { useAppTheme } from '../context/ThemeContext';
import ScreenState from '../components/ScreenState';
import LoginScreen from '../screens/LoginScreen';
import TasksScreen from '../screens/TasksScreen';
import ProfileScreen from '../screens/ProfileScreen';
import TaskDetailsScreen from '../screens/TaskDetailsScreen';
import TaskFormScreen from '../screens/TaskFormScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator screenOptions={{ tabBarLabelStyle: { fontSize: 12 }, tabBarHideOnKeyboard: true }}>
      <Tab.Screen name="Tasks" component={TasksScreen} options={{ title: 'Minhas Tarefas', tabBarLabel: 'Tarefas', tabBarIcon: ({ color, size }) => <Icon source="format-list-checks" color={color} size={size} /> }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Perfil', tabBarIcon: ({ color, size }) => <Icon source="account-outline" color={color} size={size} /> }} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const { user, restoring, restoreError, restoreSession, logout } = useAuth();
  const { dark, theme } = useAppTheme();
  const [error, setError] = useState('');
  const [leaving, setLeaving] = useState(false);
  const base = dark ? DarkTheme : DefaultTheme;
  const navigationTheme = { ...base, colors: {
    ...base.colors, primary: theme.colors.primary, background: theme.colors.background,
    card: theme.colors.surface, text: theme.colors.onSurface, border: theme.colors.outlineVariant,
  } };

  if (restoring) return <ScreenState loading message="Preparando sua sessão…" />;
  if (restoreError) return (
    <View style={styles.recovery}>
      <ScreenState message={restoreError} onAction={leaving ? undefined : restoreSession} />
      {error ? <Text accessibilityLiveRegion="polite">{error}</Text> : null}
      <Button disabled={leaving} loading={leaving} onPress={async () => {
        setLeaving(true);
        setError('');
        try { await logout(); }
        catch { setError('Não foi possível limpar a sessão. Tente novamente.'); }
        finally { setLeaving(false); }
      }}>Entrar novamente</Button>
    </View>
  );

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator screenOptions={{ animation: 'none' }}>
        {user ? <>
          <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
          <Stack.Screen name="TaskDetails" component={TaskDetailsScreen} options={{ title: 'Detalhes da tarefa' }} />
          <Stack.Screen name="TaskForm" component={TaskFormScreen} options={({ route }) => ({ title: route.params?.taskId ? 'Editar tarefa' : 'Nova tarefa' })} />
        </> : <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({ recovery: { flex: 1, padding: 24, paddingBottom: 48 } });
