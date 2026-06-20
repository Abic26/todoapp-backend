const { validationResult } = require('express-validator');
const { error } = require('../utils/responseHandler');

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return error(
      res,
      'Los datos enviados no son válidos',
      422,
      errors.array().map(({ path, msg, value }) => ({ field: path, message: msg, value })),
    );
  }
  return next();
};

module.exports = validateRequest;
