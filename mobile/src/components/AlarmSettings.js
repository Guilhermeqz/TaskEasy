import { useCallback, useEffect, useState } from 'react';
import { AppState, StyleSheet, View } from 'react-native';
import { Button, Card, Text } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import { alarmsAvailable, enableAlarms, getAlarmStatus, stopAlarms, syncTaskAlarms } from '../services/alarms';

export default function AlarmSettings() {
  const { user, request } = useAuth();
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const refresh = useCallback(async () => {
    try { setStatus(await getAlarmStatus()); }
    catch { setError('Não foi possível consultar as permissões do despertador.'); }
  }, []);
  useEffect(() => {
    refresh();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        refresh();
        request('/tasks').then((tasks) => syncTaskAlarms(user.id, tasks)).catch(() => {});
      }
    });
    return () => subscription.remove();
  }, [refresh, request, user.id]);

  async function perform(action) {
    if (busy) return;
    setBusy(true); setError('');
    try { await action(); await refresh(); }
    catch { setError('Não foi possível ajustar o despertador. Tente novamente.'); }
    finally { setBusy(false); }
  }

  return <Card mode="outlined" style={styles.card}>
    <Card.Content style={styles.content}>
      <Text variant="titleMedium">Despertadores</Text>
      {!alarmsAvailable ? <Text>Para tocar continuamente com a tela bloqueada, use o APK próprio do TaskEasy. No Expo Go, o horário é salvo, mas o despertador não toca.</Text> : <>
        <Text>Alarmes exatos: {status?.exact ? 'permitidos' : 'não permitidos'}</Text>
        <Text>Notificações: {status?.notifications ? 'permitidas' : 'não permitidas'}</Text>
        <Text>Tela de alarme: {status?.fullScreen ? 'permitida' : 'não permitida'}</Text>
        <Button onPress={() => perform(enableAlarms)} disabled={busy} loading={busy}>Configurar permissões</Button>
        <Button icon="alarm-off" onPress={() => perform(stopAlarms)} disabled={busy}>Parar despertadores</Button>
      </>}
      {error ? <Text accessibilityLiveRegion="polite">{error}</Text> : null}
    </Card.Content>
  </Card>;
}
const styles = StyleSheet.create({ card: { marginBottom: 24 }, content: { gap: 12 } });
