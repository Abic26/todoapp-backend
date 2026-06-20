const { Sequelize } = require('sequelize');
const env = require('./env');

const options = {
  dialect: 'postgres',
  logging: env.nodeEnv === 'development' ? console.log : false,
  dialectOptions: env.database.ssl
    ? { ssl: { require: true, rejectUnauthorized: false } }
    : {},
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
};

const sequelize = env.database.url
  ? new Sequelize(env.database.url, options)
  : new Sequelize(env.database.name, env.database.user, env.database.password, {
      ...options,
      host: env.database.host,
      port: env.database.port,
    });

module.exports = sequelize;
