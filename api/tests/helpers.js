const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { once } = require('node:events');
const bcrypt = require('bcrypt');
const { randomBytes } = require('node:crypto');
const { openDatabase } = require('../src/database');
const { seedDemo } = require('../src/database/seed');
const { createApp } = require('../src/app');

async function fixture(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'taskeasy-test-'));
  const filename = path.join(directory, 'test.db');
  const db = openDatabase(filename);
  const secret = randomBytes(48).toString('hex');
  await seedDemo(db);
  db.prepare('INSERT INTO usuarios (nome, email, senha_hash) VALUES (?, ?, ?)')
    .run('Outro usuário', 'outro@taskeasy.com', await bcrypt.hash('OutraSenha@123', 4));
  const server = createApp({ db, jwtSecret: secret }).listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    if (db.open) db.close();
    if (path.dirname(directory) !== path.resolve(os.tmpdir()) || !path.basename(directory).startsWith('taskeasy-test-')) {
      throw new Error('Diretório temporário inesperado.');
    }
    fs.rmSync(directory, { recursive: true, force: true });
  });
  async function request(route, { method = 'GET', body, token } = {}) {
    const headers = {};
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (token) headers.Authorization = `Bearer ${token}`;
    const response = await fetch(`http://127.0.0.1:${server.address().port}${route}`, {
      method, headers, body: body === undefined ? undefined : JSON.stringify(body),
    });
    const data = response.status === 204 ? null : await response.json();
    return { status: response.status, data };
  }
  async function login(email = 'demo@taskeasy.com', password = 'TaskEasy@123') {
    return request('/auth/login', { method: 'POST', body: { email, password } });
  }
  return { db, filename, secret, request, login };
}

module.exports = { fixture };
