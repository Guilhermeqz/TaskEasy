import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Button, HelperText, Icon, Text, TextInput, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
  const { login, sessionMessage } = useAuth();
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [attempted, setAttempted] = useState(false);
  const emailInvalid = !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  async function submit() {
    if (submitting) return;
    setAttempted(true);
    setError('');
    if (emailInvalid || !password) return;
    setSubmitting(true);
    try { await login(email.trim(), password); }
    catch (failure) { setError(failure.message); }
    finally { setSubmitting(false); }
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.form}>
            <View style={[styles.icon, { backgroundColor: colors.primaryContainer }]}>
              <Icon source="check-circle-outline" size={44} color={colors.primary} />
            </View>
            <Text variant="headlineLarge" style={styles.title} accessibilityRole="header">TaskEasy</Text>
            <Text variant="bodyLarge" style={styles.subtitle}>Mais clareza para o seu dia. Entre para organizar suas tarefas.</Text>
            {sessionMessage ? <Text accessibilityLiveRegion="polite" style={styles.notice}>{sessionMessage}</Text> : null}
            <TextInput label="E-mail" accessibilityLabel="E-mail" mode="outlined" value={email} onChangeText={setEmail}
              autoCapitalize="none" autoCorrect={false} keyboardType="email-address" autoComplete="email"
              maxLength={254} disabled={submitting} error={attempted && emailInvalid} />
            <HelperText type="error" visible={attempted && emailInvalid}>Informe um e-mail válido.</HelperText>
            <TextInput label="Senha" accessibilityLabel="Senha" mode="outlined" value={password} onChangeText={setPassword}
              secureTextEntry={!visible} autoCapitalize="none" autoCorrect={false} autoComplete="current-password"
              disabled={submitting} error={attempted && !password} onSubmitEditing={submit} returnKeyType="go"
              right={<TextInput.Icon icon={visible ? 'eye-off' : 'eye'} onPress={() => setVisible(!visible)} accessibilityLabel={visible ? 'Ocultar senha' : 'Mostrar senha'} />} />
            <HelperText type="error" visible={attempted && !password}>Informe sua senha.</HelperText>
            {error ? <Text style={{ color: colors.error, marginBottom: 16 }} accessibilityLiveRegion="polite">{error}</Text> : null}
            <Button mode="contained" onPress={submit} loading={submitting} disabled={submitting} contentStyle={styles.button}>Entrar</Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  form: { width: '100%', maxWidth: 480, alignSelf: 'center' },
  icon: { padding: 18, borderRadius: 24, alignSelf: 'flex-start', marginBottom: 24 },
  title: { fontWeight: '700', marginBottom: 8 },
  subtitle: { marginBottom: 28 },
  notice: { marginBottom: 16 },
  button: { minHeight: 48 },
});
