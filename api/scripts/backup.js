const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const Database = require('better-sqlite3');

function checksum(filename) {
  return createHash('sha256').update(fs.readFileSync(filename)).digest('hex');
}

async function createBackup({ databasePath, backupRoot }) {
  const sourcePath = path.resolve(databasePath);
  const rootPath = path.resolve(backupRoot);
  // fileMustExist evita criar um banco vazio se o caminho estiver errado.
  const source = new Database(sourcePath, { readonly: true, fileMustExist: true });
  let snapshot;
  try {
    fs.mkdirSync(rootPath, { recursive: true, mode: 0o700 });
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const directory = fs.mkdtempSync(path.join(rootPath, `taskeasy-${timestamp}-`));
    const databaseFile = path.join(directory, 'taskeasy.db');
    // A API de backup inclui as transações confirmadas no WAL, mesmo com a API aberta.
    await source.backup(databaseFile);
    snapshot = new Database(databaseFile, { fileMustExist: true });
    // Normaliza somente a cópia, para restaurá-la como um arquivo independente de WAL/SHM.
    snapshot.pragma('journal_mode = DELETE');
    if (snapshot.pragma('integrity_check', { simple: true }) !== 'ok') {
      throw new Error('A cópia não passou na verificação de integridade SQLite.');
    }
    if (snapshot.pragma('foreign_key_check').length !== 0) {
      throw new Error('A cópia contém referências inválidas entre registros.');
    }
    const data = {
      formato: 'taskeasy-backup-v1',
      usuarios: snapshot.prepare('SELECT * FROM usuarios ORDER BY id').all(),
      tarefas: snapshot.prepare('SELECT * FROM tarefas ORDER BY id').all(),
    };
    const dataFile = path.join(directory, 'dados.json');
    fs.writeFileSync(dataFile, `${JSON.stringify(data, null, 2)}\n`, { mode: 0o600 });
    const manifest = {
      formato: 'taskeasy-backup-v1',
      criado_em_utc: new Date().toISOString(),
      origem: sourcePath,
      integridade: 'ok',
      referencias: 'ok',
      registros: { usuarios: data.usuarios.length, tarefas: data.tarefas.length },
      arquivos: {
        'taskeasy.db': { sha256: checksum(databaseFile), bytes: fs.statSync(databaseFile).size },
        'dados.json': { sha256: checksum(dataFile), bytes: fs.statSync(dataFile).size },
      },
    };
    // O manifesto só é gravado quando a cópia e a exportação foram validadas.
    fs.writeFileSync(path.join(directory, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, { mode: 0o600 });
    return { directory, manifest };
  } finally {
    if (snapshot) snapshot.close();
    source.close();
  }
}

async function main() {
  const apiDirectory = path.resolve(__dirname, '..');
  require('dotenv').config({ path: path.join(apiDirectory, '.env'), quiet: true });
  const result = await createBackup({
    databasePath: path.resolve(apiDirectory, process.env.DATABASE_PATH || './data/taskeasy.db'),
    backupRoot: path.resolve(apiDirectory, '../backups'),
  });
  console.log(`Backup validado: ${result.directory}`);
  console.log(`Registros: ${result.manifest.registros.usuarios} usuário(s), ${result.manifest.registros.tarefas} tarefa(s).`);
  console.log('Integridade SQLite e referências: OK. Checksums SHA-256 gravados no manifesto.');
  console.log('O banco original não foi alterado. O backup inclui dados privados; mantenha-o fora do Git.');
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.code === 'SQLITE_CANTOPEN'
      ? 'Banco não encontrado ou inacessível. Confira DATABASE_PATH em api/.env.'
      : `Não foi possível concluir o backup: ${error.message}`);
    process.exitCode = 1;
  });
}

module.exports = { createBackup };
