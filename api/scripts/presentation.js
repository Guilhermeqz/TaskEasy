const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');

const apiDirectory = path.resolve(__dirname, '..');
const root = path.resolve(apiDirectory, '..');
require('dotenv').config({ path: path.join(apiDirectory, '.env'), quiet: true });
const config = JSON.parse(fs.readFileSync(path.join(root, 'apresentacao.local.json'), 'utf8'));

async function check() {
  const expected = new URL(config.apiUrl);
  const addresses = Object.values(os.networkInterfaces()).flat()
    .filter((address) => address && address.family === 'IPv4' && !address.internal)
    .map((address) => address.address);
  const port = Number(process.env.PORT || 3000);
  console.log(`TaskEasy - ${config.versao}`);
  console.log(`Node.js: ${process.version} (${process.platform}/${process.arch})`);
  console.log(`Endereco esperado pelo APK: ${config.apiUrl}`);
  console.log(`IPv4 deste computador: ${addresses.join(', ') || 'nenhuma conexao IPv4 encontrada'}`);
  if (!addresses.includes(expected.hostname)) {
    console.log('ATENCAO: este computador nao esta com o IP usado pelo APK. Confira a rede antes da apresentacao.');
  }
  if (port !== Number(expected.port || 80)) {
    throw new Error(`A API esta configurada na porta ${port}, mas o APK espera ${expected.port || 80}. Confira api/.env.`);
  }
  const filename = path.resolve(apiDirectory, process.env.DATABASE_PATH || './data/taskeasy.db');
  console.log(`Banco local: ${filename}`);
  console.log('Mantenha o celular no mesmo Wi-Fi e o computador ligado.');
  let active = false;
  try {
    const response = await fetch(`http://127.0.0.1:${port}/health`, { signal: AbortSignal.timeout(2500) });
    const data = await response.json();
    active = response.ok && data.service === 'TaskEasy API' && data.status === 'ok';
    if (!active) throw new Error('A porta configurada respondeu, mas nao corresponde a API TaskEasy.');
  } catch (error) {
    if (error.message.includes('nao corresponde')) throw error;
  }
  if (active) console.log('A API TaskEasy ja esta ativa. Nao sera iniciada outra instancia.');
  else console.log('A API TaskEasy ainda nao esta respondendo.');
  return active;
}

async function main() {
  const active = await check();
  if (active || process.argv.includes('--check')) return;
  console.log('Iniciando API local. Deixe esta janela aberta. Para encerrar, pressione Ctrl+C.');
  const child = spawn(process.execPath, [path.join(apiDirectory, 'src/server.js')], {
    cwd: apiDirectory, stdio: 'inherit', env: process.env,
  });
  child.on('error', () => { console.error('Nao foi possivel iniciar a API local.'); process.exitCode = 1; });
  child.on('exit', (code) => { process.exitCode = code || 0; });
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; });
