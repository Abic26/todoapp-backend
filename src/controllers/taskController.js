const taskService = require('../services/taskService');
const { success } = require('../utils/responseHandler');

const listTasks = async (req, res, next) => {
  try {
    const data = await taskService.listByUser(req.user.id, req.query);
    return success(res, data, 'Tareas obtenidas correctamente');
  } catch (err) {
    return next(err);
  }
};

const getTask = async (req, res, next) => {
  try {
    const task = await taskService.findOwnedTask(req.params.id, req.user.id);
    return success(res, task, 'Tarea obtenida correctamente');
  } catch (err) {
    return next(err);
  }
};

const createTask = async (req, res, next) => {
  try {
    const task = await taskService.create(req.user.id, req.body);
    return success(res, task, 'Tarea creada correctamente', 201);
  } catch (err) {
    return next(err);
  }
};

const updateTask = async (req, res, next) => {
  try {
    const task = await taskService.update(req.params.id, req.user.id, req.body);
    return success(res, task, 'Tarea actualizada correctamente');
  } catch (err) {
    return next(err);
  }
};

const completeTask = async (req, res, next) => {
  try {
    const task = await taskService.complete(req.params.id, req.user.id);
    return success(res, task, 'Tarea completada correctamente');
  } catch (err) {
    return next(err);
  }
};

const deleteTask = async (req, res, next) => {
  try {
    await taskService.remove(req.params.id, req.user.id);
    return success(res, null, 'Tarea eliminada correctamente');
  } catch (err) {
    return next(err);
  }
};

module.exports = { listTasks, getTask, createTask, updateTask, completeTask, deleteTask };
