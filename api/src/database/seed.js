const bcrypt = require('bcrypt');

async function seedDemo(db) {
  const email = 'demo@taskeasy.com';
  if (db.prepare('SELECT id FROM usuarios WHERE email = ?').get(email)) return;
  const hash = await bcrypt.hash('TaskEasy@123', 12);
  db.prepare('INSERT OR IGNORE INTO usuarios (nome, email, senha_hash) VALUES (?, ?, ?)')
    .run('Usuário de demonstração', email, hash);
}

module.exports = { seedDemo };
