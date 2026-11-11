const authService = require('../services/authService');

async function login(req, res) {
  const result = await authService.login(req.app.locals.db, req.app.locals.jwtSecret, req.body);
  res.json(result);
}

function me(req, res) {
  res.json(req.user);
}

module.exports = { login, me };
