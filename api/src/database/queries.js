// Apenas SQL interno usa "?"; valores do usuario seguem como parametros separados.
function postgresSql(sql) {
  let index = 0;
  return sql.replace(/\?/g, () => `$${++index}`);
}

async function all(db, sql, ...params) {
  if (db.kind === 'postgres') return (await db.query(postgresSql(sql), params)).rows;
  return db.prepare(sql).all(...params);
}

async function get(db, sql, ...params) {
  if (db.kind === 'postgres') return (await db.query(postgresSql(sql), params)).rows[0];
  return db.prepare(sql).get(...params);
}

async function run(db, sql, ...params) {
  if (db.kind === 'postgres') return db.query(postgresSql(sql), params);
  return db.prepare(sql).run(...params);
}

module.exports = { all, get, run };
