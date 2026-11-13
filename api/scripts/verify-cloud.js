const assert = require('node:assert/strict');
const { once } = require('node:events');
const { openPostgres } = require('../src/database/postgres');
const { createApp } = require('../src/app');

async function main() {
  const destination = new URL(process.env.DATABASE_URL);
  assert.equal(destination.username, 'postgres.azkbtwgsqbpjucduolft');
  assert.equal(destination.hostname, 'aws-0-sa-east-1.pooler.supabase.com');
  const { requestJson } = await import('../../mobile/src/services/http.mjs');
  let db;
  let server;
  let taskId;
  let token;
  const request = (route, options) => requestJson(`http://127.0.0.1:${server.address().port}`, route, options);
  async function start() {
    db = await openPostgres(process.env.DATABASE_URL, {
      initialize: false, ca: process.env.DATABASE_CA_CERT?.replace(/\\n/g, '\n'),
    });
    server = createApp({ db, jwtSecret: process.env.JWT_SECRET }).listen(0, '127.0.0.1');
    await once(server, 'listening');
  }
  async function stop() {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
      server = null;
    }
    if (db) {
      await db.close();
      db = null;
    }
  }
  try {
    await start();
    assert.equal((await request('/health')).status, 'ok');
    ({ token } = await request('/auth/login', { method: 'POST', body: { email: 'demo@taskeasy.com', password: 'TaskEasy@123' } }));
    assert.equal((await request('/auth/me', { token })).email, 'demo@taskeasy.com');
    const original = await request('/tasks', { token });
    const task = await request('/tasks', { method: 'POST', token, body: {
      titulo: 'Verificação temporária da publicação', horario: '09:00', lembrete_em: '2030-01-02T12:00:00.000Z', repetir_diariamente: true,
    } });
    taskId = task.id;
    assert.equal(task.repetir_diariamente, true);
    assert.ok(!original.some((item) => item.id === taskId));
    const edited = await request(`/tasks/${taskId}`, { method: 'PUT', token, body: { titulo: 'Verificação concluída', concluida: true } });
    assert.equal(edited.horario, '09:00');
    assert.equal(edited.concluida, true);
    await stop();
    await start();
    assert.equal((await request(`/tasks/${taskId}`, { token })).concluida, true);
    await request(`/tasks/${taskId}`, { method: 'DELETE', token });
    taskId = null;
    assert.deepEqual(await request('/tasks', { token }), original);
    console.log(`Supabase validado por HTTP real: health, login, perfil, leitura de ${original.length} tarefa(s), criação, edição, horários, persistência ao reabrir conexões e exclusão.`);
    console.log('A tarefa temporária foi removida e as tarefas originais permanecem preservadas.');
  } finally {
    if (taskId) {
      if (!server) await start();
      await request(`/tasks/${taskId}`, { method: 'DELETE', token });
    }
    await stop();
  }
}

main().catch((error) => {
  console.error(`Validação remota não concluída (${error.code || error.status || error.name}). Confira a configuração privada; credenciais não serão exibidas.`);
  process.exitCode = 1;
});
