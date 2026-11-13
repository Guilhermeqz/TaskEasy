import assert from 'node:assert/strict';
import { requestJson } from '../../mobile/src/services/http.mjs';

const baseUrl = (process.argv[2] || 'https://taskeasy-ejrv.onrender.com').replace(/\/+$/, '');
const destination = new URL(baseUrl);
assert.equal(destination.protocol, 'https:');
assert.ok(!destination.username && !destination.password && !destination.search && !destination.hash);
const request = (route, options) => requestJson(baseUrl, route, options);

let token;
let temporaryId;
try {
  assert.deepEqual(await request('/health'), { status: 'ok', service: 'TaskEasy API' });
  await assert.rejects(request('/tasks'), { status: 401 });
  ({ token } = await request('/auth/login', { method: 'POST', body: { email: 'demo@taskeasy.com', password: 'TaskEasy@123' } }));
  assert.equal((await request('/auth/me', { token })).email, 'demo@taskeasy.com');
  const original = await request('/tasks', { token });
  const task = await request('/tasks', { token, method: 'POST', body: {
    titulo: 'Verificação temporária do Render', horario: '09:00', lembrete_em: '2030-01-02T12:00:00.000Z', repetir_diariamente: true,
  } });
  temporaryId = task.id;
  assert.ok(!original.some((item) => item.id === temporaryId));
  assert.equal(task.horario, '09:00');
  assert.equal(task.repetir_diariamente, true);
  const edited = await request(`/tasks/${temporaryId}`, { token, method: 'PUT', body: { titulo: 'Verificação concluída', concluida: true } });
  assert.equal(edited.concluida, true);
  assert.equal(edited.horario, '09:00');
  assert.equal(edited.lembrete_em, '2030-01-02T12:00:00.000Z');
  assert.deepEqual(await request(`/tasks/${temporaryId}`, { token }), edited);
  await request(`/tasks/${temporaryId}`, { token, method: 'DELETE' });
  temporaryId = null;
  assert.deepEqual(await request('/tasks', { token }), original);
  console.log(JSON.stringify({ url: baseUrl, resultado: 'ok', tarefas_preservadas: original.length,
    verificacoes: ['health', 'autenticação obrigatória', 'login', 'perfil', 'listagem', 'criação', 'edição', 'leitura', 'horários', 'exclusão'],
    tarefa_temporaria_removida: true }));
} catch (error) {
  console.error(`Validação pública não concluída (${error.status || error.code || error.name}). Nenhuma credencial será exibida.`);
  process.exitCode = 1;
} finally {
  if (temporaryId) {
    try { await request(`/tasks/${temporaryId}`, { token, method: 'DELETE' }); }
    catch { console.error(`A tarefa de verificação ${temporaryId} precisa ser removida pelo aplicativo.`); }
  }
}
