const { Router } = require('express');
const controller = require('../controllers/authController');
const authenticate = require('../middleware/authenticate');

const router = Router();
router.post('/login', controller.login);
router.get('/me', authenticate, controller.me);

module.exports = router;
