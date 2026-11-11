const { Router } = require('express');

const router = Router();
router.use('/auth', require('./authRoutes'));

router.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'TaskEasy API' });
});

module.exports = router;
