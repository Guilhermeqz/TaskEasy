const path = require('node:path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env'), quiet: true });
const app = require('./app');

const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || '0.0.0.0';

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error('PORT deve ser um número inteiro entre 1 e 65535.');
  process.exit(1);
}

const server = app.listen(port, host, () => {
  console.log(`TaskEasy API iniciada na porta ${port} (host ${host}).`);
  console.log(`Teste neste computador: http://localhost:${port}/health`);
});

server.on('error', (error) => {
  console.error(error.code === 'EADDRINUSE'
    ? `A porta ${port} já está em uso. Ajuste PORT no arquivo api/.env.`
    : 'Não foi possível iniciar a API. Verifique HOST e PORT.');
  process.exitCode = 1;
});
