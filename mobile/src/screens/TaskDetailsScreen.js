import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Button, Chip, Dialog, Paragraph, Portal, Text, useTheme } from 'react-native-paper';
import { useTaskActions } from '../hooks/useTasks';
import ScreenState from '../components/ScreenState';

export default function TaskDetailsScreen({ route, navigation }) {
  const { colors } = useTheme();
  const { taskId } = route.params;
  const { getTask, saveTask, removeTask } = useTaskActions();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useFocusEffect(useCallback(() => {
    let active = true;
    setLoading(true);
    setError('');
    getTask(taskId)
      .then((result) => { if (active) setTask(result); })
      .catch((failure) => { if (active) setError(failure.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [taskId, getTask, attempt]));

  async function complete() {
    if (busy) return;
    setBusy(true);
    setActionError('');
    try { setTask(await saveTask({ titulo: task.titulo, descricao: task.descricao, concluida: true }, task)); }
    catch (failure) { setActionError(failure.message); }
    finally { setBusy(false); }
  }

  async function deleteTask() {
    if (busy) return;
    setConfirmDelete(false);
    setBusy(true);
    setActionError('');
    try {
      await removeTask(taskId);
      navigation.goBack();
    } catch (failure) { setActionError(failure.message); }
    finally { setBusy(false); }
  }

  if (loading) return <ScreenState loading message="Carregando tarefa…" />;
  if (error) return <ScreenState message={error} onAction={() => setAttempt(attempt + 1)} />;
  if (!task) return <ScreenState message="Tarefa excluída." actionLabel="Voltar às tarefas" onAction={() => navigation.goBack()} />;

  return (
    <>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.detail}>
          <Chip icon={task.concluida ? 'check-circle-outline' : 'clock-outline'} style={styles.chip}>
            {task.concluida ? 'Concluída' : 'Pendente'}
          </Chip>
          <Text variant="headlineMedium" style={styles.title} accessibilityRole="header">{task.titulo}</Text>
          <Text variant="bodyLarge" style={styles.description}>{task.descricao || 'Nenhuma descrição adicionada.'}</Text>
          {actionError ? <Text style={{ color: colors.error }} accessibilityLiveRegion="polite">{actionError}</Text> : null}
          {!task.concluida ? <Button mode="contained" icon="check" onPress={complete} disabled={busy} loading={busy}>Concluir tarefa</Button> : null}
          <Button mode="outlined" icon="pencil-outline" onPress={() => navigation.navigate('TaskForm', { taskId })} disabled={busy}>Editar tarefa</Button>
          <Button icon="delete-outline" textColor={colors.error} onPress={() => setConfirmDelete(true)} disabled={busy}>Excluir tarefa</Button>
        </View>
      </ScrollView>
      <Portal>
        <Dialog visible={confirmDelete} onDismiss={() => setConfirmDelete(false)}>
          <Dialog.Title>Excluir tarefa?</Dialog.Title>
          <Dialog.Content><Paragraph>Esta ação não pode ser desfeita.</Paragraph></Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setConfirmDelete(false)}>Cancelar</Button>
            <Button textColor={colors.error} onPress={deleteTask}>Excluir</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
}

const styles = StyleSheet.create({
  content: { padding: 24, paddingBottom: 48, flexGrow: 1 },
  detail: { width: '100%', maxWidth: 600, alignSelf: 'center', gap: 16 },
  chip: { alignSelf: 'flex-start' },
  title: { fontWeight: '700', marginTop: 8 },
  description: { marginBottom: 24, lineHeight: 26 },
});
