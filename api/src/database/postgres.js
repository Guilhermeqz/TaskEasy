const fs = require('node:fs');
const path = require('node:path');
const { Pool } = require('pg');

function postgresOptions(connectionString, { ca } = {}) {
  let url;
  try { url = new URL(connectionString); } catch { throw new Error('DATABASE_URL deve ser uma conexão PostgreSQL válida.'); }
  if (!['postgres:', 'postgresql:'].includes(url.protocol) || !url.hostname || !url.username || !url.password) {
    throw new Error('DATABASE_URL deve incluir host, usuário e senha PostgreSQL.');
  }
  if (decodeURIComponent(url.password).includes('[YOUR-PASSWORD]')) throw new Error('Configure a senha em DATABASE_URL.');
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  const trustedCa = ca || (url.hostname.endsWith('.pooler.supabase.com')
    ? fs.readFileSync(path.join(__dirname, 'certs/supabase-prod-ca-2021.crt'), 'utf8') : undefined);
  // A URL nao pode substituir as opcoes TLS verificadas abaixo.
  for (const key of ['sslmode', 'sslcert', 'sslkey', 'sslrootcert', 'uselibpqcompat', 'ssl']) url.searchParams.delete(key);
  return {
    connectionString: url.toString(),
    ssl: local ? false : { rejectUnauthorized: true, ...(trustedCa ? { ca: trustedCa } : {}) },
    max: 5,
    connectionTimeoutMillis: 15000,
    idleTimeoutMillis: 30000,
    statement_timeout: 15000,
    options: '-c search_path=public',
    application_name: 'taskeasy-api',
  };
}

async function transaction(db, action) {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const result = await action(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally { client.release(); }
}

async function openPostgres(connectionString, { ca, initialize = true } = {}) {
  const pool = new Pool(postgresOptions(connectionString, { ca }));
  // Nao imprimir erros do driver: podem conter detalhes privados da conexao.
  pool.on('error', () => console.error('Conexão ociosa com PostgreSQL interrompida; uma nova conexão será aberta quando necessário.'));
  const db = { kind: 'postgres', pool, query: (sql, params) => pool.query(sql, params), close: () => pool.end() };
  try {
    await db.query('SELECT 1');
    if (initialize) {
      const schema = fs.readFileSync(path.join(__dirname, 'postgres-schema.sql'), 'utf8');
      await transaction(db, async (client) => {
        await client.query('SELECT pg_advisory_xact_lock(734281091)');
        await client.query(schema);
      });
    }
    return db;
  } catch (error) {
    await pool.end();
    throw error;
  }
}

module.exports = { openPostgres, postgresOptions, transaction };
