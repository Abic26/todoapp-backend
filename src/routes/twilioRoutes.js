const express = require('express');
const { body } = require('express-validator');
const { webhook, sendReminder } = require('../controllers/twilioController');
const authMiddleware = require('../middlewares/authMiddleware');
const validateRequest = require('../middlewares/validateRequest');

const router = express.Router();

router.post('/webhook', webhook);
router.post(
  '/send-reminder',
  authMiddleware,
  body('taskId').isUUID().withMessage('taskId debe ser un UUID válido'),
  validateRequest,
  sendReminder,
);

module.exports = router;
