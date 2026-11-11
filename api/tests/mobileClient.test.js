const { test } = require('node:test');
const assert = require('node:assert/strict');
const { fixture } = require('./helpers');

test('cliente HTTP do mobile autentica e executa CRUD na API real', async (t) => {
  const { baseUrl } = await fixture(t);
  const { requestJson, ApiError } = await import('../../mobile/src/services/http.mjs');
  const { token } = await requestJson(baseUrl, '/auth/login', {
    method: 'POST', body: { email: 'demo@taskeasy.com', password: 'TaskEasy@123' },
  });
  const task = await requestJson(baseUrl, '/tasks', { token, method: 'POST', body: { titulo: 'Integração mobile' } });
  assert.equal(task.concluida, false);
  const edited = await requestJson(baseUrl, `/tasks/${task.id}`, { token, method: 'PUT', body: { ...task, concluida: true } });
  assert.equal(edited.concluida, true);
  assert.equal((await requestJson(baseUrl, '/tasks', { token })).length, 1);
  assert.equal(await requestJson(baseUrl, `/tasks/${task.id}`, { token, method: 'DELETE' }), null);
  await assert.rejects(requestJson(baseUrl, '/tasks'), (error) => error instanceof ApiError && error.status === 401);
  await assert.rejects(requestJson(baseUrl, '/tasks', { token, method: 'POST', body: { titulo: '' } }), (error) => error.status === 400);
});
