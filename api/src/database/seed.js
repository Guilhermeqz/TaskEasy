const bcrypt = require('bcrypt');
const { get, run } = require('./queries');

async function seedDemo(db) {
  const email = 'demo@taskeasy.com';
  if (await get(db, 'SELECT id FROM usuarios WHERE LOWER(email) = LOWER(?)', email)) return;
  const hash = await bcrypt.hash('TaskEasy@123', 12);
  await run(db, 'INSERT INTO usuarios (nome, email, senha_hash) VALUES (?, ?, ?) ON CONFLICT DO NOTHING',
    'Usuário de demonstração', email, hash);
}

module.exports = { seedDemo };
