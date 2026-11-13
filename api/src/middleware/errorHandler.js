const HttpError = require('../services/HttpError');

function errorHandler(error, _req, res, _next) {
  if (error instanceof HttpError) {
    return res.status(error.status).json({ message: error.message });
  }
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'JSON inválido.' });
  }

  if (error.type === 'entity.too.large') {
    return res.status(413).json({ message: 'Corpo da requisição muito grande.' });
  }

  console.error('Erro interno na API:', error.code || error.name || 'erro desconhecido');
  return res.status(500).json({ message: 'Erro interno do servidor.' });
}

module.exports = errorHandler;
