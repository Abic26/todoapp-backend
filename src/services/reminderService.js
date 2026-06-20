const cron = require('node-cron');
const { Op } = require('sequelize');
const env = require('../config/env');
const { TodoTask, User } = require('../models');
const { sendWhatsAppMessage } = require('./twilioService');

let running = false;

const reminderMessage = (task) =>
  `⏰ Recordatorio TODoApp\n\n${task.title}${task.description ? `\n${task.description}` : ''}`;

const sendTaskReminder = async (task, fallbackPhone) => {
  const phone = task.whatsappNumber || fallbackPhone;
  if (!phone) {
    const err = new Error('La tarea y el usuario no tienen un número de WhatsApp');
    err.statusCode = 422;
    throw err;
  }

  const message = await sendWhatsAppMessage({
    to: phone,
    body: reminderMessage(task),
  });
  await task.update({ reminderSentAt: new Date() });
  return message;
};

const processDueReminders = async () => {
  if (running) return { skipped: true, processed: 0, sent: 0, failed: 0 };
  running = true;

  try {
    const now = new Date();
    const lookahead = new Date(now.getTime() + env.reminder.lookaheadMinutes * 60 * 1000);
    const tasks = await TodoTask.findAll({
      where: {
        status: 'PENDING',
        reminderDateTime: { [Op.lte]: lookahead },
        reminderSentAt: null,
      },
      include: [{ model: User, as: 'user', attributes: ['id', 'phone'] }],
      order: [['reminderDateTime', 'ASC']],
    });

    let sent = 0;
    let failed = 0;

    for (const task of tasks) {
      try {
        await sendTaskReminder(task, task.user?.phone);
        sent += 1;
      } catch (error) {
        failed += 1;
        console.error(`No fue posible enviar el recordatorio de la tarea ${task.id}:`, error.message);
      }
    }

    return { skipped: false, processed: tasks.length, sent, failed };
  } finally {
    running = false;
  }
};

const startReminderScheduler = () => {
  if (!cron.validate(env.reminder.cron)) {
    throw new Error(`Expresión REMINDER_CRON inválida: ${env.reminder.cron}`);
  }

  return cron.schedule(env.reminder.cron, processDueReminders, {
    scheduled: true,
    timezone: process.env.TZ || 'America/Bogota',
  });
};

module.exports = { sendTaskReminder, processDueReminders, startReminderScheduler };
