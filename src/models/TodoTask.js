const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TodoTask = sequelize.define(
  'TodoTask',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: { notEmpty: true },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    category: {
      type: DataTypes.ENUM('Personal', 'Trabajo', 'Universidad'),
      allowNull: false,
      defaultValue: 'Personal',
    },
    priority: {
      type: DataTypes.ENUM('Alta', 'Media', 'Baja'),
      allowNull: false,
      defaultValue: 'Media',
    },
    status: {
      type: DataTypes.ENUM('PENDING', 'COMPLETED', 'CANCELLED'),
      allowNull: false,
      defaultValue: 'PENDING',
    },
    reminderDateTime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    reminderSentAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Evita el envío duplicado de recordatorios automáticos.',
    },
    source: {
      type: DataTypes.ENUM('APP', 'WHATSAPP'),
      allowNull: false,
      defaultValue: 'APP',
    },
    whatsappNumber: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },
  },
  {
    tableName: 'todo_tasks',
    timestamps: true,
    indexes: [
      { fields: ['userId'] },
      { fields: ['status', 'reminderDateTime', 'reminderSentAt'] },
    ],
  },
);

module.exports = TodoTask;
