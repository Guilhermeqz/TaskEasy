const service = require('../services/taskService');

function list(req, res) {
  res.json(service.list(req.app.locals.db, req.user.id));
}

function find(req, res) {
  res.json(service.find(req.app.locals.db, req.user.id, req.params.id));
}

function create(req, res) {
  const task = service.create(req.app.locals.db, req.user.id, req.body);
  res.status(201).location(`/tasks/${task.id}`).json(task);
}

function update(req, res) {
  res.json(service.update(req.app.locals.db, req.user.id, req.params.id, req.body));
}

function remove(req, res) {
  service.remove(req.app.locals.db, req.user.id, req.params.id);
  res.status(204).end();
}

module.exports = { list, find, create, update, remove };
