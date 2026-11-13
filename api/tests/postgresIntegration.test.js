const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { randomUUID, randomBytes } = require('node:crypto');
const { once } = require('node:events');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const { openDatabase } = require('../src/database');
const { openPostgres, postgresOptions } = require('../src/database/postgres');
const { seedDemo } = require('../src/database/seed');
const { createBackup } = require('../scripts/backup');
const { migrateBackup } = require('../scripts/migrate-cloud');
const { createApp } = require('../src/app');

test('PostgreSQL real: migração atômica, login, isolamento, horários e persistência', {
  skip: !process.env.TEST_DATABASE_URL && 'Executado no GitHub Actions com PostgreSQL 16 descartável.',
  timeout: 60000,
}, async (t) => {
  const url = new URL(process.env.TEST_DATABASE_URL);
  // Esta suite cria e remove SOMENTE um banco temporario em um servidor local de testes.
  assert.ok(['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname), 'TEST_DATABASE_URL precisa apontar para PostgreSQL local descartável.');
  const name = `taskeasy_ci_${randomUUID().replaceAll('-', '')}`;
  const admin = new Pool(postgresOptions(url.toString()));
  let db;
  let server;
  let sqlite;
  let directory;
  t.after(async () => {
    if (server) await new Promise((resolve) => server.close(resolve));
    if (db) await db.close();
    if (sqlite?.open) sqlite.close();
    assert.match(name, /^taskeasy_ci_[a-f0-9]{32}$/);
    await admin.query(`DROP DATABASE IF EXISTS "${name}" WITH (FORCE)`);
    await admin.end();
    if (directory) {
      assert.equal(path.dirname(directory), path.resolve(os.tmpdir()));
      assert.ok(path.basename(directory).startsWith('taskeasy-pg-test-'));
      fs.rmSync(directory, { recursive: true, force: true });
    }
  });
  await admin.query(`CREATE DATABASE "${name}"`);
  url.pathname = `/${name}`;
  db = await openPostgres(url.toString());
  directory = fs.mkdtempSync(path.join(os.tmpdir(), 'taskeasy-pg-test-'));
  const filename = path.join(directory, 'source.db');
  sqlite = openDatabase(filename);
  await seedDemo(sqlite);
  sqlite.prepare('INSERT INTO tarefas (id, usuario_id, titulo, descricao, concluida, horario, lembrete_em, repetir_diariamente) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .run(7, 1, 'Tomar café', 'Preservar', 0, '09:00', '2030-01-02T12:00:00.000Z', 1);
  const backup = await createBackup({ databasePath: filename, backupRoot: path.join(directory, 'backups') });

  await t.test('erro ao importar tarefa desfaz também a inserção do usuário', async () => {
    await db.query('ALTER TABLE tarefas ADD CONSTRAINT somente_teste CHECK (id <> 7)');
    await assert.rejects(migrateBackup(db, backup.directory), { code: '23514' });
    assert.equal((await db.query('SELECT count(*)::int AS count FROM usuarios')).rows[0].count, 0);
    await db.query('ALTER TABLE tarefas DROP CONSTRAINT somente_teste');
  });

  await t.test('importa IDs, senhas e horários e impede sobrescrever um destino existente', async () => {
    assert.deepEqual(await migrateBackup(db, backup.directory), { usuarios: 1, tarefas: 1 });
    await assert.rejects(migrateBackup(db, backup.directory), { code: 'TARGET_NOT_EMPTY' });
    assert.equal((await db.query('SELECT count(*)::int AS count FROM tarefas')).rows[0].count, 1);
    await seedDemo(db);
    assert.equal((await db.query('SELECT count(*)::int AS count FROM usuarios')).rows[0].count, 1);
    await db.query('INSERT INTO usuarios (nome, email, senha_hash) VALUES ($1, $2, $3)',
      ['Outro', 'outro@taskeasy.com', await bcrypt.hash('OutraSenha@123', 4)]);
    const rls = await db.query("SELECT relname, relrowsecurity FROM pg_class WHERE oid IN ('public.usuarios'::regclass, 'public.tarefas'::regclass)");
    assert.ok(rls.rows.every((row) => row.relrowsecurity));
  });

  const jwtSecret = randomBytes(48).toString('hex');
  server = createApp({ db, jwtSecret }).listen(0, '127.0.0.1');
  await once(server, 'listening');
  const { requestJson } = await import('../../mobile/src/services/http.mjs');
  const request = (route, options) => requestJson(`http://127.0.0.1:${server.address().port}`, route, options);
  let token;
  let created;
  await t.test('cliente HTTP real faz login, CRUD, validação e isolamento no PostgreSQL', async () => {
    ({ token } = await request('/auth/login', { method: 'POST', body: { email: ' DEMO@taskeasy.com ', password: 'TaskEasy@123' } }));
    assert.equal((await request('/health')).status, 'ok');
    const imported = await request('/tasks/7', { token });
    assert.equal(imported.horario, '09:00');
    assert.equal(imported.repetir_diariamente, true);
    assert.equal(imported.lembrete_em, '2030-01-02T12:00:00.000Z');
    created = await request('/tasks', { token, method: 'POST', body: { titulo: 'Nova tarefa' } });
    assert.equal(created.id, 8);
    const other = await request('/auth/login', { method: 'POST', body: { email: 'outro@taskeasy.com', password: 'OutraSenha@123' } });
    assert.deepEqual(await request('/tasks', { token: other.token }), []);
    await assert.rejects(request('/tasks/7', { token: other.token }), { status: 404 });
    await assert.rejects(request('/tasks/7', { token: other.token, method: 'PUT', body: { titulo: 'Indevida' } }), { status: 404 });
    await assert.rejects(request('/tasks/7', { token: other.token, method: 'DELETE' }), { status: 404 });
    await assert.rejects(request('/tasks', { token, method: 'POST', body: { titulo: '' } }), { status: 400 });
    const edited = await request('/tasks/7', { token, method: 'PUT', body: { titulo: 'Café concluído', concluida: true } });
    assert.equal(edited.concluida, true);
    assert.equal(edited.horario, '09:00');
    await request(`/tasks/${created.id}`, { token, method: 'DELETE' });
    await assert.rejects(request(`/tasks/${created.id}`, { token }), { status: 404 });
  });

  await t.test('reabrir conexões e repetir a criação do schema preserva tarefas e sessão', async () => {
    await db.close();
    db = await openPostgres(url.toString());
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
    server = createApp({ db, jwtSecret }).listen(0, '127.0.0.1');
    await once(server, 'listening');
    assert.equal((await request('/auth/me', { token })).email, 'demo@taskeasy.com');
    assert.equal((await request('/tasks/7', { token })).titulo, 'Café concluído');
  });
});
