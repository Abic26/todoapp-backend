const { Op } = require('sequelize');
const { TodoTask } = require('../models');

const createHttpError = (message, statusCode) => Object.assign(new Error(message), { statusCode });

const listByUser = async (userId, filters) => {
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const where = { userId };

  ['category', 'priority', 'status'].forEach((field) => {
    if (filters[field]) where[field] = filters[field];
  });

  if (filters.search) {
    where.title = { [Op.iLike]: `%${filters.search}%` };
  }

  const { rows, count } = await TodoTask.findAndCountAll({
    where,
    order: [['createdAt', 'DESC']],
    limit,
    offset: (page - 1) * limit,
  });

  return {
    tasks: rows,
    pagination: {
      page,
      limit,
      total: count,
      pages: Math.ceil(count / limit),
    },
  };
};

const findOwnedTask = async (id, userId) => {
  const task = await TodoTask.findOne({ where: { id, userId } });
  if (!task) throw createHttpError('Tarea no encontrada', 404);
  return task;
};

const create = (userId, data) => TodoTask.create({ ...data, userId });

const update = async (id, userId, data) => {
  const task = await findOwnedTask(id, userId);

  if (
    Object.prototype.hasOwnProperty.call(data, 'reminderDateTime')
    && new Date(data.reminderDateTime).getTime() !== new Date(task.reminderDateTime).getTime()
  ) {
    data.reminderSentAt = null;
  }

  await task.update(data);
  return task;
};

const complete = async (id, userId) => {
  const task = await findOwnedTask(id, userId);
  await task.update({ status: 'COMPLETED' });
  return task;
};

const remove = async (id, userId) => {
  const task = await findOwnedTask(id, userId);
  await task.destroy();
};

module.exports = { listByUser, findOwnedTask, create, update, complete, remove };
