const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const Database = require('better-sqlite3');
const { fixture } = require('./helpers');
const { createBackup } = require('../scripts/backup');

test('backup inclui dados do WAL aberto e exporta um snapshot íntegro sem alterar a origem', async (t) => {
  const { db, filename } = await fixture(t);
  db.prepare('INSERT INTO tarefas (usuario_id, titulo, descricao, concluida) VALUES (?, ?, ?, ?)')
    .run(1, 'Tarefa confirmada no WAL', 'Preservar', 0);
  const before = db.prepare('SELECT * FROM tarefas').all();
  const result = await createBackup({ databasePath: filename, backupRoot: path.join(path.dirname(filename), 'backups') });
  const snapshot = new Database(path.join(result.directory, 'taskeasy.db'), { readonly: true });
  try {
    assert.equal(snapshot.pragma('integrity_check', { simple: true }), 'ok');
    assert.deepEqual(snapshot.prepare('SELECT * FROM tarefas').all(), before);
  } finally { snapshot.close(); }
  const data = JSON.parse(fs.readFileSync(path.join(result.directory, 'dados.json'), 'utf8'));
  assert.equal(data.usuarios.length, 2);
  assert.equal(data.tarefas[0].titulo, 'Tarefa confirmada no WAL');
  assert.match(data.usuarios[0].senha_hash, /^\$2[aby]\$/);
  assert.deepEqual(db.prepare('SELECT * FROM tarefas').all(), before);
  assert.deepEqual(result.manifest.registros, { usuarios: 2, tarefas: 1 });
  for (const [name, metadata] of Object.entries(result.manifest.arquivos)) {
    const digest = createHash('sha256').update(fs.readFileSync(path.join(result.directory, name))).digest('hex');
    assert.equal(digest, metadata.sha256);
  }
});

test('backup preserva schema e dados antigos e gera cópias independentes sem sobrescrever', async (t) => {
  const { db, filename } = await fixture(t);
  db.close();
  const legacy = new Database(filename);
  legacy.exec('DROP TABLE tarefas; CREATE TABLE tarefas (id INTEGER PRIMARY KEY, usuario_id INTEGER, titulo TEXT, descricao TEXT, concluida INTEGER)');
  legacy.prepare('INSERT INTO tarefas VALUES (?, ?, ?, ?, ?)').run(1, 1, 'Legado', '', 0);
  const columnsBefore = legacy.pragma('table_info(tarefas)');
  legacy.close();
  const options = { databasePath: filename, backupRoot: path.join(path.dirname(filename), 'backups') };
  const first = await createBackup(options);
  const second = await createBackup(options);
  assert.notEqual(first.directory, second.directory);
  const original = new Database(filename, { readonly: true });
  try { assert.deepEqual(original.pragma('table_info(tarefas)'), columnsBefore); }
  finally { original.close(); }
  await assert.rejects(createBackup({ ...options, databasePath: path.join(path.dirname(filename), 'inexistente.db') }));
  assert.equal(fs.existsSync(path.join(path.dirname(filename), 'inexistente.db')), false);
});
