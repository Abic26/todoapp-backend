const { Op } = require('sequelize');
const { User, TodoTask } = require('../models');
const { parseSpanishDate } = require('../utils/dateUtils');
const { success, error } = require('../utils/responseHandler');
const { buildTwimlResponse, normalizePhone } = require('../services/twilioService');
const { sendTaskReminder } = require('../services/reminderService');

const cleanTaskTitle = (message) => {
  let title = message
    .replace(/^(crear\s+tarea|recordarme)\s+/i, '')
    .replace(/\s+(pasado\s+mañana|mañana|lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo)\b.*$/i, '')
    .trim();
  return title || 'Tarea desde WhatsApp';
};

const webhook = async (req, res, next) => {
  try {
    const incomingMessage = (req.body.Body || '').trim();
    const phone = normalizePhone(req.body.From);
    const xml = (message) => res.type('text/xml').send(buildTwimlResponse(message));

    if (!incomingMessage || !phone) {
      return xml('No pude interpretar el mensaje. Intenta: "Crear tarea estudiar mañana 8 pm".');
    }

    const user = await User.findOne({
      where: {
        phone: { [Op.in]: [phone, phone.replace(/^\+/, '')] },
      },
    });
    if (!user) {
      return xml('Este número no está asociado a TODoApp. Regístralo primero desde la aplicación.');
    }

    if (!/^(crear\s+tarea|recordarme)\b/i.test(incomingMessage)) {
      return xml('Usa "Crear tarea ..." o "Recordarme ...", incluyendo fecha y hora.');
    }

    const reminderDateTime = parseSpanishDate(incomingMessage);
    if (!reminderDateTime) {
      return xml('No pude reconocer la fecha. Prueba con "mañana 8 pm" o "viernes a las 10 am".');
    }

    const task = await TodoTask.create({
      userId: user.id,
      title: cleanTaskTitle(incomingMessage),
      category: 'Personal',
      priority: 'Media',
      status: 'PENDING',
      reminderDateTime,
      source: 'WHATSAPP',
      whatsappNumber: phone,
    });

    return xml(
      `✅ Tarea creada: "${task.title}". Te recordaré el ${reminderDateTime.toLocaleString('es-CO')}.`,
    );
  } catch (err) {
    return next(err);
  }
};

const sendReminder = async (req, res, next) => {
  try {
    const task = await TodoTask.findOne({
      where: { id: req.body.taskId, userId: req.user.id },
    });
    if (!task) return error(res, 'Tarea no encontrada', 404);
    if (task.status !== 'PENDING') {
      return error(res, 'Solo se pueden recordar tareas pendientes', 409);
    }

    const message = await sendTaskReminder(task, req.user.phone);
    return success(
      res,
      { task, messageSid: message.sid },
      'Recordatorio enviado correctamente',
    );
  } catch (err) {
    return next(err);
  }
};

module.exports = { webhook, sendReminder };
