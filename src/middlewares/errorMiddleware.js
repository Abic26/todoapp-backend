const { ValidationError, UniqueConstraintError, ForeignKeyConstraintError } = require('sequelize');
const { error } = require('../utils/responseHandler');

const notFound = (req, res) => error(res, `Ruta no encontrada: ${req.method} ${req.originalUrl}`, 404);

const errorHandler = (err, req, res, next) => {
  if (res.headersSent) return next(err);

  if (err instanceof UniqueConstraintError) {
    return error(res, 'Ya existe un registro con esos datos', 409);
  }

  if (err instanceof ValidationError) {
    return error(
      res,
      'Error de validación',
      422,
      err.errors.map((item) => ({ field: item.path, message: item.message })),
    );
  }

  if (err instanceof ForeignKeyConstraintError) {
    return error(res, 'La referencia enviada no es válida', 409);
  }

  const statusCode = err.statusCode || 500;
  if (process.env.NODE_ENV !== 'test') {
    console.error(err);
  }
  return error(
    res,
    statusCode === 500 ? 'Error interno del servidor' : err.message,
    statusCode,
  );
};

module.exports = { notFound, errorHandler };
