import { useEffect, useState } from 'react';
import { Linking, StyleSheet } from 'react-native';
import { ActivityIndicator, Button, Card, Text } from 'react-native-paper';
import { getQuote } from '../services/quotes.mjs';

export default function QuoteCard() {
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    getQuote()
      .then((result) => { if (active) setQuote(result); })
      .catch((failure) => { if (active) setError(failure.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [attempt]);

  return (
    <Card mode="contained" style={styles.card}>
      <Card.Content>
        <Text variant="labelLarge" style={styles.label}>INSPIRAÇÃO DO DIA</Text>
        {loading ? <ActivityIndicator accessibilityLabel="Carregando frase" /> : null}
        {error ? <Text accessibilityLiveRegion="polite">{error}</Text> : null}
        {!loading && quote && !error ? <>
          <Text variant="bodyLarge" style={styles.quote}>“{quote.text}”</Text>
          <Text variant="bodySmall">— {quote.author}</Text>
        </> : null}
      </Card.Content>
      <Card.Actions>
        {error ? <Button onPress={() => setAttempt(attempt + 1)}>Tentar novamente</Button> : null}
        <Button onPress={() => Linking.openURL('https://zenquotes.io/').catch(() => {})}>Fonte: ZenQuotes</Button>
      </Card.Actions>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 24 },
  label: { marginBottom: 12 },
  quote: { marginBottom: 12, lineHeight: 24 },
});
