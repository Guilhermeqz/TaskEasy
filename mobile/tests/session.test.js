import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { apiRequest } from '../src/services/api';

jest.mock('../src/services/api', () => ({ apiRequest: jest.fn() }));
const profile = { id: 1, nome: 'Pessoa de teste', email: 'teste@example.com' };

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
  apiRequest.mockReset();
});

test('login persiste o token e uma nova montagem restaura a sessão pela API', async () => {
  apiRequest.mockResolvedValueOnce({ token: 'jwt-do-teste', user: profile });
  const first = await renderHook(useAuth, { wrapper: AuthProvider });
  await waitFor(() => expect(first.result.current.restoring).toBe(false));
  await act(async () => { await first.result.current.login('teste@example.com', 'senha'); });
  expect(await AsyncStorage.getItem('@taskeasy:token')).toBe('jwt-do-teste');
  expect(first.result.current.user).toEqual(profile);
  await first.unmount();
  apiRequest.mockResolvedValueOnce(profile);
  const second = await renderHook(useAuth, { wrapper: AuthProvider });
  await waitFor(() => expect(second.result.current.user).toEqual(profile));
  expect(apiRequest).toHaveBeenLastCalledWith('/auth/me', { token: 'jwt-do-teste' });
});

test('logout remove a sessão persistida e o usuário', async () => {
  await AsyncStorage.setItem('@taskeasy:token', 'jwt-do-teste');
  apiRequest.mockResolvedValueOnce(profile);
  const { result } = await renderHook(useAuth, { wrapper: AuthProvider });
  await waitFor(() => expect(result.current.user).toEqual(profile));
  await act(async () => { await result.current.logout(); });
  expect(result.current.user).toBeNull();
  expect(await AsyncStorage.getItem('@taskeasy:token')).toBeNull();
});

test('falha de rede preserva o token e permite tentar restaurar novamente', async () => {
  await AsyncStorage.setItem('@taskeasy:token', 'jwt-do-teste');
  apiRequest.mockRejectedValueOnce(new Error('Sem conexão'));
  const { result } = await renderHook(useAuth, { wrapper: AuthProvider });
  await waitFor(() => expect(result.current.restoreError).toBe('Sem conexão'));
  expect(await AsyncStorage.getItem('@taskeasy:token')).toBe('jwt-do-teste');
  apiRequest.mockResolvedValueOnce(profile);
  await act(async () => { await result.current.restoreSession(); });
  expect(result.current.user).toEqual(profile);
  expect(result.current.restoreError).toBe('');
});

test('token expirado na restauração é removido e solicita novo login', async () => {
  await AsyncStorage.setItem('@taskeasy:token', 'jwt-expirado');
  apiRequest.mockRejectedValueOnce(Object.assign(new Error('Expirou'), { status: 401 }));
  const { result } = await renderHook(useAuth, { wrapper: AuthProvider });
  await waitFor(() => expect(result.current.restoring).toBe(false));
  expect(result.current.user).toBeNull();
  expect(result.current.sessionMessage).toContain('expirou');
  expect(await AsyncStorage.getItem('@taskeasy:token')).toBeNull();
});

test('401 durante o uso encerra a sessão e envia o token no pedido protegido', async () => {
  await AsyncStorage.setItem('@taskeasy:token', 'jwt-do-teste');
  apiRequest.mockResolvedValueOnce(profile);
  const { result } = await renderHook(useAuth, { wrapper: AuthProvider });
  await waitFor(() => expect(result.current.user).toEqual(profile));
  apiRequest.mockRejectedValueOnce(Object.assign(new Error('Expirou'), { status: 401 }));
  await act(async () => {
    await expect(result.current.request('/tasks')).rejects.toThrow('Expirou');
  });
  expect(apiRequest).toHaveBeenLastCalledWith('/tasks', { token: 'jwt-do-teste' });
  expect(result.current.user).toBeNull();
  expect(await AsyncStorage.getItem('@taskeasy:token')).toBeNull();
});
