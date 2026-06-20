const env = require('../config/env');
const { processDueReminders } = require('../services/reminderService');
const { success, error } = require('../utils/responseHandler');

const processReminders = async (req, res, next) => {
  try {
    if (!env.cronSecret) {
      return error(res, 'CRON_SECRET no está configurado', 503);
    }

    if (req.headers.authorization !== `Bearer ${env.cronSecret}`) {
      return error(res, 'Invocación de cron no autorizada', 401);
    }

    const result = await processDueReminders();
    return success(res, result, 'Recordatorios procesados correctamente');
  } catch (err) {
    return next(err);
  }
};

module.exports = { processReminders };
