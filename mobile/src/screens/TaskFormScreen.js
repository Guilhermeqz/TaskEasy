import { useEffect, useState } from 'react';
import TaskForm from '../components/TaskForm';
import ScreenState from '../components/ScreenState';
import { useTaskActions } from '../hooks/useTasks';

export default function TaskFormScreen({ route, navigation }) {
  const id = route.params?.taskId;
  const { getTask, saveTask } = useTaskActions();
  const [original, setOriginal] = useState(null);
  const [loading, setLoading] = useState(Boolean(id));
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!id) return;
    let active = true;
    setLoading(true);
    setError('');
    getTask(id)
      .then((task) => { if (active) setOriginal(task); })
      .catch((failure) => { if (active) setError(failure.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id, getTask, attempt]);

  if (loading) return <ScreenState loading message="Carregando tarefa…" />;
  if (error) return <ScreenState message={error} onAction={() => setAttempt(attempt + 1)} />;

  async function onSave(values) {
    await saveTask(values, original);
    navigation.goBack();
  }

  return <TaskForm key={id || 'new'} initialTask={original} onSave={onSave} />;
}
