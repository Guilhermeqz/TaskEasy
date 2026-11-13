const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { openPostgres, transaction } = require('../src/database/postgres');
const { createBackup } = require('./backup');

function readBackup(directory) {
  const manifest = JSON.parse(fs.readFileSync(path.join(directory, 'manifest.json'), 'utf8'));
  if (manifest.formato !== 'taskeasy-backup-v1' || manifest.integridade !== 'ok' || manifest.referencias !== 'ok') {
    throw new Error('Backup não validado.');
  }
  for (const name of ['dados.json', 'taskeasy.db']) {
    const bytes = fs.readFileSync(path.join(directory, name));
    const hash = createHash('sha256').update(bytes).digest('hex');
    if (manifest.arquivos?.[name]?.sha256 !== hash) throw new Error('Checksum do backup não confere.');
  }
  const data = JSON.parse(fs.readFileSync(path.join(directory, 'dados.json'), 'utf8'));
  if (data.formato !== 'taskeasy-backup-v1' || !Array.isArray(data.usuarios) || !Array.isArray(data.tarefas)
    || data.usuarios.length !== manifest.registros.usuarios || data.tarefas.length !== manifest.registros.tarefas) {
    throw new Error('Contagem do backup não confere.');
  }
  return data;
}

async function migrateBackup(db, directory) {
  const data = readBackup(directory);
  return transaction(db, async (client) => {
    await client.query('LOCK TABLE public.usuarios, public.tarefas IN EXCLUSIVE MODE');
    const existing = await client.query('SELECT (SELECT count(*)::int FROM usuarios) AS usuarios, (SELECT count(*)::int FROM tarefas) AS tarefas');
    if (existing.rows[0].usuarios || existing.rows[0].tarefas) {
      const error = new Error('Destino não está vazio. Nenhum dado foi substituído; a importação foi cancelada.');
      error.code = 'TARGET_NOT_EMPTY';
      throw error;
    }
    for (const user of data.usuarios) {
      await client.query('INSERT INTO usuarios (id, nome, email, senha_hash) VALUES ($1, $2, $3, $4)',
        [user.id, user.nome, user.email, user.senha_hash]);
    }
    for (const task of data.tarefas) {
      await client.query('INSERT INTO tarefas (id, usuario_id, titulo, descricao, concluida, horario, lembrete_em, repetir_diariamente) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
        [task.id, task.usuario_id, task.titulo, task.descricao, task.concluida, task.horario ?? null, task.lembrete_em ?? null, task.repetir_diariamente ?? 0]);
    }
    // Preserva os IDs do SQLite sem causar colisao nas proximas insercoes.
    await client.query("SELECT setval(pg_get_serial_sequence('public.usuarios', 'id'), COALESCE(MAX(id), 1), COUNT(*) > 0) FROM usuarios");
    await client.query("SELECT setval(pg_get_serial_sequence('public.tarefas', 'id'), COALESCE(MAX(id), 1), COUNT(*) > 0) FROM tarefas");
    const result = await client.query('SELECT (SELECT count(*)::int FROM usuarios) AS usuarios, (SELECT count(*)::int FROM tarefas) AS tarefas');
    if (result.rows[0].usuarios !== data.usuarios.length || result.rows[0].tarefas !== data.tarefas.length) {
      throw new Error('Contagem após importação não confere.');
    }
    return result.rows[0];
  });
}

async function main() {
  const apiDirectory = path.resolve(__dirname, '..');
  const cloudUrl = new URL(process.env.DATABASE_URL);
  if (cloudUrl.username !== 'postgres.azkbtwgsqbpjucduolft' || cloudUrl.hostname !== 'aws-0-sa-east-1.pooler.supabase.com') {
    throw new Error('Destino diferente do projeto TaskEasy autorizado.');
  }
  const localEnv = require('dotenv').parse(fs.readFileSync(path.join(apiDirectory, '.env')));
  const snapshot = await createBackup({
    databasePath: path.resolve(apiDirectory, localEnv.DATABASE_PATH || './data/taskeasy.db'),
    backupRoot: path.resolve(apiDirectory, '../backups'),
  });
  console.log(`Backup local validado: ${snapshot.directory}`);
  const db = await openPostgres(process.env.DATABASE_URL, { ca: process.env.DATABASE_CA_CERT?.replace(/\\n/g, '\n') });
  try {
    const result = await migrateBackup(db, snapshot.directory);
    fs.writeFileSync(path.join(snapshot.directory, 'migracao-supabase.json'), `${JSON.stringify({
      projeto: 'azkbtwgsqbpjucduolft', concluida_em_utc: new Date().toISOString(), registros: result,
    }, null, 2)}\n`, { mode: 0o600 });
    console.log(`Migração confirmada: ${result.usuarios} usuário(s), ${result.tarefas} tarefa(s). IDs, hashes de senha e horários preservados.`);
    console.log('O banco SQLite original permanece preservado.');
  } finally { await db.close(); }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.code === 'TARGET_NOT_EMPTY' ? error.message
      : `Migração não concluída (${error.code || 'validação'}). Confira a configuração privada. O banco SQLite original permanece preservado.`);
    process.exitCode = 1;
  });
}

module.exports = { readBackup, migrateBackup };
