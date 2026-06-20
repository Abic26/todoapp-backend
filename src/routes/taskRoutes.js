const express = require('express');
const controller = require('../controllers/taskController');
const authMiddleware = require('../middlewares/authMiddleware');
const validateRequest = require('../middlewares/validateRequest');
const {
  idValidator,
  createTaskValidator,
  updateTaskValidator,
  listTaskValidator,
} = require('../validators/taskValidator');

const router = express.Router();

router.use(authMiddleware);
router.get('/', listTaskValidator, validateRequest, controller.listTasks);
router.get('/:id', idValidator, validateRequest, controller.getTask);
router.post('/', createTaskValidator, validateRequest, controller.createTask);
router.put('/:id', updateTaskValidator, validateRequest, controller.updateTask);
router.patch('/:id/complete', idValidator, validateRequest, controller.completeTask);
router.delete('/:id', idValidator, validateRequest, controller.deleteTask);

module.exports = router;
