import { act, renderHook } from '@testing-library/react-native';
import * as Haptics from 'expo-haptics';
import { useTaskActions } from '../src/hooks/useTasks';
import { useAuth } from '../src/context/AuthContext';

jest.mock('@react-navigation/native', () => ({ useFocusEffect: jest.fn() }));
jest.mock('../src/context/AuthContext', () => ({ useAuth: jest.fn() }));
jest.mock('expo-haptics', () => ({
  notificationAsync: jest.fn().mockResolvedValue(undefined),
  NotificationFeedbackType: { Success: 'success' },
}));

beforeEach(() => { jest.clearAllMocks(); });

test('vibra após concluir com sucesso, sem repetir ao editar uma tarefa já concluída', async () => {
  const pending = { id: 5, titulo: 'Ler', descricao: '', concluida: false };
  const completed = { ...pending, concluida: true };
  const request = jest.fn().mockResolvedValue(completed);
  useAuth.mockReturnValue({ request });
  const { result } = await renderHook(useTaskActions);
  await act(async () => { await result.current.saveTask(completed, pending); });
  expect(request).toHaveBeenCalledWith('/tasks/5', { method: 'PUT', body: completed });
  expect(Haptics.notificationAsync).toHaveBeenCalledTimes(1);
  await act(async () => { await result.current.saveTask(completed, completed); });
  expect(Haptics.notificationAsync).toHaveBeenCalledTimes(1);
});

test('falha da API não dispara vibração; falha da vibração não desfaz uma tarefa salva', async () => {
  const completed = { id: 1, titulo: 'Ler', descricao: '', concluida: true };
  const request = jest.fn().mockRejectedValueOnce(new Error('Sem conexão')).mockResolvedValueOnce(completed);
  useAuth.mockReturnValue({ request });
  const { result } = await renderHook(useTaskActions);
  await expect(result.current.saveTask(completed)).rejects.toThrow('Sem conexão');
  expect(Haptics.notificationAsync).not.toHaveBeenCalled();
  Haptics.notificationAsync.mockRejectedValueOnce(new Error('Dispositivo sem suporte'));
  await expect(result.current.saveTask(completed)).resolves.toEqual(completed);
});
