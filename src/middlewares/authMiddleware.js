const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { User } = require('../models');
const { error } = require('../utils/responseHandler');

const authMiddleware = async (req, res, next) => {
  try {
    const authorization = req.headers.authorization || '';
    const [scheme, token] = authorization.split(' ');

    if (scheme !== 'Bearer' || !token) {
      return error(res, 'Token de autenticación requerido', 401);
    }

    const payload = jwt.verify(token, env.jwt.secret);
    const user = await User.findByPk(payload.sub);
    if (!user) return error(res, 'Usuario asociado al token no existe', 401);

    req.user = user;
    return next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') return error(res, 'El token ha expirado', 401);
    if (err.name === 'JsonWebTokenError') return error(res, 'Token inválido', 401);
    return next(err);
  }
};

module.exports = authMiddleware;
