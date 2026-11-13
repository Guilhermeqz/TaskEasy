const jwt = require('jsonwebtoken');
const HttpError = require('../services/HttpError');
const { get } = require('../database/queries');

async function authenticate(req, _res, next) {
  const match = /^Bearer ([^\s]+)$/i.exec(req.headers.authorization || '');
  if (!match) return next(new HttpError(401, 'Autenticação necessária.'));
  try {
    const payload = jwt.verify(match[1], req.app.locals.jwtSecret, {
      algorithms: ['HS256'], issuer: 'taskeasy', audience: 'taskeasy-mobile',
    });
    if (!/^[1-9]\d*$/.test(payload.sub) || !Number.isSafeInteger(Number(payload.sub))) {
      return next(new HttpError(401, 'Sessão inválida ou expirada.'));
    }
    req.user = await get(req.app.locals.db, 'SELECT id, nome, email FROM usuarios WHERE id = ?', Number(payload.sub));
    if (!req.user) return next(new HttpError(401, 'Sessão inválida ou expirada.'));
    return next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError || error instanceof jwt.NotBeforeError) {
      return next(new HttpError(401, 'Sessão inválida ou expirada.'));
    }
    return next(error);
  }
}

module.exports = authenticate;
