import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { darkTheme, theme } from '../theme';

const THEME_KEY = '@taskeasy:dark-theme';
const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(false);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const savingRef = useRef(false);
  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(THEME_KEY)
      .then((value) => { if (active) setDark(value === 'true'); })
      .catch(() => { if (active) setError('Não foi possível carregar o tema salvo.'); })
      .finally(() => { if (active) setReady(true); });
    return () => { active = false; };
  }, []);

  async function toggleTheme(value) {
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setError('');
    try {
      await AsyncStorage.setItem(THEME_KEY, String(value));
      setDark(value);
    } catch {
      setError('Não foi possível salvar o tema. Tente novamente.');
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  return (
    <ThemeContext.Provider value={{ dark, ready, saving, error, toggleTheme, theme: dark ? darkTheme : theme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useAppTheme = () => useContext(ThemeContext);
