const success = (res, data, message = 'Operación exitosa', statusCode = 200) =>
  res.status(statusCode).json({ success: true, message, data });

const error = (res, message = 'Error interno del servidor', statusCode = 500, details) =>
  res.status(statusCode).json({
    success: false,
    message,
    ...(details && { errors: details }),
  });

module.exports = { success, error };
