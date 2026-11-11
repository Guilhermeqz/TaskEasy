const { test } = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { fixture } = require('./helpers');
const { seedDemo } = require('../src/database/seed');

test('seed é idempotente e a senha é armazenada somente como hash bcrypt', async (t) => {
  const { db } = await fixture(t);
  await seedDemo(db);
  assert.equal(db.prepare('SELECT count(*) AS total FROM usuarios').get().total, 2);
  const user = db.prepare('SELECT * FROM usuarios WHERE email = ?').get('demo@taskeasy.com');
  assert.notEqual(user.senha_hash, 'TaskEasy@123');
  assert.ok(await bcrypt.compare('TaskEasy@123', user.senha_hash));
});

test('login real retorna JWT e /auth/me restaura o perfil sem expor hash', async (t) => {
  const { login, request } = await fixture(t);
  const result = await login(' DEMO@taskeasy.com ');
  assert.equal(result.status, 200);
  assert.equal(typeof result.data.token, 'string');
  assert.equal(result.data.user.senha_hash, undefined);
  const me = await request('/auth/me', { token: result.data.token });
  assert.equal(me.status, 200);
  assert.deepEqual(me.data, result.data.user);
});

test('credenciais incorretas ou inexistentes recebem o mesmo erro', async (t) => {
  const { login } = await fixture(t);
  const wrong = await login('demo@taskeasy.com', 'incorreta');
  const unknown = await login('ninguem@taskeasy.com', 'incorreta');
  assert.equal(wrong.status, 401);
  assert.deepEqual(wrong, unknown);
});

test('login valida campos obrigatórios, tipos, e-mail e limite bcrypt em bytes', async (t) => {
  const { request } = await fixture(t);
  for (const body of [{}, { email: 12, password: true }, { email: 'invalido', password: 'teste' }, { email: 'demo@taskeasy.com', password: 'á'.repeat(40) }]) {
    assert.equal((await request('/auth/login', { method: 'POST', body })).status, 400);
  }
});

test('rotas protegidas rejeitam token ausente, alterado, expirado ou de outro emissor', async (t) => {
  const { request, secret } = await fixture(t);
  assert.equal((await request('/auth/me')).status, 401);
  const options = { subject: '1', issuer: 'taskeasy', audience: 'taskeasy-mobile' };
  const tokens = [
    'invalido',
    jwt.sign({}, secret, { ...options, expiresIn: -1 }),
    jwt.sign({}, secret, { ...options, issuer: 'outro' }),
    jwt.sign({}, secret, { ...options, algorithm: 'HS384' }),
    jwt.sign({}, 'outra-chave', options),
    jwt.sign({}, secret, { ...options, subject: '9999' }),
  ];
  for (const token of tokens) assert.equal((await request('/auth/me', { token })).status, 401);
});
