const path = require('node:path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env'), quiet: true });
const { createApp } = require('./app');
const { openDatabase } = require('./database');
const { seedDemo } = require('./database/seed');

async function start() {
  const port = Number(process.env.PORT || 3000);
  const host = process.env.HOST || '0.0.0.0';
  const secret = process.env.JWT_SECRET;
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT deve ser um inteiro entre 1 e 65535.');
  if (!secret || secret.length < 32 || secret === 'gere-com-npm-run-setup') throw new Error('Execute npm run setup na pasta api para configurar JWT_SECRET.');
  const filename = path.resolve(__dirname, '..', process.env.DATABASE_PATH || './data/taskeasy.db');
  const db = openDatabase(filename);
  try {
    if (process.env.SEED_DEMO !== 'false') await seedDemo(db);
    const app = createApp({ db, jwtSecret: secret });
    const server = app.listen(port, host, () => {
      console.log(`TaskEasy API iniciada em ${host}:${port}.`);
      console.log(`Verificação local: http://localhost:${port}/health`);
    });
    server.on('error', (error) => {
      console.error(error.code === 'EADDRINUSE' ? `A porta ${port} já está em uso.` : 'Não foi possível iniciar a API.');
      db.close();
      process.exitCode = 1;
    });
    for (const signal of ['SIGINT', 'SIGTERM']) {
      process.once(signal, () => server.close(() => { db.close(); process.exit(0); }));
    }
  } catch (error) {
    db.close();
    throw error;
  }
}

start().catch((error) => {
  console.error(error.message.startsWith('PORT') || error.message.startsWith('Execute npm') ? error.message : 'Falha ao inicializar o banco ou o servidor.');
  process.exitCode = 1;
});
