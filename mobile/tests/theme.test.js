import { act, renderHook, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeProvider, useAppTheme } from '../src/context/ThemeContext';

beforeEach(async () => { await AsyncStorage.clear(); jest.clearAllMocks(); });

test('tema escuro persiste e é restaurado ao reiniciar o provider', async () => {
  const first = await renderHook(useAppTheme, { wrapper: ThemeProvider });
  await waitFor(() => expect(first.result.current.ready).toBe(true));
  await act(async () => { await first.result.current.toggleTheme(true); });
  expect(first.result.current.dark).toBe(true);
  await first.unmount();
  const second = await renderHook(useAppTheme, { wrapper: ThemeProvider });
  await waitFor(() => expect(second.result.current.ready).toBe(true));
  expect(second.result.current.dark).toBe(true);
});

test('falha no armazenamento mantém o tema anterior e informa o erro', async () => {
  const { result } = await renderHook(useAppTheme, { wrapper: ThemeProvider });
  await waitFor(() => expect(result.current.ready).toBe(true));
  AsyncStorage.setItem.mockRejectedValueOnce(new Error('Sem espaço'));
  await act(async () => { await result.current.toggleTheme(true); });
  expect(result.current.dark).toBe(false);
  expect(result.current.error).toContain('Não foi possível salvar');
});
