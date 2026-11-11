const fs = require('node:fs');
const path = require('node:path');
const Database = require('better-sqlite3');

function openDatabase(filename) {
  if (filename !== ':memory:') fs.mkdirSync(path.dirname(filename), { recursive: true });
  const db = new Database(filename);
  db.pragma('foreign_keys = ON');
  db.pragma('journal_mode = WAL');
  db.exec(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      email TEXT NOT NULL COLLATE NOCASE UNIQUE,
      senha_hash TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS tarefas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
      titulo TEXT NOT NULL CHECK(length(trim(titulo)) BETWEEN 1 AND 120),
      descricao TEXT NOT NULL DEFAULT '',
      concluida INTEGER NOT NULL DEFAULT 0 CHECK(concluida IN (0, 1))
    );
    CREATE INDEX IF NOT EXISTS idx_tarefas_usuario ON tarefas(usuario_id);
  `);
  return db;
}

module.exports = { openDatabase };
