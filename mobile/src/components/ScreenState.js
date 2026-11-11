import { StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Text } from 'react-native-paper';

export default function ScreenState({ loading, message, actionLabel = 'Tentar novamente', onAction }) {
  return (
    <View style={styles.container}>
      {loading ? <ActivityIndicator accessibilityLabel="Carregando" /> : null}
      {message ? <Text style={styles.message} accessibilityLiveRegion="polite">{message}</Text> : null}
      {onAction ? <Button mode="outlined" onPress={onAction}>{actionLabel}</Button> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center', gap: 16 },
  message: { textAlign: 'center' },
});
