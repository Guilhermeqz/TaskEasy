import { ScrollView, StyleSheet, View } from 'react-native';
import { Icon, Surface, Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function WelcomeScreen() {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.introduction}>
          <View style={[styles.icon, { backgroundColor: colors.primaryContainer }]}>
            <Icon source="check-circle-outline" size={48} color={colors.primary} />
          </View>
          <Text variant="headlineLarge" style={styles.title} accessibilityRole="header">
            TaskEasy
          </Text>
          <Text variant="bodyLarge" style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
            Mais clareza para o seu dia.
          </Text>
          <Surface style={styles.card} elevation={1}>
            <Text variant="titleLarge" style={styles.cardTitle}>
              Uma tarefa de cada vez.
            </Text>
            <Text variant="bodyLarge" style={{ color: colors.onSurfaceVariant }}>
              Um espaço simples para organizar suas tarefas pessoais e cuidar do que importa.
            </Text>
          </Surface>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  introduction: { width: '100%', maxWidth: 480, alignSelf: 'center' },
  icon: {
    width: 88,
    height: 88,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: { fontWeight: '700', marginBottom: 8 },
  subtitle: { marginBottom: 32 },
  card: { padding: 24, borderRadius: 20 },
  cardTitle: { marginBottom: 12 },
});
