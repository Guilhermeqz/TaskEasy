const { test } = require('node:test');
const assert = require('node:assert/strict');
const { openDatabase } = require('../src/database');
const { fixture } = require('./helpers');

test('CRUD por HTTP persiste no SQLite e converte o status para booleano', async (t) => {
  const { request, login, filename } = await fixture(t);
  const { data: { token } } = await login();
  assert.deepEqual((await request('/tasks', { token })).data, []);
  const created = await request('/tasks', { token, method: 'POST', body: { titulo: ' Estudar React ', descricao: 'Ler a documentação' } });
  assert.equal(created.status, 201);
  assert.equal(created.data.titulo, 'Estudar React');
  assert.equal(created.data.concluida, false);
  const route = `/tasks/${created.data.id}`;
  const secondConnection = openDatabase(filename);
  try {
    assert.equal(secondConnection.prepare('SELECT titulo FROM tarefas WHERE id = ?').get(created.data.id).titulo, 'Estudar React');
  } finally { secondConnection.close(); }
  const edited = await request(route, { token, method: 'PUT', body: { titulo: 'Estudar Expo', descricao: 'Concluído', concluida: true } });
  assert.equal(edited.status, 200);
  assert.equal(edited.data.concluida, true);
  assert.deepEqual((await request(route, { token })).data, edited.data);
  assert.equal((await request('/tasks', { token })).data.length, 1);
  assert.equal((await request(route, { token, method: 'DELETE' })).status, 204);
  assert.equal((await request(route, { token })).status, 404);
});

test('tarefas de outro usuário não aparecem nem podem ser lidas, alteradas ou excluídas', async (t) => {
  const { request, login } = await fixture(t);
  const { data: { token } } = await login();
  const { data: { token: otherToken } } = await login('outro@taskeasy.com', 'OutraSenha@123');
  const created = await request('/tasks', { token, method: 'POST', body: { titulo: 'Privada', usuario_id: 2 } });
  assert.deepEqual((await request('/tasks', { token: otherToken })).data, []);
  for (const method of ['GET', 'PUT', 'DELETE']) {
    const result = await request(`/tasks/${created.data.id}`, { token: otherToken, method, body: method === 'PUT' ? { titulo: 'Invadida' } : undefined });
    assert.equal(result.status, 404);
  }
  assert.equal((await request(`/tasks/${created.data.id}`, { token })).data.titulo, 'Privada');
});

test('todas as rotas de tarefas exigem token', async (t) => {
  const { request } = await fixture(t);
  for (const [method, route] of [['GET', '/tasks'], ['GET', '/tasks/1'], ['POST', '/tasks'], ['PUT', '/tasks/1'], ['DELETE', '/tasks/1']]) {
    assert.equal((await request(route, { method, body: ['POST', 'PUT'].includes(method) ? { titulo: 'Teste' } : undefined })).status, 401);
  }
});

test('validação rejeita título vazio, tipos inválidos, textos grandes e IDs inseguros', async (t) => {
  const { request, login } = await fixture(t);
  const { data: { token } } = await login();
  for (const body of [{}, [], { titulo: '   ' }, { titulo: 'x'.repeat(121) }, { titulo: 'A', descricao: 3 }, { titulo: 'A', descricao: 'x'.repeat(2001) }, { titulo: 'A', concluida: 'false' }]) {
    assert.equal((await request('/tasks', { token, method: 'POST', body })).status, 400);
  }
  for (const id of ['0', '-1', 'abc', '1%20OR%201=1', '9007199254740992']) {
    assert.equal((await request(`/tasks/${id}`, { token })).status, 400);
  }
  assert.equal((await request('/tasks/999', { token })).status, 404);
  assert.deepEqual((await request('/tasks', { token })).data, []);
});
