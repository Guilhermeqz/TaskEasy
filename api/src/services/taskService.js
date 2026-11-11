const HttpError = require('./HttpError');

function parseId(value) {
  if (!/^[1-9]\d*$/.test(String(value)) || !Number.isSafeInteger(Number(value))) {
    throw new HttpError(400, 'ID de tarefa inválido.');
  }
  return Number(value);
}

function validateTask(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new HttpError(400, 'Informe os dados da tarefa.');
  const { titulo, descricao = '', concluida = false } = body;
  if (typeof titulo !== 'string' || !titulo.trim() || titulo.trim().length > 120) {
    throw new HttpError(400, 'O título é obrigatório e deve ter até 120 caracteres.');
  }
  if (typeof descricao !== 'string' || descricao.length > 2000) {
    throw new HttpError(400, 'A descrição deve ser um texto de até 2000 caracteres.');
  }
  if (typeof concluida !== 'boolean') throw new HttpError(400, 'O status de conclusão deve ser verdadeiro ou falso.');
  return { titulo: titulo.trim(), descricao: descricao.trim(), concluida: Number(concluida) };
}

function serialize(row) {
  return { id: row.id, titulo: row.titulo, descricao: row.descricao, concluida: Boolean(row.concluida) };
}

function list(db, userId) {
  return db.prepare('SELECT id, titulo, descricao, concluida FROM tarefas WHERE usuario_id = ? ORDER BY id DESC')
    .all(userId).map(serialize);
}

function find(db, userId, id) {
  const row = db.prepare('SELECT id, titulo, descricao, concluida FROM tarefas WHERE id = ? AND usuario_id = ?')
    .get(parseId(id), userId);
  if (!row) throw new HttpError(404, 'Tarefa não encontrada.');
  return serialize(row);
}

function create(db, userId, body) {
  const task = validateTask(body);
  const result = db.prepare('INSERT INTO tarefas (usuario_id, titulo, descricao, concluida) VALUES (?, ?, ?, ?)')
    .run(userId, task.titulo, task.descricao, task.concluida);
  return find(db, userId, result.lastInsertRowid);
}

function update(db, userId, id, body) {
  const current = find(db, userId, id);
  const task = validateTask(body);
  db.prepare('UPDATE tarefas SET titulo = ?, descricao = ?, concluida = ? WHERE id = ? AND usuario_id = ?')
    .run(task.titulo, task.descricao, task.concluida, current.id, userId);
  return find(db, userId, current.id);
}

function remove(db, userId, id) {
  const task = find(db, userId, id);
  db.prepare('DELETE FROM tarefas WHERE id = ? AND usuario_id = ?').run(task.id, userId);
}

module.exports = { list, find, create, update, remove };
