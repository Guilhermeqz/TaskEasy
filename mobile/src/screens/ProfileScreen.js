import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Avatar, Button, Card, Switch, Text, useTheme } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import { useAppTheme } from '../context/ThemeContext';
import AlarmSettings from '../components/AlarmSettings';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { dark, saving, error: themeError, toggleTheme } = useAppTheme();
  const { colors } = useTheme();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function leave() {
    if (busy) return;
    setBusy(true);
    setError('');
    try { await logout(); }
    catch { setError('Não foi possível encerrar a sessão. Tente novamente.'); }
    finally { setBusy(false); }
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.profile}>
        <Avatar.Text size={72} label={user.nome.slice(0, 1).toUpperCase()} style={styles.avatar} />
        <Text variant="headlineSmall" accessibilityRole="header">{user.nome}</Text>
        <Text variant="bodyLarge" style={styles.email}>{user.email}</Text>
        <Card mode="outlined" style={styles.card}>
          <Card.Content style={styles.row}>
            <View style={styles.preference}>
              <Text variant="titleMedium">Tema escuro</Text>
              <Text variant="bodyMedium">Um visual confortável para você.</Text>
            </View>
            <Switch value={dark} onValueChange={toggleTheme} disabled={saving || busy} accessibilityLabel="Ativar tema escuro" />
          </Card.Content>
        </Card>
        {themeError || error ? <Text style={{ color: colors.error, marginBottom: 20 }} accessibilityLiveRegion="polite">{error || themeError}</Text> : null}
        <AlarmSettings />
        <Button mode="outlined" icon="logout" onPress={leave} loading={busy} disabled={busy}>Sair da conta</Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 24, paddingBottom: 48, flexGrow: 1 },
  profile: { width: '100%', maxWidth: 600, alignSelf: 'center' },
  avatar: { marginBottom: 24 },
  email: { marginTop: 8, marginBottom: 32 },
  card: { marginBottom: 32 },
  row: { flexDirection: 'row', gap: 16, alignItems: 'center' },
  preference: { flex: 1, gap: 8 },
});
