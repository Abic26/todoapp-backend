const sequelize = require('../config/database');
const User = require('./User');
const TodoTask = require('./TodoTask');

User.hasMany(TodoTask, {
  foreignKey: 'userId',
  as: 'tasks',
  onDelete: 'CASCADE',
});

TodoTask.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

module.exports = { sequelize, User, TodoTask };
