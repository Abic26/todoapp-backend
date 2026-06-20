const { body, param, query } = require('express-validator');

const categories = ['Personal', 'Trabajo', 'Universidad'];
const priorities = ['Alta', 'Media', 'Baja'];
const statuses = ['PENDING', 'COMPLETED', 'CANCELLED'];

const idValidator = [
  param('id').isUUID().withMessage('El id de la tarea no es válido'),
];

const taskFields = (optional = false) => {
  const title = body('title').trim();
  if (optional) title.optional();

  return [
    title
      .notEmpty()
      .withMessage(optional ? 'El título no puede estar vacío' : 'El título es obligatorio')
      .isLength({ max: 200 })
      .withMessage('El título no puede superar 200 caracteres'),
    body('description').optional({ nullable: true }).isString(),
    body('category').optional().isIn(categories).withMessage('Categoría no válida'),
    body('priority').optional().isIn(priorities).withMessage('Prioridad no válida'),
    body('status').optional().isIn(statuses).withMessage('Estado no válido'),
    body('reminderDateTime')
      .optional({ nullable: true })
      .isISO8601()
      .withMessage('reminderDateTime debe usar formato ISO 8601')
      .toDate(),
    body('source').optional().isIn(['APP', 'WHATSAPP']).withMessage('Origen no válido'),
    body('whatsappNumber')
      .optional({ nullable: true, checkFalsy: true })
      .matches(/^\+?[1-9]\d{7,14}$/)
      .withMessage('Número de WhatsApp no válido'),
  ];
};

const createTaskValidator = taskFields(false);
const updateTaskValidator = [...idValidator, ...taskFields(true)];

const listTaskValidator = [
  query('category').optional().isIn(categories).withMessage('Categoría no válida'),
  query('priority').optional().isIn(priorities).withMessage('Prioridad no válida'),
  query('status').optional().isIn(statuses).withMessage('Estado no válido'),
  query('search').optional().trim().isLength({ max: 200 }),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
];

module.exports = {
  idValidator,
  createTaskValidator,
  updateTaskValidator,
  listTaskValidator,
};
