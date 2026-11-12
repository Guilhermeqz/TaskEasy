const { test } = require('node:test');
const assert = require('node:assert/strict');
const Database = require('better-sqlite3');
const { openDatabase } = require('../src/database');
const { fixture } = require('./helpers');

test('horário e instante do lembrete persistem; cliente antigo preserva o agendamento ao editar', async (t) => {
  const { request, login, filename } = await fixture(t);
  const { data: { token } } = await login();
  const payload = { titulo: 'Tomar café', horario: '09:00', lembrete_em: '2030-01-02T12:00:00.000Z' };
  const created = await request('/tasks', { token, method: 'POST', body: payload });
  assert.equal(created.status, 201);
  const route = `/tasks/${created.data.id}`;
  const edited = await request(route, { token, method: 'PUT', body: { titulo: 'Tomar café', concluida: true } });
  assert.equal(edited.data.horario, '09:00');
  assert.equal(edited.data.lembrete_em, payload.lembrete_em);
  const db = openDatabase(filename);
  try { assert.equal(db.prepare('SELECT horario FROM tarefas WHERE id = ?').get(created.data.id).horario, '09:00'); }
  finally { db.close(); }
  const cleared = await request(route, { token, method: 'PUT', body: { titulo: 'Sem lembrete', horario: null, lembrete_em: null } });
  assert.equal(cleared.data.horario, null);
  assert.equal(cleared.data.lembrete_em, null);
});

test('rejeita horários e datas inválidos sem criar tarefas', async (t) => {
  const { request, login } = await fixture(t);
  const { data: { token } } = await login();
  for (const horario of ['24:00', '09:60', '9:00', '', 900, true]) {
    assert.equal((await request('/tasks', { token, method: 'POST', body: { titulo: 'A', horario, lembrete_em: '2030-01-02T12:00:00.000Z' } })).status, 400);
  }
  for (const lembrete_em of [null, 'inválido', '2030-02-30T12:00:00.000Z', 42]) {
    assert.equal((await request('/tasks', { token, method: 'POST', body: { titulo: 'A', horario: '09:00', lembrete_em } })).status, 400);
  }
  assert.deepEqual((await request('/tasks', { token })).data, []);
});

test('migração de banco antigo mantém tarefas e pode ser executada novamente', async (t) => {
  const { db, filename } = await fixture(t);
  db.close();
  const old = new Database(filename);
  old.exec('DROP TABLE tarefas; CREATE TABLE tarefas (id INTEGER PRIMARY KEY, usuario_id INTEGER NOT NULL, titulo TEXT NOT NULL, descricao TEXT NOT NULL, concluida INTEGER NOT NULL)');
  old.prepare('INSERT INTO tarefas VALUES (?, ?, ?, ?, ?)').run(1, 1, 'Tarefa existente', 'Preservar', 0);
  old.close();
  const migrated = openDatabase(filename);
  const row = migrated.prepare('SELECT * FROM tarefas WHERE id = 1').get();
  assert.equal(row.titulo, 'Tarefa existente');
  assert.equal(row.horario, null);
  assert.equal(row.lembrete_em, null);
  migrated.close();
  const reopened = openDatabase(filename);
  assert.equal(reopened.prepare('SELECT count(*) AS count FROM tarefas').get().count, 1);
  reopened.close();
});
