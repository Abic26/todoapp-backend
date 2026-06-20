const app = require('./app');
const env = require('./config/env');
const { sequelize } = require('./models');
const { startReminderScheduler } = require('./services/reminderService');

let server;
let scheduler;

const start = async () => {
  try {
    env.validateEnvironment();
    await sequelize.authenticate();
    console.log('Conexión con PostgreSQL establecida.');

    if (env.database.sync) {
      await sequelize.sync({ alter: env.database.alter });
      console.log('Modelos de Sequelize sincronizados.');
    }

    scheduler = startReminderScheduler();
    server = app.listen(env.port, () => {
      console.log(`TODoApp API ejecutándose en http://localhost:${env.port}`);
    });
  } catch (error) {
    console.error(`No fue posible iniciar el servidor: ${error.message}`);
    if (env.nodeEnv === 'development' && error.original?.message) {
      console.error(`Detalle PostgreSQL: ${error.original.message}`);
    }
    process.exit(1);
  }
};

const shutdown = async (signal) => {
  console.log(`${signal} recibido. Cerrando TODoApp API...`);
  if (scheduler) scheduler.stop();
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  await sequelize.close();
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

start();
