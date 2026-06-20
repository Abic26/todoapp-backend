const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const env = require('../config/env');
const { User } = require('../models');
const { success, error } = require('../utils/responseHandler');

const publicUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  createdAt: user.createdAt,
});

const signToken = (user) =>
  jwt.sign({ email: user.email }, env.jwt.secret, {
    subject: user.id,
    expiresIn: env.jwt.expiresIn,
  });

const register = async (req, res, next) => {
  try {
    const { name, email, phone, password } = req.body;
    const existing = await User.findOne({
      where: phone ? { [Op.or]: [{ email }, { phone }] } : { email },
    });
    if (existing) return error(res, 'El email o teléfono ya está registrado', 409);

    const user = await User.create({
      name,
      email,
      phone: phone || null,
      password: await bcrypt.hash(password, 12),
    });

    return success(
      res,
      { token: signToken(user), user: publicUser(user) },
      'Usuario registrado correctamente',
      201,
    );
  } catch (err) {
    return next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.scope('withPassword').findOne({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return error(res, 'Email o contraseña incorrectos', 401);
    }

    return success(res, {
      token: signToken(user),
      user: publicUser(user),
    }, 'Inicio de sesión exitoso');
  } catch (err) {
    return next(err);
  }
};

module.exports = { register, login };
