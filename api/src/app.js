const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

function createApp({ db, jwtSecret }) {
  const app = express();
  app.locals.db = db;
  app.locals.jwtSecret = jwtSecret;
  app.disable('x-powered-by');
  app.use(cors());
  app.use(express.json({ limit: '100kb' }));
  app.use(routes);
  app.use((_req, res) => {
    res.status(404).json({ message: 'Rota não encontrada.' });
  });
  app.use(errorHandler);
  return app;
}

module.exports = { createApp };
