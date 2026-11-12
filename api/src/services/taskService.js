const HttpError = require('./HttpError');

function parseId(value) {
  if (!/^[1-9]\d*$/.test(String(value)) || !Number.isSafeInteger(Number(value))) {
    throw new HttpError(400, 'ID de tarefa inválido.');
  }
  return Number(value);
}

function validateTask(body, current = null) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new HttpError(400, 'Informe os dados da tarefa.');
  const { titulo, descricao = '', concluida = false } = body;
  if (typeof titulo !== 'string' || !titulo.trim() || titulo.trim().length > 120) {
    throw new HttpError(400, 'O título é obrigatório e deve ter até 120 caracteres.');
  }
  if (typeof descricao !== 'string' || descricao.length > 2000) {
    throw new HttpError(400, 'A descrição deve ser um texto de até 2000 caracteres.');
  }
  if (typeof concluida !== 'boolean') throw new HttpError(400, 'O status de conclusão deve ser verdadeiro ou falso.');
  const horario = body.horario === undefined ? (current?.horario ?? null) : body.horario;
  const lembreteEm = body.lembrete_em === undefined ? (current?.lembrete_em ?? null) : body.lembrete_em;
  const repetirDiariamente = body.repetir_diariamente === undefined ? (current?.repetir_diariamente ?? false) : body.repetir_diariamente;
  if (typeof repetirDiariamente !== 'boolean') throw new HttpError(400, 'A repetição diária deve ser verdadeira ou falsa.');
  if (horario === null && repetirDiariamente) throw new HttpError(400, 'Informe o horário para repetir diariamente.');
  if (horario !== null && (typeof horario !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(horario))) {
    throw new HttpError(400, 'O horário deve estar no formato HH:mm, entre 00:00 e 23:59.');
  }
  if (horario === null && lembreteEm !== null) throw new HttpError(400, 'Informe o horário do lembrete.');
  if (horario !== null && (typeof lembreteEm !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(lembreteEm)
      || !Number.isFinite(Date.parse(lembreteEm)) || new Date(lembreteEm).toISOString() !== lembreteEm)) {
    throw new HttpError(400, 'Informe uma data válida para o lembrete em formato ISO UTC.');
  }
  return { titulo: titulo.trim(), descricao: descricao.trim(), concluida: Number(concluida), horario, lembreteEm, repetirDiariamente: Number(repetirDiariamente) };
}

function serialize(row) {
  return { id: row.id, titulo: row.titulo, descricao: row.descricao, concluida: Boolean(row.concluida), horario: row.horario, lembrete_em: row.lembrete_em, repetir_diariamente: Boolean(row.repetir_diariamente) };
}

function list(db, userId) {
  return db.prepare('SELECT id, titulo, descricao, concluida, horario, lembrete_em, repetir_diariamente FROM tarefas WHERE usuario_id = ? ORDER BY id DESC')
    .all(userId).map(serialize);
}

function find(db, userId, id) {
  const row = db.prepare('SELECT id, titulo, descricao, concluida, horario, lembrete_em, repetir_diariamente FROM tarefas WHERE id = ? AND usuario_id = ?')
    .get(parseId(id), userId);
  if (!row) throw new HttpError(404, 'Tarefa não encontrada.');
  return serialize(row);
}

function create(db, userId, body) {
  const task = validateTask(body);
  const result = db.prepare('INSERT INTO tarefas (usuario_id, titulo, descricao, concluida, horario, lembrete_em, repetir_diariamente) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(userId, task.titulo, task.descricao, task.concluida, task.horario, task.lembreteEm, task.repetirDiariamente);
  return find(db, userId, result.lastInsertRowid);
}

function update(db, userId, id, body) {
  const current = find(db, userId, id);
  const task = validateTask(body, current);
  db.prepare('UPDATE tarefas SET titulo = ?, descricao = ?, concluida = ?, horario = ?, lembrete_em = ?, repetir_diariamente = ? WHERE id = ? AND usuario_id = ?')
    .run(task.titulo, task.descricao, task.concluida, task.horario, task.lembreteEm, task.repetirDiariamente, current.id, userId);
  return find(db, userId, current.id);
}

function remove(db, userId, id) {
  const task = find(db, userId, id);
  db.prepare('DELETE FROM tarefas WHERE id = ? AND usuario_id = ?').run(task.id, userId);
}

module.exports = { list, find, create, update, remove };
