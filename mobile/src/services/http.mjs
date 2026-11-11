export class ApiError extends Error {
  constructor(message, status = 0) {
    super(message);
    this.status = status;
  }
}

export async function requestJson(baseUrl, path, { token, method = 'GET', body } = {}) {
  if (!/^https?:\/\//.test(baseUrl)) throw new ApiError('Configure o endereço da API para conectar o aplicativo.');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const headers = { Accept: 'application/json' };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (token) headers.Authorization = `Bearer ${token}`;
    const response = await fetch(`${baseUrl}${path}`, {
      method, headers, signal: controller.signal,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (response.status === 204) return null;
    let data;
    try { data = await response.json(); }
    catch { throw new ApiError('O servidor enviou uma resposta inválida.', response.status); }
    if (!response.ok) throw new ApiError(data?.message || 'Não foi possível concluir a solicitação.', response.status);
    return data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('Não foi possível conectar ao servidor. Confira a conexão e tente novamente.');
  } finally {
    clearTimeout(timeout);
  }
}
