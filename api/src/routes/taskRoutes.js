const { Router } = require('express');
const authenticate = require('../middleware/authenticate');
const controller = require('../controllers/taskController');

const router = Router();
router.use(authenticate);
router.get('/', controller.list);
router.get('/:id', controller.find);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);

module.exports = router;
