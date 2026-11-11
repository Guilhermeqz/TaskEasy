const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const net = require('node:net');
const { fork } = require('node:child_process');
const { once } = require('node:events');
const { randomBytes } = require('node:crypto');

test('servidor inicia e preserva tarefas e sessão após reiniciar o processo', async (t) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'taskeasy-startup-'));
  const listener = net.createServer();
  listener.listen(0, '127.0.0.1');
  await once(listener, 'listening');
  const port = listener.address().port;
  await new Promise((resolve) => listener.close(resolve));
  const env = {
    ...process.env,
    HOST: '127.0.0.1', PORT: String(port),
    JWT_SECRET: randomBytes(48).toString('hex'),
    DATABASE_PATH: path.join(directory, 'persistent.db'), SEED_DEMO: 'true',
  };
  let child;
  async function stop() {
    if (!child || child.exitCode !== null || child.signalCode !== null) return;
    const finished = once(child, 'exit');
    child.kill();
    await finished;
  }
  t.after(async () => {
    await stop();
    if (path.dirname(directory) !== path.resolve(os.tmpdir()) || !path.basename(directory).startsWith('taskeasy-startup-')) {
      throw new Error('Diretório temporário inesperado.');
    }
    fs.rmSync(directory, { recursive: true, force: true });
  });
  async function start() {
    child = fork(path.resolve(__dirname, '../src/server.js'), [], { env, silent: true });
    await new Promise((resolve, reject) => {
      let errors = '';
      const timeout = setTimeout(() => reject(new Error('Tempo excedido na inicialização do servidor.')), 15000);
      child.stderr.on('data', (data) => { errors += String(data); });
      child.once('error', (error) => { clearTimeout(timeout); reject(error); });
      child.once('exit', (code) => {
        clearTimeout(timeout);
        if (code !== 0) reject(new Error(`Servidor encerrou: ${errors}`));
      });
      child.stdout.on('data', (data) => {
        if (String(data).includes('TaskEasy API iniciada')) { clearTimeout(timeout); resolve(); }
      });
    });
  }
  const { requestJson } = await import('../../mobile/src/services/http.mjs');
  const request = (route, options) => requestJson(`http://127.0.0.1:${port}`, route, options);
  await start();
  assert.equal((await request('/health')).status, 'ok');
  const { token, user } = await request('/auth/login', { method: 'POST', body: { email: 'demo@taskeasy.com', password: 'TaskEasy@123' } });
  const task = await request('/tasks', { method: 'POST', token, body: { titulo: 'Preservar após reiniciar' } });
  await stop();
  await start();
  assert.deepEqual(await request('/auth/me', { token }), user);
  assert.deepEqual(await request(`/tasks/${task.id}`, { token }), task);
});
