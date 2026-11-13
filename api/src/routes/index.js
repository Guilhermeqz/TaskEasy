const { Router } = require('express');

const router = Router();
router.use('/auth', require('./authRoutes'));
router.use('/tasks', require('./taskRoutes'));

router.get('/health', async (req, res) => {
  try {
    await require('../database/queries').get(req.app.locals.db, 'SELECT 1 AS ok');
    res.status(200).json({ status: 'ok', service: 'TaskEasy API' });
  } catch {
    res.status(503).json({ status: 'unavailable', service: 'TaskEasy API' });
  }
});

module.exports = router;
