const { openPostgres } = require('../src/database/postgres');

async function main() {
  const db = await openPostgres(process.env.DATABASE_URL, {
    initialize: false,
    ca: process.env.DATABASE_CA_CERT?.replace(/\\n/g, '\n'),
  });
  try {
    const result = await db.query('SELECT current_database() AS database, current_user AS role');
    console.log(`Conexão PostgreSQL confirmada. Banco: ${result.rows[0].database}.`);
    console.log('TLS com certificado verificado. Nenhuma tabela ou dado foi alterado.');
  } finally { await db.close(); }
}

main().catch((error) => {
  console.error(`Falha ao verificar PostgreSQL (${error.code || 'configuração'}). Confira host, porta, senha e certificado. A conexão privada não será exibida.`);
  process.exitCode = 1;
});
