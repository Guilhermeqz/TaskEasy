import { FlatList, StyleSheet, View } from 'react-native';
import { Button, Card, Chip, Text, useTheme } from 'react-native-paper';
import { useTasks } from '../hooks/useTasks';
import ScreenState from '../components/ScreenState';
import QuoteCard from '../components/QuoteCard';
import { reminderLabel } from '../utils/reminder';

export default function TasksScreen({ navigation }) {
  const { tasks, loading, refreshing, error, reload } = useTasks();
  const { colors } = useTheme();

  return (
    <FlatList
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.content}
      data={tasks}
      keyExtractor={(item) => String(item.id)}
      refreshing={refreshing}
      onRefresh={() => reload(true)}
      ListHeaderComponent={<>
        <Text variant="headlineSmall" style={styles.title} accessibilityRole="header">Seu dia, mais leve.</Text>
        <Text variant="bodyLarge" style={styles.subtitle}>Organize o que importa, uma tarefa de cada vez.</Text>
        <QuoteCard />
        <Button mode="contained" icon="plus" onPress={() => navigation.navigate('TaskForm')} style={styles.add}>Adicionar tarefa</Button>
        {error && tasks.length > 0 ? <ScreenState message={error} onAction={() => reload()} /> : null}
      </>}
      ListEmptyComponent={<View style={styles.empty}>
        <ScreenState loading={loading} message={loading ? 'Carregando suas tarefas…' : error || 'Nenhuma tarefa por aqui. Que tal adicionar a primeira?'}
          onAction={!loading && error ? () => reload() : undefined} />
      </View>}
      renderItem={({ item }) => (
        <Card mode="outlined" style={styles.card} onPress={() => navigation.navigate('TaskDetails', { taskId: item.id })}
          accessibilityLabel={`${item.titulo}, ${item.concluida ? 'concluída' : 'pendente'}. Abrir detalhes.`}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.taskTitle}>{item.titulo}</Text>
            {item.horario ? <Text style={styles.taskTitle}>{reminderLabel(item)}</Text> : null}
            <Chip icon={item.concluida ? 'check-circle-outline' : 'clock-outline'} style={styles.chip} textStyle={styles.chipText}>
              {item.concluida ? 'Concluída' : 'Pendente'}
            </Chip>
          </Card.Content>
        </Card>
      )}
    />
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, padding: 20, paddingBottom: 40, width: '100%', maxWidth: 680, alignSelf: 'center' },
  title: { fontWeight: '700', marginBottom: 8 },
  subtitle: { marginBottom: 24 },
  add: { marginBottom: 24 },
  empty: { minHeight: 200, flex: 1 },
  card: { marginBottom: 12 },
  taskTitle: { marginBottom: 12 },
  chip: { alignSelf: 'flex-start' },
  chipText: { fontSize: 12 },
});
