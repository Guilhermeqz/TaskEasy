const service = require('../services/taskService');

async function list(req, res) {
  res.json(await service.list(req.app.locals.db, req.user.id));
}

async function find(req, res) {
  res.json(await service.find(req.app.locals.db, req.user.id, req.params.id));
}

async function create(req, res) {
  const task = await service.create(req.app.locals.db, req.user.id, req.body);
  res.status(201).location(`/tasks/${task.id}`).json(task);
}

async function update(req, res) {
  res.json(await service.update(req.app.locals.db, req.user.id, req.params.id, req.body));
}

async function remove(req, res) {
  await service.remove(req.app.locals.db, req.user.id, req.params.id);
  res.status(204).end();
}

module.exports = { list, find, create, update, remove };
