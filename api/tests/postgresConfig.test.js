const { test } = require('node:test');
const assert = require('node:assert/strict');
const { X509Certificate } = require('node:crypto');
const { postgresOptions } = require('../src/database/postgres');

test('PostgreSQL remoto exige TLS verificado mesmo com sslmode inseguro na URL', () => {
  const options = postgresOptions('postgresql://user:password@db.example.com:5432/postgres?sslmode=no-verify&ssl=false');
  assert.equal(options.ssl.rejectUnauthorized, true);
  assert.equal(new URL(options.connectionString).searchParams.has('sslmode'), false);
  assert.equal(new URL(options.connectionString).searchParams.has('ssl'), false);
  assert.equal(options.max, 5);
});

test('pooler Supabase usa CA publica valida e CA explicita pode ser configurada', () => {
  const url = 'postgresql://postgres.project:password@aws-0-sa-east-1.pooler.supabase.com:5432/postgres';
  const options = postgresOptions(url);
  const cert = new X509Certificate(options.ssl.ca);
  assert.ok(Date.parse(cert.validTo) > Date.now());
  assert.equal(cert.ca, true);
  assert.equal(options.ssl.rejectUnauthorized, true);
  assert.equal(postgresOptions(url, { ca: 'CA do projeto' }).ssl.ca, 'CA do projeto');
});

test('configuracao rejeita URL incompleta e permite PostgreSQL local para testes', () => {
  for (const url of ['', 'https://example.com', 'postgresql://user@db.example.com/postgres']) {
    assert.throws(() => postgresOptions(url), /DATABASE_URL/);
  }
  assert.equal(postgresOptions('postgresql://postgres:password@127.0.0.1:5432/postgres').ssl, false);
});
