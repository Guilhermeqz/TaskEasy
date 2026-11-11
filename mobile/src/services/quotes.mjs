const URL = 'https://zenquotes.io/api/today';
let cached = null;
let pending = null;
let lastAttempt = 0;

export async function getQuote() {
  if (cached && Date.now() - cached.savedAt < 60 * 60 * 1000) return cached.quote;
  if (pending) return pending;
  if (Date.now() - lastAttempt < 30000) throw new Error('Aguarde alguns segundos antes de tentar novamente.');
  lastAttempt = Date.now();
  pending = fetchQuote().finally(() => { pending = null; });
  return pending;
}

async function fetchQuote() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(URL, { signal: controller.signal });
    if (!response.ok) throw new Error('Frase indisponível.');
    const data = await response.json();
    const item = data?.[0];
    if (typeof item?.q !== 'string' || !item.q.trim() || typeof item.a !== 'string' || /zenquotes\.io/i.test(item.a)) {
      throw new Error('Resposta inválida.');
    }
    const quote = { text: item.q, author: item.a };
    cached = { quote, savedAt: Date.now() };
    return quote;
  } catch {
    throw new Error('Não foi possível carregar a frase. Suas tarefas continuam disponíveis.');
  } finally {
    clearTimeout(timeout);
  }
}
