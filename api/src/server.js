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
  if (process.env.RENDER && !process.env.DATABASE_URL) throw new Error('Configure DATABASE_URL no Render para não utilizar um banco temporário.');
  const db = process.env.DATABASE_URL
    ? await require('./database/postgres').openPostgres(process.env.DATABASE_URL, { ca: process.env.DATABASE_CA_CERT?.replace(/\\n/g, '\n') })
    : openDatabase(filename);
  try {
    if (process.env.SEED_DEMO !== 'false') await seedDemo(db);
    const app = createApp({ db, jwtSecret: secret });
    const server = app.listen(port, host, () => {
      console.log(`TaskEasy API iniciada em ${host}:${port}.`);
      console.log(`Banco: ${db.kind === 'postgres' ? 'PostgreSQL' : 'SQLite local'}.`);
      console.log(`Verificação local: http://localhost:${port}/health`);
    });
    server.on('error', async (error) => {
      console.error(error.code === 'EADDRINUSE' ? `A porta ${port} já está em uso.` : 'Não foi possível iniciar a API.');
      await db.close();
      process.exitCode = 1;
    });
    for (const signal of ['SIGINT', 'SIGTERM']) {
      process.once(signal, () => server.close(async () => { await db.close(); process.exit(0); }));
    }
  } catch (error) {
    await db.close();
    throw error;
  }
}

start().catch((error) => {
  const messages = ['PORT', 'Execute npm', 'Configure DATABASE_URL', 'DATABASE_URL'];
  console.error(messages.some((prefix) => error.message.startsWith(prefix)) ? error.message : `Falha ao inicializar o banco ou o servidor (${error.code || 'sem código'}). Confira a configuração privada e o acesso ao banco.`);
  process.exitCode = 1;
});
