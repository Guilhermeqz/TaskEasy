import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../context/AuthContext';

export function useTasks() {
  const { request } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const version = useRef(0);

  const loadTasks = useCallback(async (refresh = false) => {
    const current = ++version.current;
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const result = await request('/tasks');
      if (current === version.current) setTasks(result);
    } catch (failure) {
      if (current === version.current) setError(failure.message);
    } finally {
      if (current === version.current) { setLoading(false); setRefreshing(false); }
    }
  }, [request]);

  useFocusEffect(useCallback(() => {
    loadTasks();
    return () => { version.current += 1; };
  }, [loadTasks]));

  return { tasks, loading, refreshing, error, reload: loadTasks };
}

export function useTaskActions() {
  const { request } = useAuth();
  const getTask = useCallback((id) => request(`/tasks/${id}`), [request]);
  const removeTask = useCallback((id) => request(`/tasks/${id}`, { method: 'DELETE' }), [request]);
  const saveTask = useCallback(async (task, original = null) => {
    const saved = await request(original ? `/tasks/${original.id}` : '/tasks', {
      method: original ? 'PUT' : 'POST', body: task,
    });
    if (saved.concluida && !original?.concluida) {
      // A vibração é opcional no dispositivo; falhar aqui não desfaz o salvamento.
      try { await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
    }
    return saved;
  }, [request]);
  return { getTask, saveTask, removeTask };
}
