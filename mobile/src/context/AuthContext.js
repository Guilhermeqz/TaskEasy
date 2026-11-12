import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiRequest } from '../services/api';
import { activateAlarmUser } from '../services/alarms';

const TOKEN_KEY = '@taskeasy:token';
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [restoring, setRestoring] = useState(true);
  const [restoreError, setRestoreError] = useState('');
  const [sessionMessage, setSessionMessage] = useState('');
  const generation = useRef(0);

  const logout = useCallback(async () => {
    await activateAlarmUser(null);
    // Só confirma a saída quando a sessão persistida também foi removida.
    await AsyncStorage.removeItem(TOKEN_KEY);
    generation.current += 1;
    setToken(null);
    setUser(null);
    setRestoreError('');
    setSessionMessage('');
  }, []);

  const restoreSession = useCallback(async () => {
    const currentGeneration = ++generation.current;
    setRestoring(true);
    setRestoreError('');
    try {
      const storedToken = await AsyncStorage.getItem(TOKEN_KEY);
      if (currentGeneration !== generation.current) return;
      if (!storedToken) { await activateAlarmUser(null); return; }
      const profile = await apiRequest('/auth/me', { token: storedToken });
      if (currentGeneration !== generation.current) return;
      await activateAlarmUser(profile.id);
      setToken(storedToken);
      setUser(profile);
    } catch (error) {
      if (currentGeneration !== generation.current) return;
      if (error.status === 401) {
        try {
          await activateAlarmUser(null);
          await AsyncStorage.removeItem(TOKEN_KEY);
          setSessionMessage('Sua sessão expirou. Entre novamente.');
        } catch {
          setRestoreError('Não foi possível limpar a sessão. Tente novamente.');
        }
      } else {
        setRestoreError(error.message || 'Não foi possível restaurar sua sessão.');
      }
    } finally {
      if (currentGeneration === generation.current) setRestoring(false);
    }
  }, []);

  useEffect(() => {
    restoreSession();
    return () => { generation.current += 1; };
  }, [restoreSession]);

  const login = useCallback(async (email, password) => {
    const result = await apiRequest('/auth/login', { method: 'POST', body: { email, password } });
    try { await AsyncStorage.setItem(TOKEN_KEY, result.token); }
    catch { throw new Error('Não foi possível salvar sua sessão neste aparelho.'); }
    await activateAlarmUser(result.user.id);
    generation.current += 1;
    setSessionMessage('');
    setToken(result.token);
    setUser(result.user);
  }, []);

  const request = useCallback(async (path, options = {}) => {
    const currentGeneration = generation.current;
    try {
      return await apiRequest(path, { ...options, token });
    } catch (error) {
      if (error.status === 401 && currentGeneration === generation.current) {
        try { await activateAlarmUser(null); } catch {}
        setToken(null);
        setUser(null);
        setSessionMessage('Sua sessão expirou. Entre novamente.');
        generation.current += 1;
        try { await AsyncStorage.removeItem(TOKEN_KEY); }
        catch { setRestoreError('Não foi possível limpar a sessão. Tente entrar novamente.'); }
      }
      throw error;
    }
  }, [token]);

  return (
    <AuthContext.Provider value={{ user, restoring, restoreError, sessionMessage, login, logout, request, restoreSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider.');
  return context;
}
