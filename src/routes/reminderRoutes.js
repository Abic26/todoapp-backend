const express = require('express');
const { processReminders } = require('../controllers/reminderController');

const router = express.Router();

router.get('/reminders', processReminders);

module.exports = router;
