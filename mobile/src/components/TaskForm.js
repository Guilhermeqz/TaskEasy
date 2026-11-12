import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Button, HelperText, Switch, Text, TextInput, useTheme } from 'react-native-paper';
import { alarmsAvailable } from '../services/alarms';
import { isValidTime, reminderFields, reminderLabel } from '../utils/reminder';

export default function TaskForm({ initialTask, onSave }) {
  const { colors } = useTheme();
  const [titulo, setTitulo] = useState(initialTask?.titulo || '');
  const [descricao, setDescricao] = useState(initialTask?.descricao || '');
  const [concluida, setConcluida] = useState(initialTask?.concluida || false);
  const [alarmEnabled, setAlarmEnabled] = useState(Boolean(initialTask?.horario));
  const [horario, setHorario] = useState(initialTask?.horario || '09:00');
  const [repeats, setRepeats] = useState(Boolean(initialTask?.repetir_diariamente));
  const [reschedule, setReschedule] = useState(false);
  const [saving, setSaving] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    if (saving) return;
    setAttempted(true);
    setError('');
    if (!titulo.trim() || (alarmEnabled && !isValidTime(horario))) return;
    setSaving(true);
    try {
      await onSave({ titulo: titulo.trim(), descricao: descricao.trim(), concluida,
        ...reminderFields({ enabled: alarmEnabled, horario, repeats, completed: concluida, original: initialTask, reschedule }) });
    }
    catch (failure) { setError(failure.message); }
    finally { setSaving(false); }
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={96}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.form}>
          <Text variant="titleLarge" style={styles.heading}>{initialTask ? 'Ajuste os detalhes' : 'O que você precisa fazer?'}</Text>
          <TextInput label="Título" accessibilityLabel="Título" mode="outlined" value={titulo} onChangeText={setTitulo} maxLength={120}
            disabled={saving} error={attempted && !titulo.trim()} />
          <HelperText type={attempted && !titulo.trim() ? 'error' : 'info'}>
            {attempted && !titulo.trim() ? 'O título é obrigatório.' : `${titulo.length}/120 caracteres`}
          </HelperText>
          <TextInput label="Descrição (opcional)" accessibilityLabel="Descrição (opcional)" mode="outlined" value={descricao} onChangeText={setDescricao}
            multiline numberOfLines={5} maxLength={2000} disabled={saving} style={styles.description} />
          <HelperText type="info">{descricao.length}/2000 caracteres</HelperText>
          <View style={styles.switchRow}>
            <View style={styles.switchText}>
              <Text variant="titleMedium">Despertador por horário</Text>
              <Text variant="bodyMedium">Toque contínuo até você parar.</Text>
            </View>
            <Switch value={alarmEnabled} onValueChange={(value) => { setAlarmEnabled(value); setReschedule(true); }}
              disabled={saving} accessibilityLabel="Ativar despertador por horário" />
          </View>
          {alarmEnabled ? <>
            <TextInput label="Horário" accessibilityLabel="Horário" placeholder="09:00" mode="outlined"
              value={horario} maxLength={5} keyboardType="numbers-and-punctuation" disabled={saving}
              onChangeText={(value) => {
                setHorario(value.replace(/\D/g, '').slice(0, 4).replace(/^(\d{2})(\d)/, '$1:$2'));
                setReschedule(true);
              }} error={attempted && !isValidTime(horario)} />
            <HelperText type={attempted && !isValidTime(horario) ? 'error' : 'info'}>
              {attempted && !isValidTime(horario) ? 'Use um horário de 00:00 a 23:59, como 09:00.' : 'Horário local do celular. Se já passou, o próximo toque será amanhã.'}
            </HelperText>
            <View style={styles.switchRow}>
              <View style={styles.switchText}>
                <Text variant="titleMedium">Repetir todos os dias</Text>
                <Text variant="bodyMedium">{repeats ? 'Até concluir a tarefa ou desativar o despertador.' : 'Tocar apenas uma vez.'}</Text>
              </View>
              <Switch value={repeats} onValueChange={(value) => { setRepeats(value); setReschedule(true); }}
                disabled={saving} accessibilityLabel="Repetir despertador todos os dias" />
            </View>
            {initialTask?.lembrete_em && !reschedule && !repeats ? <>
              <Text>{reminderLabel(initialTask)}</Text>
              <Button onPress={() => setReschedule(true)} disabled={saving}>Reagendar no próximo horário</Button>
            </> : null}
            {!alarmsAvailable ? <Text style={styles.alarmNote}>O horário será salvo. O despertador toca no APK próprio; ele não funciona no Expo Go.</Text> :
              <Text style={styles.alarmNote}>Ative as permissões de despertador em Perfil. O volume de alarmes do celular precisa estar audível.</Text>}
          </> : null}
          <View style={styles.switchRow}>
            <View style={styles.switchText}>
              <Text variant="titleMedium">Tarefa concluída</Text>
              <Text variant="bodyMedium">{concluida ? 'Tudo certo por aqui.' : 'Ainda há algo para fazer.'}</Text>
            </View>
            <Switch value={concluida} onValueChange={setConcluida} disabled={saving} accessibilityLabel="Tarefa concluída" />
          </View>
          {error ? <Text style={{ color: colors.error, marginBottom: 16 }} accessibilityLiveRegion="polite">{error}</Text> : null}
          <Button mode="contained" icon="content-save-outline" onPress={submit} loading={saving} disabled={saving} contentStyle={styles.button}>
            Salvar tarefa
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 24, paddingBottom: 48, flexGrow: 1 },
  form: { width: '100%', maxWidth: 600, alignSelf: 'center' },
  heading: { marginBottom: 24 },
  description: { minHeight: 140 },
  alarmNote: { marginVertical: 16 },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 12, marginBottom: 32 },
  switchText: { flex: 1, gap: 4 },
  button: { minHeight: 48 },
});
