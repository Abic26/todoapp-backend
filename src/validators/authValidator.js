const { body } = require('express-validator');

const registerValidator = [
  body('name').trim().notEmpty().withMessage('El nombre es obligatorio').isLength({ max: 120 }),
  body('email').trim().isEmail().withMessage('El email no tiene un formato válido').normalizeEmail(),
  body('phone')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .matches(/^\+?[1-9]\d{7,14}$/)
    .withMessage('El teléfono debe incluir código de país, por ejemplo +573001234567'),
  body('password')
    .isString()
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener mínimo 6 caracteres'),
];

const loginValidator = [
  body('email').trim().isEmail().withMessage('El email no tiene un formato válido').normalizeEmail(),
  body('password').notEmpty().withMessage('La contraseña es obligatoria'),
];

module.exports = { registerValidator, loginValidator };
